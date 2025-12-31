import type { grammar, rule, rule_quantifier, space_rule_term } from "./grammar_parser";

// ============================================================================
// Types
// ============================================================================

export type LogMessage = {
	severity: "error" | "warning" | "info";
	location: string; // file:line:col
	messageType: "syntax error" | "syntax info" | "reference error" | "reference warning";
	message: string;
	matchedPattern: string;
};

export type ValidationResult = {
	errors: LogMessage[];
	others: LogMessage[];
};

// ============================================================================
// Syntax Checking
// ============================================================================

/**
 * Checks syntax errors in the raw grammar text.
 * This should be called before parsing.
 */
export function checkSyntaxInText(grammarText: string, filePath: string): LogMessage[] {
	const errors: LogMessage[] = [];

	const indexToLineCol = (textIndex: number) => {
		const lineBreakBefore = textIndex === 0 ? -1 : grammarText.lastIndexOf("\n", textIndex - 1);
		return {
			line: lineBreakBefore === -1 ? 1 : grammarText.slice(0, lineBreakBefore + 1).match(/\n/g)!.length + 1,
			col: textIndex - lineBreakBefore,
		};
	};

	let matches: RegExpMatchArray | null;

	// Check that grammar has at least one rule
	if (!grammarText.match(/^[a-z][a-z_]*:/gm)) {
		errors.push({
			severity: "error",
			location: `${filePath}:1:1`,
			messageType: "syntax error",
			message: "grammar must have at least one rule",
			matchedPattern: "",
		});
	}

	// Check for uppercase letters
	if ((matches = grammarText.match(/[A-Z]/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(grammarText.indexOf(match));
			errors.push({
				severity: "error",
				location: `${filePath}:${line}:${col}`,
				messageType: "syntax error",
				message: "uppercase",
				matchedPattern: match,
			});
		}
	}

	// Check for multiple spaces
	if ((matches = grammarText.match(/  +/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(grammarText.indexOf(match));
			errors.push({
				severity: "error",
				location: `${filePath}:${line}:${col}`,
				messageType: "syntax error",
				message: "multiple spaces",
				matchedPattern: match,
			});
		}
	}

	// Check for space in rule name
	if ((matches = grammarText.match(/^[a-z][a-z_]* [a-z_]*/gm))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(grammarText.indexOf(match));
			errors.push({
				severity: "error",
				location: `${filePath}:${line}:${col}`,
				messageType: "syntax error",
				message: "space in rule name",
				matchedPattern: match,
			});
		}
	}

	// Check for regex with quantifier
	if ((matches = grammarText.match(/\/(\\\/|[^\/])*\/[+*?]/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(grammarText.indexOf(match));
			errors.push({
				severity: "error",
				location: `${filePath}:${line}:${col}`,
				messageType: "syntax error",
				message: "regex with quantifier",
				matchedPattern: match,
			});
		}
	}

	// Check for or rule with quantifier
	if ((matches = grammarText.match(/[a-z][a-z_]*[+*?] \| [a-z][a-z_]*|[a-z][a-z_]* \| [a-z][a-z_]*[+*?]/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(grammarText.indexOf(match));
			errors.push({
				severity: "error",
				location: `${filePath}:${line}:${col}`,
				messageType: "syntax error",
				message: "or rule with quantifier",
				matchedPattern: match,
			});
		}
	}

	// Check for item of array rule with quantifier different from '?'
	if ((matches = grammarText.match(/[a-z][a-z_]*[+*] >>/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(grammarText.indexOf(match));
			errors.push({
				severity: "error",
				location: `${filePath}:${line}:${col}`,
				messageType: "syntax error",
				message: "item of array rule with quantifier different from '?'",
				matchedPattern: match,
			});
		}
	}

	// Check for join of array rule with quantifier
	if ((matches = grammarText.match(/>> [a-z][a-z_]*[+*?]/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(grammarText.indexOf(match));
			errors.push({
				severity: "error",
				location: `${filePath}:${line}:${col}`,
				messageType: "syntax error",
				message: "join of array rule with quantifier",
				matchedPattern: match,
			});
		}
	}

	// Check for invalid regex
	if ((matches = grammarText.match(/\/(\\\/|[^\/])*\//g))) {
		for (const match of matches) {
			try {
				new RegExp(match);
			} catch (error) {
				const { line, col } = indexToLineCol(grammarText.indexOf(match));
				errors.push({
					severity: "error",
					location: `${filePath}:${line}:${col}`,
					messageType: "syntax error",
					message: "invalid regex",
					matchedPattern: match,
				});
			}
		}
	}

	// Check for successive regex
	if ((matches = grammarText.match(/\/(\\\/|[^\/])*\/ \//g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(grammarText.indexOf(match));
			errors.push({
				severity: "info",
				location: `${filePath}:${line}:${col}`,
				messageType: "syntax info",
				message: "successive regex",
				matchedPattern: match,
			});
		}
	}

	return errors;
}

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
	// Note: Syntax validation should be done before parsing (using checkSyntaxInText)
	checkReferences(parsedGrammar, filePath, validationResult);

	return validationResult;
}

// ============================================================================
// Reference Checking
// ============================================================================

function checkReferences(parsedGrammar: grammar, filePath: string, { errors, others }: ValidationResult) {
	const isHardQuantifier = (quantifier: rule_quantifier | undefined) =>
		!quantifier ||
		(quantifier.value.type === "rule_basic_quantifier" && quantifier.value.value === "+") ||
		(quantifier.value.type === "rule_brace_quantifier" && Number(quantifier.value.rule_brace_min.value) > 0);

	const softReferenceListMap: Record<string, string[]> = {};
	const hardReferenceListMap: Record<string, string[]> = {};

	const handleSpaceRuleTerm = (space_rule_term: space_rule_term, key: string) => {
		if (space_rule_term.rule_term.value.type !== "rule_name_quantified") return;
		const childKey = space_rule_term.rule_term.value.rule_name.value;
		const quantifier = space_rule_term.rule_term.value.rule_quantifier;
		if (isHardQuantifier(quantifier)) hardReferenceListMap[key].push(childKey);
		else softReferenceListMap[key].push(childKey);
	};

	// Extract rules from lines
	const rules: rule[] = parsedGrammar.line
		.filter((line): line is { type: "line"; value: rule } => line.value.type === "rule")
		.map((line) => line.value);

	// Build reference maps
	for (const rule of rules) {
		const key = rule.rule_name.value;
		softReferenceListMap[key] = [];
		hardReferenceListMap[key] = [];
		if (rule.rule_expr.value.type === "first_rule_regex") {
			for (const space_rule_term of rule.rule_expr.value.space_rule_term) handleSpaceRuleTerm(space_rule_term, key);
		} else {
			const first_rule_name = rule.rule_expr.value.rule_name.value;
			const rest_rule_name = rule.rule_expr.value.rest_rule_name.value;
			if (rest_rule_name.type === "rule_name_with_or") {
				softReferenceListMap[key].push(first_rule_name);
				for (const space_rule_name of rest_rule_name.space_rule_name) {
					const childKey = space_rule_name.rule_name.value;
					softReferenceListMap[key].push(childKey);
				}
			} else if (rest_rule_name.type === "rule_name_as_item") {
				if (rest_rule_name.rule_first_item_optional.value === "+") hardReferenceListMap[key].push(first_rule_name);
				else softReferenceListMap[key].push(first_rule_name);
			} else {
				if (isHardQuantifier(rest_rule_name.rule_quantifier)) hardReferenceListMap[key].push(first_rule_name);
				else softReferenceListMap[key].push(first_rule_name);
				for (const space_rule_term of rest_rule_name.space_rule_term) handleSpaceRuleTerm(space_rule_term, key);
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
		for (const v of hardReferenceListMap[key]) {
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
