import type { grammar, rule_name_quantified } from "./grammar_parser";

// ============================================================================
// Types
// ============================================================================

type DefineTypeType = "value" | "item" | "default";

type RegexContent = {
	type: "regex";
	regex: string;
};
type RuleOrContent = {
	type: "rule_or";
	rule_name: string;
};
type ItemContent = {
	type: "item";
	rule_name: string;
	bOptional: boolean;
	join: string;
	isJoinRegex: boolean;
};
type Content = RegexContent | rule_name_quantified | RuleOrContent | ItemContent;

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

	// Generate types and parsers for each rule
	for (const rule of parsedGrammar.rule) {
		const expr = rule.rule_expr.value;
		if (expr.type === "first_rule_regex") {
			const type: DefineTypeType = expr.space_rule_term.length === 0 ? "value" : "default";
			const contentArray: Content[] = [{ type: "regex", regex: expr.rule_regex.value }];
			for (const space_rule_term of expr.space_rule_term) {
				if (space_rule_term.rule_term.value.type === "rule_regex")
					contentArray.push({ type: "regex", regex: space_rule_term.rule_term.value.value });
				else {
					// rule_name_quantified
					contentArray.push(space_rule_term.rule_term.value);
				}
			}
			defineType(rule.rule_name.value, type, contentArray);
		} else {
			// first_rule_name
			if (expr.rest_rule_name.value.type === "rule_name_with_or") {
				const contentArray: Content[] = [{ type: "rule_or", rule_name: expr.rule_name.value }];
				for (const space_rule_name of expr.rest_rule_name.value.space_rule_name)
					contentArray.push({ type: "rule_or", rule_name: space_rule_name.rule_name.value });
				defineType(rule.rule_name.value, "default", contentArray);
			} else if (expr.rest_rule_name.value.type === "rule_name_as_item") {
				const rule_join = expr.rest_rule_name.value.rule_join.value;
				const join = rule_join.value;
				const contentArray: Content[] = [
					{
						type: "item",
						rule_name: expr.rule_name.value,
						isJoinRegex: rule_join.type === "rule_regex",
						join: join,
						bOptional: !!expr.rest_rule_name.value.rule_first_item_optional.value,
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
				for (const space_rule_term of expr.rest_rule_name.value.space_rule_term) {
					if (space_rule_term.rule_term.value.type === "rule_regex")
						contentArray.push({ type: "regex", regex: space_rule_term.rule_term.value.value });
					else {
						// rule_name_quantified
						contentArray.push(space_rule_term.rule_term.value);
					}
				}
				defineType(rule.rule_name.value, "default", contentArray);
			}
		}
	}

	// Generate main parse function
	newLineParseCode();
	parseCode.push(`
export const parse = (textToParse: string, onFail?: (result: ${parsedGrammar.rule[0].rule_name.value}) => void) => {
	text = textToParse;
	index = 0;
	const result = create_${parsedGrammar.rule[0].rule_name.value}();
	successValues.length = 0;
	failedValues.length = 0;
	try {`);
	incrIndentParseCode();
	incrIndentParseCode();
	newLineParseCode();
	parseCode.push(`parse_${parsedGrammar.rule[0].rule_name.value}(result);`);
	newLineParseCode();
	parseCode.push(`logs.length = 0;
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

	function defineType(typeName: string, type: DefineTypeType, contentArray: Content[]) {
		if (contentArray[0]?.type === "item") {
			const baseContent: Content = {
				type: "rule_name_quantified",
				rule_name: { type: "rule_name", value: contentArray[0].rule_name },
			};
			if (contentArray[0].isJoinRegex)
				defineType(`${typeName}_item`, "item", [baseContent, { type: "regex", regex: contentArray[0].join }]);
			else
				defineType(`${typeName}_item`, "item", [
					baseContent,
					{ type: "rule_name_quantified", rule_name: { type: "rule_name", value: contentArray[0].join } },
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
					parseCode.push(`if (try_parse_fn(parse_regex, reg\`${content.regex}\`)) return true;`);
					newLineParseCode();
					parseCode.push(`return false;`);
				} else {
					if (type === "value") {
						newLineCode();
						code.push(`value: string;`);
						createFnCode += `, value: ""`;
						parseCode.push(`${typeName}.value = `);
					}
					parseCode.push(`parse_regex(reg\`${content.regex}\`);`);
				}
			} else if (content.type === "rule_name_quantified") {
				newLineCode();
				newLineParseCode();
				const childName = `${typeName}.${content.rule_name.value}`;
				if (content.rule_quantifier?.value.type === "rule_basic_quantifier") {
					if (content.rule_quantifier?.value.value === "?") {
						code.push(`${content.rule_name.value}?: ${content.rule_name.value};`);
						parseCode.push(`${childName} = create_${content.rule_name.value}();`);
						newLineParseCode();
						parseCode.push(`if (!try_parse_fn(parse_${content.rule_name.value}, ${childName})) ${childName} = undefined;`);
					} else {
						code.push(`${content.rule_name.value}: ${content.rule_name.value}[];`);
						createFnCode += `, ${content.rule_name.value}: []`;
						const min = content.rule_quantifier?.value.value === "+" ? 1 : 0;
						parseCode.push(
							`parse_array_fn(parse_${content.rule_name.value}, ${childName}, create_${content.rule_name.value}, ${min});`
						);
					}
				} else if (content.rule_quantifier?.value.type === "rule_brace_quantifier") {
					code.push(`${content.rule_name.value}: ${content.rule_name.value}[];`);
					createFnCode += `, ${content.rule_name.value}: []`;
					const min = content.rule_quantifier.value.rule_brace_min.value;
					const hasMax = !!content.rule_quantifier.value.rule_brace_max;
					const max =
						content.rule_quantifier.value.rule_brace_max?.rule_brace_max_value?.value ??
						(hasMax ? "Number.MAX_SAFE_INTEGER" : min);
					parseCode.push(
						`parse_array_fn(parse_${content.rule_name.value}, ${childName}, create_${content.rule_name.value}, ${min}, ${max});`
					);
				} else {
					code.push(`${content.rule_name.value}: ${content.rule_name.value};`);
					createFnCode += `, ${content.rule_name.value}: create_${content.rule_name.value}()`;
					if (i !== 0 && type === "item") {
						// if type is "item", first is item, second is join
						parseCode.push(`if (try_parse_fn(parse_${content.rule_name.value}, ${childName})) return true;`);
						newLineParseCode();
						parseCode.push(`return false;`);
					} else parseCode.push(`parse_${content.rule_name.value}(${childName});`);
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
	return `export type LogValue = { debugName: string; rgx: string; status: string; index: number; text: string };
const successValues: LogValue[] = [];
const failedValues: LogValue[] = [];
export const logs: LogValue[] = [];
let index = 0;
let text = "";
let debugName = "";
const try_parse_fn = <T>(parse_fn: (arg: T) => void | boolean | string, arg: T) => {
	const current_index = index;
	try {
		if (parse_fn(arg) === false) return "stop";
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
const parse_regex = (rgx: RegExp) => {
	let flags = rgx.flags;
	if (!flags.includes("g")) flags += "g";
	if (!flags.includes("y")) flags += "y";
	const newRgx = new RegExp(rgx.source, flags);
	newRgx.lastIndex = index;
	const matches = newRgx.exec(text);
	if (!matches) {
		failedValues.push({
			debugName: debugName,
			rgx: rgx.source,
			status: "false",
			index: index,
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
		successValues.push({
			debugName: debugName,
			rgx: rgx.source,
			status: "true",
			index: index,
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
