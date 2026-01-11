import type {
	grammar,
	rule,
	rule_name,
	rule_name_quantified,
	rule_regex,
	space_rule_term,
	spacing_policy,
} from "./grammar_parser";

// ============================================================================
// Types
// ============================================================================

type DefineTypeType = "value" | "item" | "default";

type RegexContent = {
	type: "regex";
	regexContent: string;
	bNegation: boolean;
	skipSpace: boolean;
	ignoreCase: boolean;
	multiline: boolean;
};
type NegativeRuleNameContent = {
	type: "negative_rule_name";
	rule_name: string;
};
type RuleOrContent = {
	type: "rule_or";
	rule_name: string;
};
type ItemContent = {
	type: "item";
	rule_name: string;
	bOptional: boolean;
	join: rule_regex | rule_name;
	isJoinRegex: boolean;
};
type Content = RegexContent | NegativeRuleNameContent | rule_name_quantified | RuleOrContent | ItemContent;

// ============================================================================
// Generator Module
// ============================================================================

/**
 * Generates TypeScript parser code from a parsed grammar AST.
 */
export function generateCode(parsedGrammar: grammar): string {
	const code: string[] = [];
	const parseCode = [`\n`];
	const createCode = [`\n`];

	// Initialize code with helper functions
	code.push(getHelperFunctions());

	// Code generation state
	let indentCode = "\n";
	const incrIndentCode = () => (indentCode += "\t");
	const decrIndentCode = () => (indentCode = indentCode.slice(0, -1));
	const newLineCode = () => code.push(indentCode);

	let indentParseCode = "\n";
	const incrIndentParseCode = () => (indentParseCode += "\t");
	const decrIndentParseCode = () => (indentParseCode = indentParseCode.slice(0, -1));
	const newLineParseCode = () => parseCode.push(indentParseCode);

	// Extract rules from lines
	const rules: (rule | spacing_policy)[] = parsedGrammar.line
		.filter(
			(line): line is { type: "line"; value: rule | spacing_policy } =>
				line.value.type === "rule" || line.value.type === "spacing_policy"
		)
		.map((line) => line.value);

	let defaultSkipSpace = false;
	// Generate types and parsers for each rule
	for (const rule of rules) {
		if (rule.type === "spacing_policy") {
			defaultSkipSpace = rule.spacing_policy_value.value === '"loose"';
			continue;
		}
		const expr = rule.rule_expr.value;
		if (expr.type === "first_rule_negation") {
			const contentArray: Content[] = [];
			if (expr.rule_name_or_regex.value.type === "rule_regex")
				contentArray.push(getRegexContent(expr.rule_name_or_regex.value, true, defaultSkipSpace));
			else {
				// rule_name
				contentArray.push({ type: "negative_rule_name", rule_name: expr.rule_name_or_regex.value.value });
			}
			processSpaceRuleTerms(expr.space_rule_term, contentArray);
			defineType(rule.rule_name.value, "default", contentArray);
		} else if (expr.type === "first_rule_regex") {
			const type: DefineTypeType = expr.space_rule_term.length === 0 ? "value" : "default";
			const contentArray: Content[] = [getRegexContent(expr.rule_regex, false, defaultSkipSpace)];
			processSpaceRuleTerms(expr.space_rule_term, contentArray);
			defineType(rule.rule_name.value, type, contentArray);
		} else {
			// first_rule_name
			if (expr.rest_rule_name.value.type === "rule_name_with_or") {
				const contentArray: Content[] = [{ type: "rule_or", rule_name: expr.rule_name.value }];
				for (const space_rule_name of expr.rest_rule_name.value.space_rule_name)
					contentArray.push({ type: "rule_or", rule_name: space_rule_name.rule_name.value });
				defineType(rule.rule_name.value, "default", contentArray);
			} else if (expr.rest_rule_name.value.type === "rule_name_as_item") {
				const rule_name_or_regex = expr.rest_rule_name.value.rule_name_or_regex.value;
				const join = rule_name_or_regex;
				const contentArray: Content[] = [
					{
						type: "item",
						rule_name: expr.rule_name.value,
						isJoinRegex: rule_name_or_regex.type === "rule_regex",
						join: join,
						bOptional: !!expr.rest_rule_name.value.rule_item_optional,
					},
				];
				defineType(rule.rule_name.value, "default", contentArray);
			} else {
				// rule_name_as_term
				const first_rule_name: rule_name_quantified = {
					type: "rule_name_quantified",
					rule_name: { type: "rule_name", value: expr.rule_name.value },
					rule_quantifier: expr.rest_rule_name.value.rule_quantifier,
				};
				const contentArray: Content[] = [first_rule_name];
				processSpaceRuleTerms(expr.rest_rule_name.value.space_rule_term, contentArray);
				defineType(rule.rule_name.value, "default", contentArray);
			}
		}
	}

	const firstRuleName = rules.find((rule): rule is rule => rule.type === "rule")?.rule_name.value;

	// Generate main parse function
	newLineParseCode();
	parseCode.push(`
export const parse = (textToParse: string, filePath = "", onFail?: (result: ${firstRuleName}) => void) => {
	path = filePath;
	text = textToParse;
	index = 0;
	const result = create_${firstRuleName}();
	successValues.length = 0;
	failedValues.length = 0;
	try {`);
	incrIndentParseCode();
	incrIndentParseCode();
	newLineParseCode();
	parseCode.push(`parse_${firstRuleName}(result);`);
	newLineParseCode();
	parseCode.push(`if (index !== text.length) {
			const { line, col } = indexToLineCol(index);
			throw new Error(\`Text not fully parsed, interrupted at index \${index} (\${path ? \`\${path}:\` : ""}\${line}:\${col})\`);
		}
		logs.length = 0;
		logs.push(...successValues, ...failedValues);
		return result;`);
	decrIndentParseCode();
	newLineParseCode();
	parseCode.push(`} catch (error) {
		logs.length = 0;
		logs.push(...successValues, ...failedValues);
		onFail?.(result);
		throw error;
	}
};`);
	decrIndentParseCode();
	newLineParseCode();

	return [...code, ...createCode, ...parseCode].join("");

	// ============================================================================
	// Helper Functions
	// ============================================================================

	function getRegexContent(rule_regex: rule_regex, bNegation: boolean, defaultSkipSpace: boolean): RegexContent {
		const regexContent = rule_regex.rule_regex_content.value;
		const regexFlags = rule_regex.rule_regex_flags.value;
		return {
			type: "regex",
			regexContent: regexContent,
			bNegation: bNegation,
			skipSpace: defaultSkipSpace ? !regexFlags.includes("s") : regexFlags.includes("l"),
			ignoreCase: regexFlags.includes("i"),
			multiline: regexFlags.includes("m"),
		};
	}

	function processSpaceRuleTerms(space_rule_term_list: space_rule_term[], contentArray: Content[]) {
		for (const space_rule_term of space_rule_term_list) {
			const rule_term = space_rule_term.rule_term.value;
			if (rule_term.type === "rule_term_negative") {
				if (rule_term.rule_name_or_regex.value.type === "rule_regex")
					contentArray.push(getRegexContent(rule_term.rule_name_or_regex.value, true, defaultSkipSpace));
				else {
					// rule_name
					contentArray.push({ type: "negative_rule_name", rule_name: rule_term.rule_name_or_regex.value.value });
				}
			} else {
				// rule_term_positive
				if (rule_term.value.type === "rule_regex") contentArray.push(getRegexContent(rule_term.value, false, defaultSkipSpace));
				else {
					// rule_name_quantified
					contentArray.push(rule_term.value);
				}
			}
		}
	}

	function defineType(typeName: string, type: DefineTypeType, contentArray: Content[]) {
		if (contentArray[0]?.type === "item") {
			const baseContent: Content = {
				type: "rule_name_quantified",
				rule_name: { type: "rule_name", value: contentArray[0].rule_name },
			};
			if (contentArray[0].isJoinRegex)
				defineType(`${typeName}_item`, "item", [
					baseContent,
					getRegexContent(contentArray[0].join as rule_regex, false, defaultSkipSpace),
				]);
			else
				defineType(`${typeName}_item`, "item", [
					baseContent,
					{
						type: "rule_name_quantified",
						rule_name: contentArray[0].join as rule_name,
					},
				]);
		}

		newLineCode();
		code.push(`export type ${typeName} = {`);
		incrIndentCode();
		newLineCode();
		code.push(`type: "${typeName}";`);

		newLineParseCode();
		parseCode.push(`const parse_${typeName} = (${typeName}: ${typeName}) => {`);
		incrIndentParseCode();
		newLineParseCode();
		parseCode.push(`debugName = "${typeName}";`);

		let createFnCode = `\nconst create_${typeName} = (): ${typeName} => ({ type: "${typeName}"`;

		if (contentArray[0]?.type === "rule_or") {
			newLineCode();
			code.push(`value: ${contentArray.map((content) => (content as RuleOrContent).rule_name).join(" | ")};`);
			createFnCode += `, value: create_${contentArray[0].rule_name}()`;
		}

		for (let i = 0; i < contentArray.length; i++) {
			const content = contentArray[i];
			if (content.type === "regex") {
				newLineParseCode();
				if (type === "item") {
					// if type is "item", only join can be regex
					parseCode.push(
						`if (try_parse_fn(parse_regex, reg\`${content.regexContent}\`, ${content.skipSpace}, ${content.ignoreCase}, ${content.multiline})) return true;`
					);
					newLineParseCode();
					parseCode.push(`return false;`);
				} else {
					if (content.bNegation)
						parseCode.push(
							`if (try_parse_fn(parse_regex, reg\`${content.regexContent}\`, ${content.skipSpace}, ${content.ignoreCase}, ${content.multiline})) throw new Error("Match should be failed: ${content.regexContent}");`
						);
					else {
						if (type === "value") {
							newLineCode();
							code.push(`value: string;`);
							createFnCode += `, value: ""`;
							parseCode.push(`${typeName}.value = `);
						}
						parseCode.push(
							`parse_regex(reg\`${content.regexContent}\`, ${content.skipSpace}, ${content.ignoreCase}, ${content.multiline});`
						);
					}
				}
			} else if (content.type === "negative_rule_name") {
				newLineParseCode();
				const ruleName = content.rule_name;
				parseCode.push(
					`if (try_parse_fn(parse_${ruleName}, create_${ruleName}())) throw new Error("Match should be failed: ${ruleName}");`
				);
			} else if (content.type === "rule_name_quantified") {
				newLineCode();
				newLineParseCode();
				const ruleName = content.rule_name.value;
				const childName = `${typeName}.${ruleName}`;
				if (content.rule_quantifier?.value.type === "rule_basic_quantifier") {
					if (content.rule_quantifier?.value.value === "?") {
						code.push(`${ruleName}?: ${ruleName};`);
						parseCode.push(`${childName} = create_${ruleName}();`);
						newLineParseCode();
						parseCode.push(`if (!try_parse_fn(parse_${ruleName}, ${childName})) ${childName} = undefined;`);
					} else {
						code.push(`${ruleName}: ${ruleName}[];`);
						createFnCode += `, ${ruleName}: []`;
						const min = content.rule_quantifier?.value.value === "+" ? 1 : 0;
						parseCode.push(`parse_array_fn(parse_${ruleName}, ${childName}, create_${ruleName}, ${min});`);
					}
				} else if (content.rule_quantifier?.value.type === "rule_brace_quantifier") {
					code.push(`${ruleName}: ${ruleName}[];`);
					createFnCode += `, ${ruleName}: []`;
					const min = content.rule_quantifier.value.rule_brace_min.value;
					const hasMax = !!content.rule_quantifier.value.rule_brace_max;
					const max =
						content.rule_quantifier.value.rule_brace_max?.rule_brace_max_value?.value ??
						(hasMax ? "Number.MAX_SAFE_INTEGER" : min);
					parseCode.push(`parse_array_fn(parse_${ruleName}, ${childName}, create_${ruleName}, ${min}, ${max});`);
				} else {
					code.push(`${ruleName}: ${ruleName};`);
					createFnCode += `, ${ruleName}: create_${ruleName}()`;
					if (i !== 0 && type === "item") {
						// if type is "item", first is item, second is join
						parseCode.push(`if (try_parse_fn(parse_${ruleName}, ${childName})) return true;`);
						newLineParseCode();
						parseCode.push(`return false;`);
					} else parseCode.push(`parse_${ruleName}(${childName});`);
				}
			} else if (content.type === "rule_or") {
				newLineParseCode();
				parseCode.push(`${typeName}.value = create_${content.rule_name}();`);
				newLineParseCode();
				parseCode.push(`if (try_parse_fn(parse_${content.rule_name}, ${typeName}.value)) return;`);
			} else if (content.type === "item") {
				newLineCode();
				code.push(`value: ${typeName}_item[];`);
				createFnCode += `, value: []`;
				const min = content.bOptional ? 0 : 1;
				newLineParseCode();
				parseCode.push(`parse_array_fn(parse_${typeName}_item, ${typeName}.value, create_${typeName}_item, ${min});`);
			}
		}

		if (contentArray[0]?.type === "rule_or") {
			newLineParseCode();
			parseCode.push(`fail_parse("Failed to parse ${typeName}");`);
		}

		createCode.push(`${createFnCode} });`);

		decrIndentParseCode();
		newLineParseCode();
		parseCode.push(`};`);

		decrIndentCode();
		newLineCode();
		code.push(`};`);
	}
}

function getHelperFunctions(): string {
	return `export type LogValue = { debugName: string; rgx: string; status: string; index: number; location: string; text: string };
const successValues: LogValue[] = [];
const failedValues: LogValue[] = [];
export const logs: LogValue[] = [];
let index = 0;
let text = "";
let debugName = "";
let path = "";
const indexToLineCol = (textIndex: number) => {
	const lineBreakBefore = textIndex === 0 ? -1 : text.lastIndexOf("\\n", textIndex - 1);
	return {
		line: lineBreakBefore === -1 ? 1 : text.slice(0, lineBreakBefore + 1).match(/\\n/g)!.length + 1,
		col: textIndex - lineBreakBefore,
	};
};
const try_parse_fn = <T extends any[]>(parse_fn: (...args: T) => void | boolean | string, ...args: T) => {
	const current_index = index;
	try {
		if (parse_fn(...args) === false) return "stop";
		return true;
	} catch {
		index = current_index;
		return false;
	}
};
const parse_array_fn = <T>(
	parse_fn: (arg: T) => void,
	arg: T[],
	create_fn: () => T,
	min: number,
	max = Number.MAX_SAFE_INTEGER
) => {
	let obj = create_fn();
	for (let i = 0; i < min; i++) {
		parse_fn(obj);
		arg.push(obj);
		obj = create_fn();
	}
	for (let i = min; i < max && try_parse_fn(parse_fn, obj) !== false; i++) {
		arg.push(obj);
		obj = create_fn();
	}
};
const fail_parse = (message: string) => {
	throw new Error(message);
};
const reg = (strings: TemplateStringsArray, ...keys: RegExp[]) => {
	const result = [strings.raw[0]];
	for (let i = 0; i < keys.length; i++) result.push(keys[i].source, strings.raw[i + 1]);
	return new RegExp(result.join("").slice(1, -1));
};
const parse_regex = (rgx: RegExp, skipSpace: boolean, ignoreCase: boolean, multiline: boolean) => {
	const flags = "gy" + (ignoreCase ? "i" : "") + (multiline ? "m" : "");
	if (skipSpace) {
		const spaceRegex = /\\s*/gy;
		spaceRegex.lastIndex = index;
		const matches = spaceRegex.exec(text);
		if (matches) index = matches.index + matches[0].length;
	}
	const newRgx = new RegExp(rgx.source, flags);
	newRgx.lastIndex = index;
	const matches = newRgx.exec(text);
	if (!matches) {
		const { line, col } = indexToLineCol(index);
		failedValues.push({
			debugName: debugName,
			rgx: rgx.source,
			status: "false",
			index: index,
			location: \`\${path ? \`\${path}:\` : ""}\${line}:\${col}\`,
			text: text
				.slice(index, index + 25)
				.replace(/\\r?\\n/g, "\\\\n")
				.replace(/\\t/g, "\\\\t")
				.replace(/^(\\\\t|\\\\n)*/g, ""),
		});
		throw new Error(\`Match failed: \${rgx.source}\`);
	}
	if (matches) {
		index = matches.index + matches[0].length;
		failedValues.length = 0;
		const { line, col } = indexToLineCol(index);
		successValues.push({
			debugName: debugName,
			rgx: rgx.source,
			status: "true",
			index: index,
			location: \`\${path ? \`\${path}:\` : ""}\${line}:\${col}\`,
			text: text
				.slice(index, index + 25)
				.replace(/\\r?\\n/g, "\\\\n")
				.replace(/\\t/g, "\\\\t")
				.replace(/^(\\\\t|\\\\n)*/g, ""),
		});
	}
	return matches[0];
};
`;
}
