import path from "path";
import type { rule_name_quantified, rule_quantifier, space_rule_term } from "./examples/grammar_parser";
import { logs, parse } from "./examples/grammar_parser";

try {
	// const fileName = "../benfy_2/grammar.bf";
	const fileName = "../benfy_2/json.bf";
	const absoluteFileName = path.resolve(__dirname, fileName);
	const text = await Bun.file(fileName).text();

	const indexToLineCol = (textIndex: number) => {
		const lineBreakBefore = textIndex === 0 ? -1 : text.lastIndexOf("\n", textIndex - 1);
		return {
			line: lineBreakBefore === -1 ? 1 : text.slice(0, lineBreakBefore + 1).match(/\n/g)!.length + 1,
			col: textIndex - lineBreakBefore,
		};
	};

	type LogError = {
		location: string; // file:line:col
		errorType: "syntax error" | "reference error" | "reference warning";
		errorMessage: string;
		matchedPattern: string;
	};
	const logErrors: LogError[] = [];
	const displayError = (logError: LogError) =>
		console.log(`${logError.errorType}, ${logError.errorMessage} found: ${logError.matchedPattern}\n\tat ${logError.location}`);

	let matches: RegExpMatchArray | null;
	if ((matches = text.match(/[A-Z]/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(text.indexOf(match));
			logErrors.push({
				location: `${absoluteFileName}:${line}:${col}`,
				errorType: "syntax error",
				errorMessage: "uppercase",
				matchedPattern: match,
			});
		}
	}
	if ((matches = text.match(/  +/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(text.indexOf(match));
			logErrors.push({
				location: `${absoluteFileName}:${line}:${col}`,
				errorType: "syntax error",
				errorMessage: "multiple spaces",
				matchedPattern: match,
			});
		}
	}
	if ((matches = text.match(/^[a-z][a-z_]* [a-z_]*/gm))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(text.indexOf(match));
			logErrors.push({
				location: `${absoluteFileName}:${line}:${col}`,
				errorType: "syntax error",
				errorMessage: "space in rule name",
				matchedPattern: match,
			});
		}
	}
	if ((matches = text.match(/\/(\\\/|[^\/])*\/[+*?]/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(text.indexOf(match));
			logErrors.push({
				location: `${absoluteFileName}:${line}:${col}`,
				errorType: "syntax error",
				errorMessage: "regex with modifier",
				matchedPattern: match,
			});
		}
	}
	if ((matches = text.match(/[a-z][a-z_]*[+*?] \| [a-z][a-z_]*|[a-z][a-z_]* \| [a-z][a-z_]*[+*?]/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(text.indexOf(match));
			logErrors.push({
				location: `${absoluteFileName}:${line}:${col}`,
				errorType: "syntax error",
				errorMessage: "or rule with modifier",
				matchedPattern: match,
			});
		}
	}
	if ((matches = text.match(/[a-z][a-z_]*[+*] >>/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(text.indexOf(match));
			logErrors.push({
				location: `${absoluteFileName}:${line}:${col}`,
				errorType: "syntax error",
				errorMessage: "item of array rule with modifier different from '?'",
				matchedPattern: match,
			});
		}
	}
	if ((matches = text.match(/>> [a-z][a-z_]*[+*?]/g))) {
		for (const match of matches) {
			const { line, col } = indexToLineCol(text.indexOf(match));
			logErrors.push({
				location: `${absoluteFileName}:${line}:${col}`,
				errorType: "syntax error",
				errorMessage: "join of array rule with modifier",
				matchedPattern: match,
			});
		}
	}
	if ((matches = text.match(/\/(\\\/|[^\/])*\//g))) {
		for (const match of matches) {
			try {
				new RegExp(match);
			} catch (error) {
				const { line, col } = indexToLineCol(text.indexOf(match));
				logErrors.push({
					location: `${absoluteFileName}:${line}:${col}`,
					errorType: "syntax error",
					errorMessage: "invalid regex",
					matchedPattern: match,
				});
			}
		}
	}

	if (logErrors.length > 0) {
		// for (const logError of logErrors) {
		// 	displayError(logError);
		// }
		console.table(logErrors);
		console.log("Some syntax errors found, exiting...");
		process.exit(0);
	}

	const result = parse(text, (res) => {
		console.table(logs);
		Bun.write("b.result.json", JSON.stringify(res, null, "\t"));
	});
	Bun.write("b.result.json", JSON.stringify(result, null, "\t"));

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

	for (const rule of result.rule) {
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

	for (const [key, value] of Object.entries(softReferenceListMap)) {
		for (const v of value) {
			if (!softReferenceListMap[v]) {
				logErrors.push({
					location: `${absoluteFileName}`, // TODO: line and col
					errorType: "reference error",
					errorMessage: "invalid rule reference",
					matchedPattern: `${key} -> ${v}`,
				});
			}
		}
	}
	for (const [key, value] of Object.entries(hardReferenceListMap)) {
		for (const v of value) {
			if (!softReferenceListMap[v]) {
				logErrors.push({
					location: `${absoluteFileName}`, // TODO: line and col
					errorType: "reference error",
					errorMessage: "invalid rule reference",
					matchedPattern: `${key} -> ${v}`,
				});
			}
		}
	}

	const firstRule = result.rule[0].rule_name.value;
	const usedReferenceSet = new Set<string>();

	const addUsedReference = (value: string) => {
		if (usedReferenceSet.has(value)) return;
		usedReferenceSet.add(value);
		for (const v of softReferenceListMap[value] ?? []) addUsedReference(v);
		for (const v of hardReferenceListMap[value] ?? []) addUsedReference(v);
	};
	addUsedReference(firstRule);

	for (const rule of result.rule) {
		if (!usedReferenceSet.has(rule.rule_name.value)) {
			console.log(`reference warning: unused rule reference found: ${rule.rule_name.value}`);
		}
	}

	const circularReferenceSet = new Set<string>();
	const hardReferenceStack: string[] = [];
	const checkHardReference = (key: string) => {
		if (circularReferenceSet.has(key)) return;
		for (const v of hardReferenceListMap[key]) {
			if (hardReferenceStack.includes(v)) {
				logErrors.push({
					location: `${absoluteFileName}`, // TODO: line and col
					errorType: "reference error",
					errorMessage: "circular reference",
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

	if (logErrors.length > 0) {
		// for (const logError of logErrors) {
		// 	displayError(logError);
		// }
		console.table(logErrors);
		console.log("Some reference errors found, exiting...");
		process.exit(0);
	}

	let code = [
		`export type LogValue = { debugName: string; rgx: string; status: string; index: number; text: string };
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
`,
	];

	let indentCode = "\n";
	const incrIndentCode = () => (indentCode += "\t");
	const decrIndentCode = () => (indentCode = indentCode.slice(0, -1));
	const newLineCode = () => code.push(indentCode);

	const parseCode = [`\n`];

	let indentParseCode = "\n";
	const incrIndentParseCode = () => (indentParseCode += "\t");
	const decrIndentParseCode = () => (indentParseCode = indentParseCode.slice(0, -1));
	const newLineParseCode = () => parseCode.push(indentParseCode);

	const createCode = [`\n`];

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

	const defineType = (typeName: string, type: DefineTypeType, contentArray: Content[]) => {
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
	};

	for (const rule of result.rule) {
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

	newLineParseCode();
	parseCode.push(`
export const parse = (textToParse: string, onFail?: (result: ${result.rule[0].rule_name.value}) => void) => {
	text = textToParse;
	index = 0;
	const result = create_${result.rule[0].rule_name.value}();
	successValues.length = 0;
	failedValues.length = 0;
	try {`);
	incrIndentParseCode();
	incrIndentParseCode();
	newLineParseCode();
	parseCode.push(`parse_${result.rule[0].rule_name.value}(result);`);
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

	// await Bun.write("a.ts", [...code, ...createCode, ...parseCode].join(""));
	await Bun.write("json_parse.ts", [...code, ...createCode, ...parseCode].join(""));
} catch (error) {
	console.log(error);
	console.table(logs);
}
