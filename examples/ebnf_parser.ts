export type LogValue = { debugName: string; rgx: string; status: string; index: number; location: string; text: string };
const successValues: LogValue[] = [];
const failedValues: LogValue[] = [];
export const logs: LogValue[] = [];
let index = 0;
let text = "";
let debugName = "";
let path = "";
export type _location = {
	index: number;
	line: number;
	col: number;
};
export type _location_object = {};
const getCurrentLocation = (): _location => {
	const lineBreakBefore = index === 0 ? -1 : text.lastIndexOf("\n", index - 1);
	return {
		index: index,
		line: lineBreakBefore === -1 ? 1 : text.slice(0, lineBreakBefore + 1).match(/\n/g)!.length + 1,
		col: index - lineBreakBefore,
	};
};
const getCurrentLocationObject = (): _location_object => ({});
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
	max = Number.MAX_SAFE_INTEGER,
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
const parse_array_join_fn = <T>(parse_fn: (arg: T[]) => void | boolean, arg: T[]) => {
	while (try_parse_fn(parse_fn, arg) === true) {}
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
		const spaceRegex = /\s*/gy;
		spaceRegex.lastIndex = index;
		const matches = spaceRegex.exec(text);
		if (matches) index = matches.index + matches[0].length;
	}
	const prefix = skipSpace && /^(\d|\w|\\[wd])/.test(rgx.source) ? "\\b" : "";
	const suffix = skipSpace && /(\d|\w|\\[wd])$/.test(rgx.source) ? "\\b" : "";
	const source = `${prefix}${rgx.source}${suffix}`;
	const newRgx = new RegExp(source, flags);
	newRgx.lastIndex = index;
	const matches = newRgx.exec(text);
	if (!matches) {
		const { line, col } = getCurrentLocation();
		failedValues.push({
			debugName: debugName,
			rgx: source,
			status: "false",
			index: index,
			location: `${path ? `${path}:` : ""}${line}:${col}`,
			text: text
				.slice(index, index + 25)
				.replace(/\r?\n/g, "\\n")
				.replace(/\t/g, "\\t")
				.replace(/^(\\t|\\n)*/g, ""),
		});
		throw new Error(`Match failed: ${source}`);
	}
	if (matches) {
		failedValues.length = 0;
		const { line, col } = getCurrentLocation();
		successValues.push({
			debugName: debugName,
			rgx: source,
			status: "true",
			index: index,
			location: `${path ? `${path}:` : ""}${line}:${col}`,
			text: text
				.slice(index, index + 25)
				.replace(/\r?\n/g, "\\n")
				.replace(/\t/g, "\\t")
				.replace(/^(\\t|\\n)*/g, ""),
		});
		index = matches.index + matches[0].length;
	}
	return matches[0];
};

export type grammar = _location_object & {
	type: "grammar";
	line: line[];
};
export type line = _location_object & {
	type: "line";
	value: production | comment;
};
export type production = _location_object & {
	type: "production";
	identifier: identifier;
	expression: expression;
};
export type identifier = _location_object & {
	type: "identifier";
	value: string;
};
export type expression_item = _location_object & {
	type: "expression_item";
	expression_join: expression_join;
	term_list: term_list;
};
export type expression = _location_object & {
	type: "expression";
	value: expression_item[];
};
export type term_list_item = _location_object & {
	type: "term_list_item";
	term: term;
};
export type term_list = _location_object & {
	type: "term_list";
	value: term_list_item[];
};
export type term = _location_object & {
	type: "term";
	factor: factor;
	quantifier?: quantifier;
};
export type factor = _location_object & {
	type: "factor";
	value: identifier_no_assignment | terminal | comment | regex_ | hex | character_class | group;
};
export type identifier_no_assignment = _location_object & {
	type: "identifier_no_assignment";
	value: string;
};
export type terminal = _location_object & {
	type: "terminal";
	value: string;
};
export type group = _location_object & {
	type: "group";
	expression: expression;
};
export type regex_ = _location_object & {
	type: "regex_";
	value: string;
};
export type hex = _location_object & {
	type: "hex";
	value: string;
};
export type character_class = _location_object & {
	type: "character_class";
	character_range: character_range[];
};
export type character_range = _location_object & {
	type: "character_range";
	value: string;
};
export type quantifier = _location_object & {
	type: "quantifier";
	value: string;
};
export type expression_join = _location_object & {
	type: "expression_join";
	value: string;
};
export type comment = _location_object & {
	type: "comment";
	value: string;
};

const create_grammar = (): grammar => ({ ...getCurrentLocationObject(), type: "grammar", line: [] });
const create_line = (): line => ({ ...getCurrentLocationObject(), type: "line", value: create_production() });
const create_production = (): production => ({
	...getCurrentLocationObject(),
	type: "production",
	identifier: create_identifier(),
	expression: create_expression(),
});
const create_identifier = (): identifier => ({ ...getCurrentLocationObject(), type: "identifier", value: "" });
const create_expression_item = (): expression_item => ({
	...getCurrentLocationObject(),
	type: "expression_item",
	expression_join: create_expression_join(),
	term_list: create_term_list(),
});
const create_expression = (): expression => ({ ...getCurrentLocationObject(), type: "expression", value: [] });
const create_term_list_item = (): term_list_item => ({
	...getCurrentLocationObject(),
	type: "term_list_item",
	term: create_term(),
});
const create_term_list = (): term_list => ({ ...getCurrentLocationObject(), type: "term_list", value: [] });
const create_term = (): term => ({ ...getCurrentLocationObject(), type: "term", factor: create_factor() });
const create_factor = (): factor => ({ ...getCurrentLocationObject(), type: "factor", value: create_identifier_no_assignment() });
const create_identifier_no_assignment = (): identifier_no_assignment => ({
	...getCurrentLocationObject(),
	type: "identifier_no_assignment",
	value: "",
});
const create_terminal = (): terminal => ({ ...getCurrentLocationObject(), type: "terminal", value: "" });
const create_group = (): group => ({ ...getCurrentLocationObject(), type: "group", expression: create_expression() });
const create_regex_ = (): regex_ => ({ ...getCurrentLocationObject(), type: "regex_", value: "" });
const create_hex = (): hex => ({ ...getCurrentLocationObject(), type: "hex", value: "" });
const create_character_class = (): character_class => ({
	...getCurrentLocationObject(),
	type: "character_class",
	character_range: [],
});
const create_character_range = (): character_range => ({ ...getCurrentLocationObject(), type: "character_range", value: "" });
const create_quantifier = (): quantifier => ({ ...getCurrentLocationObject(), type: "quantifier", value: "" });
const create_expression_join = (): expression_join => ({ ...getCurrentLocationObject(), type: "expression_join", value: "" });
const create_comment = (): comment => ({ ...getCurrentLocationObject(), type: "comment", value: "" });

const parse_grammar = (grammar: grammar) => {
	debugName = "grammar";
	parse_array_fn(parse_line, grammar.line, create_line, 0);
};
const parse_line = (line: line) => {
	debugName = "line";
	line.value = create_production();
	if (try_parse_fn(parse_production, line.value)) return;
	line.value = create_comment();
	if (try_parse_fn(parse_comment, line.value)) return;
	fail_parse("Failed to parse line");
};
const parse_production = (production: production) => {
	debugName = "production";
	parse_identifier(production.identifier);
	parse_regex(reg`/=|::=/`, true, false, false);
	parse_expression(production.expression);
	parse_regex(reg`/;?/`, true, false, false);
};
const parse_identifier = (identifier: identifier) => {
	debugName = "identifier";
	identifier.value = parse_regex(reg`/[a-zA-Z][a-zA-Z0-9_]*|<[a-zA-Z][a-zA-Z0-9_]*>/`, true, false, false);
};
const parse_expression_item = (arg: expression_item[]) => {
	debugName = "expression_item";
	if (arg.length > 0) parse_expression_join(arg.at(-1)!.expression_join);
	const obj = create_expression_item();
	parse_term_list(obj.term_list);
	arg.push(obj);
};
const parse_expression = (expression: expression) => {
	debugName = "expression";
	parse_array_join_fn(parse_expression_item, expression.value);
};
const parse_term_list_item = (arg: term_list_item[]) => {
	debugName = "term_list_item";
	if (arg.length > 0) parse_regex(reg`/,?/`, true, false, false);
	const obj = create_term_list_item();
	parse_term(obj.term);
	arg.push(obj);
};
const parse_term_list = (term_list: term_list) => {
	debugName = "term_list";
	parse_array_join_fn(parse_term_list_item, term_list.value);
};
const parse_term = (term: term) => {
	debugName = "term";
	parse_factor(term.factor);
	term.quantifier = create_quantifier();
	if (!try_parse_fn(parse_quantifier, term.quantifier)) term.quantifier = undefined;
};
const parse_factor = (factor: factor) => {
	debugName = "factor";
	factor.value = create_identifier_no_assignment();
	if (try_parse_fn(parse_identifier_no_assignment, factor.value)) return;
	factor.value = create_terminal();
	if (try_parse_fn(parse_terminal, factor.value)) return;
	factor.value = create_comment();
	if (try_parse_fn(parse_comment, factor.value)) return;
	factor.value = create_regex_();
	if (try_parse_fn(parse_regex_, factor.value)) return;
	factor.value = create_hex();
	if (try_parse_fn(parse_hex, factor.value)) return;
	factor.value = create_character_class();
	if (try_parse_fn(parse_character_class, factor.value)) return;
	factor.value = create_group();
	if (try_parse_fn(parse_group, factor.value)) return;
	fail_parse("Failed to parse factor");
};
const parse_identifier_no_assignment = (identifier_no_assignment: identifier_no_assignment) => {
	debugName = "identifier_no_assignment";
	identifier_no_assignment.value = parse_regex(
		reg`/(\b[a-zA-Z][a-zA-Z0-9_]*\b(?!>)|<[a-zA-Z][a-zA-Z0-9_]*>)(?!\s*(::=|=))/`,
		true,
		false,
		false,
	);
};
const parse_terminal = (terminal: terminal) => {
	debugName = "terminal";
	terminal.value = parse_regex(reg`/('[^']*')|("[^"]*")/`, true, false, false);
};
const parse_group = (group: group) => {
	debugName = "group";
	parse_regex(reg`/\(/`, true, false, false);
	parse_expression(group.expression);
	parse_regex(reg`/\)/`, true, false, false);
};
const parse_regex_ = (regex_: regex_) => {
	debugName = "regex_";
	regex_.value = parse_regex(reg`/\/(\\\/|[^\/])*\//`, true, false, false);
};
const parse_hex = (hex: hex) => {
	debugName = "hex";
	hex.value = parse_regex(reg`/#x[0-9A-F]+/`, true, false, false);
};
const parse_character_class = (character_class: character_class) => {
	debugName = "character_class";
	parse_regex(reg`/\[/`, true, false, false);
	parse_array_fn(parse_character_range, character_class.character_range, create_character_range, 1);
	parse_regex(reg`/\]/`, true, false, false);
};
const parse_character_range = (character_range: character_range) => {
	debugName = "character_range";
	character_range.value = parse_regex(reg`/[a-zA-Z0-9]-[a-zA-Z0-9]|#x[0-9A-F]+-[#x0-9A-F]+|[^-\]]|\\-/`, true, false, false);
};
const parse_quantifier = (quantifier: quantifier) => {
	debugName = "quantifier";
	quantifier.value = parse_regex(reg`/\+(?!\+)|\*(?!\*)|\?/`, true, false, false);
};
const parse_expression_join = (expression_join: expression_join) => {
	debugName = "expression_join";
	expression_join.value = parse_regex(reg`/[|-]|\+\+|\*\*/`, true, false, false);
};
const parse_comment = (comment: comment) => {
	debugName = "comment";
	comment.value = parse_regex(reg`/\/\*[\s\S]*?\*\//`, true, false, false);
};

export const parse = (textToParse: string, filePath = "", onFail?: (result: grammar) => void) => {
	path = filePath;
	text = textToParse;
	index = 0;
	const result = create_grammar();
	successValues.length = 0;
	failedValues.length = 0;
	try {
		parse_grammar(result);
		if (index < text.trim().length) {
			const { line, col } = getCurrentLocation();
			throw new Error(`Text not fully parsed, interrupted at index ${index} (${path ? `${path}:` : ""}${line}:${col})`);
		}
		logs.length = 0;
		logs.push(...successValues, ...failedValues);
		return result;
	} catch (error) {
		logs.length = 0;
		logs.push(...successValues, ...failedValues);
		onFail?.(result);
		throw error;
	}
};
export type RecursiveStripLocation<T> = T extends Array<infer U>
	? RecursiveStripLocation<U>[]
	: T extends object
	? { [K in Exclude<keyof T, "_location">]: RecursiveStripLocation<T[K]> }
	: T;
export const recursiveStripLocation = <T>(value: T): RecursiveStripLocation<T> => {
	if (Array.isArray(value)) return value.map((item) => recursiveStripLocation(item)) as RecursiveStripLocation<T>;
	if (!value || typeof value !== "object" || value instanceof Date || value instanceof RegExp)
		return value as RecursiveStripLocation<T>;
	const result: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
		if (key === "_location") continue;
		result[key] = recursiveStripLocation(entry);
	}
	return result as RecursiveStripLocation<T>;
};
