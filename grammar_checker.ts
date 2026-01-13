import type { grammar, rule, rule_quantifier, space_rule_term, spacing_policy } from "./grammar_parser";

// ============================================================================
// Types
// ============================================================================

export type LogMessage = {
	severity: "error" | "warning" | "info";
	location: string; // file:line:col
	messageType: "syntax error" | "reference error" | "reference warning" | "reference info";
	message: string;
	matchedPattern: string;
};

export type ValidationResult = {
	errors: LogMessage[];
	others: LogMessage[];
};

// ============================================================================
// Rule Checker Module
// ============================================================================

/**
 * Validates a parsed grammar for syntax errors and reference issues.
 * Returns errors (which should stop generation) and others (which are informational).
 */
export function checkRules(parsedGrammar: grammar, filePath: string): ValidationResult {
	const validationResult: ValidationResult = {
		errors: [],
		others: [],
	};

	// Step 1: Reference validation
	checkReferences(parsedGrammar, filePath, validationResult);

	return validationResult;
}

// ============================================================================
// Reference Checking
// ============================================================================

function checkReferences(parsedGrammar: grammar, filePath: string, { errors, others }: ValidationResult) {
	// Extract rules from lines
	const rules: rule[] = parsedGrammar.line
		.filter((line): line is { type: "line"; value: rule } => line.value.type === "rule")
		.map((line) => line.value);

	if (rules.length === 0) {
		errors.push({
			severity: "error",
			location: `${filePath}`, // TODO: line and col
			messageType: "reference error",
			message: "no rules",
			matchedPattern: "",
		});
		return;
	}

	// Check for duplicate rule names
	const ruleNameSet = new Set<string>();
	for (const rule of rules) {
		const ruleName = rule.rule_name.value;
		if (ruleNameSet.has(ruleName)) {
			errors.push({
				severity: "error",
				location: `${filePath}`, // TODO: line and col
				messageType: "reference error",
				message: "duplicate rule name",
				matchedPattern: ruleName,
			});
		} else {
			ruleNameSet.add(ruleName);
		}
	}

	const checkRegex = (regex: string) => {
		try {
			new RegExp(regex);
		} catch (error) {
			errors.push({
				severity: "error",
				location: `${filePath}`, // TODO: line and col
				messageType: "syntax error",
				message: "invalid regex",
				matchedPattern: regex,
			});
		}
	};

	const checkRegexSpaceRuleTermList = (space_rule_term_list: space_rule_term[]) => {
		for (const space_rule_term of space_rule_term_list) {
			const rule_term = space_rule_term.rule_term.value;
			if (rule_term.type === "rule_term_negative") {
				const rule_name_or_regex = rule_term.rule_name_or_regex.value;
				if (rule_name_or_regex.type === "rule_regex") checkRegex(rule_name_or_regex.rule_regex_content.value);
			} else {
				// rule_term_positive
				if (rule_term.value.type === "rule_regex") checkRegex(rule_term.value.rule_regex_content.value);
			}
		}
	};

	// Check that all regexes are valid
	for (const rule of rules) {
		if (rule.rule_expr.value.type === "first_rule_negation") {
			const rule_name_or_regex = rule.rule_expr.value.rule_name_or_regex.value;
			if (rule_name_or_regex.type === "rule_regex") checkRegex(rule_name_or_regex.rule_regex_content.value);
			checkRegexSpaceRuleTermList(rule.rule_expr.value.space_rule_term);
		} else if (rule.rule_expr.value.type === "first_rule_regex") {
			const first_rule_regex = rule.rule_expr.value;
			checkRegex(first_rule_regex.rule_regex.rule_regex_content.value);
			checkRegexSpaceRuleTermList(first_rule_regex.space_rule_term);
		}
	}

	// Check that all rules are different (compare JSON stringify with spacing policy prefix)
	const ruleStrings = new Map<string, string>();
	let currentSpacingPolicy = "strict"; // default is "strict"
	for (const line of parsedGrammar.line) {
		if (line.value.type === "spacing_policy") {
			const spacingPolicy = line.value as spacing_policy;
			currentSpacingPolicy = spacingPolicy.spacing_policy_value.value;
			continue;
		}
		if (line.value.type !== "rule") continue;

		const rule = line.value;
		const ruleString = JSON.stringify(rule);
		const ruleStringWithSpacing = `${currentSpacingPolicy}:${ruleString}`;
		const ruleName = rule.rule_name.value;
		let isDuplicate = false;
		for (const [existingName, existingString] of ruleStrings.entries()) {
			if (ruleStringWithSpacing === existingString) {
				others.push({
					severity: "info",
					location: `${filePath}`, // TODO: line and col
					messageType: "reference info",
					message: "duplicate rule definition",
					matchedPattern: `${ruleName} == ${existingName}`,
				});
				isDuplicate = true;
				break;
			}
		}
		if (!isDuplicate) ruleStrings.set(ruleName, ruleStringWithSpacing);
	}

	const isHardQuantifier = (quantifier: rule_quantifier | undefined) =>
		!quantifier ||
		(quantifier.value.type === "rule_basic_quantifier" && quantifier.value.value === "+") ||
		(quantifier.value.type === "rule_brace_quantifier" && Number(quantifier.value.rule_brace_min.value) > 0);

	const softReferenceListMap: Record<string, string[]> = {};
	const hardReferenceListMap: Record<string, string[]> = {};

	const updateReferenceSpaceRuleTermList = (space_rule_term_list: space_rule_term[], key: string) => {
		for (const space_rule_term of space_rule_term_list) {
			let childKey: string;
			let quantifier: rule_quantifier | undefined = undefined;
			const rule_term = space_rule_term.rule_term.value;
			if (rule_term.type === "rule_term_negative") {
				if (rule_term.rule_name_or_regex.value.type === "rule_regex") continue;
				childKey = rule_term.rule_name_or_regex.value.value;
			} else {
				// rule_term_positive
				if (rule_term.value.type !== "rule_name_quantified") continue;
				childKey = rule_term.value.rule_name.value;
				quantifier = rule_term.value.rule_quantifier;
			}
			if (isHardQuantifier(quantifier)) hardReferenceListMap[key].push(childKey);
			else softReferenceListMap[key].push(childKey);
		}
	};

	// Build reference maps
	for (const rule of rules) {
		const key = rule.rule_name.value;
		softReferenceListMap[key] = [];
		hardReferenceListMap[key] = [];
		if (rule.rule_expr.value.type === "first_rule_negation") {
			const first_rule_negation = rule.rule_expr.value;
			if (first_rule_negation.rule_name_or_regex.value.type === "rule_name")
				softReferenceListMap[key].push(first_rule_negation.rule_name_or_regex.value.value);
			updateReferenceSpaceRuleTermList(first_rule_negation.space_rule_term, key);
		} else if (rule.rule_expr.value.type === "first_rule_regex") {
			updateReferenceSpaceRuleTermList(rule.rule_expr.value.space_rule_term, key);
		} else {
			// first_rule_name
			const first_rule_name = rule.rule_expr.value.rule_name.value;
			const rest_rule_name = rule.rule_expr.value.rest_rule_name.value;
			if (rest_rule_name.type === "rule_name_with_or") {
				softReferenceListMap[key].push(first_rule_name);
				for (const space_rule_name of rest_rule_name.space_rule_name) {
					const childKey = space_rule_name.rule_name.value;
					softReferenceListMap[key].push(childKey);
				}
			} else if (rest_rule_name.type === "rule_name_as_item") {
				softReferenceListMap[key].push(first_rule_name);
				if (rest_rule_name.rule_name_or_regex.value.type === "rule_name")
					softReferenceListMap[key].push(rest_rule_name.rule_name_or_regex.value.value);
			} else {
				if (isHardQuantifier(rest_rule_name.rule_quantifier)) hardReferenceListMap[key].push(first_rule_name);
				else softReferenceListMap[key].push(first_rule_name);
				updateReferenceSpaceRuleTermList(rest_rule_name.space_rule_term, key);
			}
		}
	}

	// Check for invalid rule references
	for (const [key, value] of Object.entries(softReferenceListMap)) {
		for (const v of value) {
			if (!softReferenceListMap[v] && !hardReferenceListMap[v]) {
				errors.push({
					severity: "error",
					location: `${filePath}`, // TODO: line and col
					messageType: "reference error",
					message: "invalid rule reference",
					matchedPattern: `${key} -> ${v}`,
				});
			}
		}
	}
	for (const [key, value] of Object.entries(hardReferenceListMap)) {
		for (const v of value) {
			if (!softReferenceListMap[v] && !hardReferenceListMap[v]) {
				errors.push({
					severity: "error",
					location: `${filePath}`, // TODO: line and col
					messageType: "reference error",
					message: "invalid rule reference",
					matchedPattern: `${key} -> ${v}`,
				});
			}
		}
	}

	// Check for unused rules
	const firstRule = rules[0].rule_name.value;
	const usedReferenceSet = new Set<string>();

	const addUsedReference = (value: string) => {
		if (usedReferenceSet.has(value)) return;
		usedReferenceSet.add(value);
		for (const v of softReferenceListMap[value] ?? []) addUsedReference(v);
		for (const v of hardReferenceListMap[value] ?? []) addUsedReference(v);
	};
	addUsedReference(firstRule);

	for (const rule of rules) {
		if (!usedReferenceSet.has(rule.rule_name.value)) {
			others.push({
				severity: "warning",
				location: `${filePath}`, // TODO: line and col
				messageType: "reference warning",
				message: "unused rule reference",
				matchedPattern: rule.rule_name.value,
			});
		}
	}

	// Check for circular references
	const circularReferenceSet = new Set<string>();
	const hardReferenceStack: string[] = [];
	const checkHardReference = (key: string) => {
		if (circularReferenceSet.has(key)) return;
		for (const v of hardReferenceListMap[key] ?? []) {
			if (hardReferenceStack.includes(v)) {
				errors.push({
					severity: "error",
					location: `${filePath}`, // TODO: line and col
					messageType: "reference error",
					message: "circular reference",
					matchedPattern: `${hardReferenceStack.join(" -> ")} -> ${v}`,
				});
				for (const h of hardReferenceStack) circularReferenceSet.add(h);
				continue;
			}
			hardReferenceStack.push(v);
			checkHardReference(v);
			hardReferenceStack.pop();
		}
	};
	for (const key of Object.keys(hardReferenceListMap)) checkHardReference(key);
}
