export type LogValue = { debugName: string; rgx: string; status: string; index: number; text: string };
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
	if (true) {
		const spaceRegex = /\s*/gy;
		spaceRegex.lastIndex = index;
		const matches = spaceRegex.exec(text);
		if (matches) index = matches.index + matches[0].length;
	}
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
				.replace(/\r?\n/g, "\\n")
				.replace(/\t/g, "\\t")
				.replace(/^(\\t|\\n)*/g, ""),
		});
		throw new Error(`Match failed: ${rgx.source}`);
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
				.replace(/\r?\n/g, "\\n")
				.replace(/\t/g, "\\t")
				.replace(/^(\\t|\\n)*/g, ""),
		});
	}
	return matches[0];
};

export type grammar = {
	type: "grammar";
	line: line[];
};
export type line = {
	type: "line";
	value: production | comment;
};
export type production = {
	type: "production";
	identifier: identifier;
	expression: expression;
};
export type identifier = {
	type: "identifier";
	value: string;
};
export type expression_item = {
	type: "expression_item";
	term_list: term_list;
	expression_join: expression_join;
};
export type expression = {
	type: "expression";
	value: expression_item[];
};
export type term_list_item = {
	type: "term_list_item";
	term: term;
};
export type term_list = {
	type: "term_list";
	value: term_list_item[];
};
export type term = {
	type: "term";
	factor: factor;
	quantifier?: quantifier;
};
export type factor = {
	type: "factor";
	value: identifier_no_assignment | terminal | comment | regex_ | hex | character_class | group;
};
export type identifier_no_assignment = {
	type: "identifier_no_assignment";
	value: string;
};
export type terminal = {
	type: "terminal";
	value: string;
};
export type group = {
	type: "group";
	expression: expression;
};
export type regex_ = {
	type: "regex_";
	value: string;
};
export type hex = {
	type: "hex";
	value: string;
};
export type character_class = {
	type: "character_class";
	character_range: character_range[];
};
export type character_range = {
	type: "character_range";
	value: string;
};
export type quantifier = {
	type: "quantifier";
	value: string;
};
export type expression_join = {
	type: "expression_join";
	value: string;
};
export type comment = {
	type: "comment";
	value: string;
};

const create_grammar = (): grammar => ({ type: "grammar", line: [] });
const create_line = (): line => ({ type: "line", value: create_production() });
const create_production = (): production => ({
	type: "production",
	identifier: create_identifier(),
	expression: create_expression(),
});
const create_identifier = (): identifier => ({ type: "identifier", value: "" });
const create_expression_item = (): expression_item => ({
	type: "expression_item",
	term_list: create_term_list(),
	expression_join: create_expression_join(),
});
const create_expression = (): expression => ({ type: "expression", value: [] });
const create_term_list_item = (): term_list_item => ({ type: "term_list_item", term: create_term() });
const create_term_list = (): term_list => ({ type: "term_list", value: [] });
const create_term = (): term => ({ type: "term", factor: create_factor() });
const create_factor = (): factor => ({ type: "factor", value: create_identifier_no_assignment() });
const create_identifier_no_assignment = (): identifier_no_assignment => ({ type: "identifier_no_assignment", value: "" });
const create_terminal = (): terminal => ({ type: "terminal", value: "" });
const create_group = (): group => ({ type: "group", expression: create_expression() });
const create_regex_ = (): regex_ => ({ type: "regex_", value: "" });
const create_hex = (): hex => ({ type: "hex", value: "" });
const create_character_class = (): character_class => ({ type: "character_class", character_range: [] });
const create_character_range = (): character_range => ({ type: "character_range", value: "" });
const create_quantifier = (): quantifier => ({ type: "quantifier", value: "" });
const create_expression_join = (): expression_join => ({ type: "expression_join", value: "" });
const create_comment = (): comment => ({ type: "comment", value: "" });

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
	parse_regex(reg`/=|::=/`);
	parse_expression(production.expression);
	parse_regex(reg`/;?/`);
};
const parse_identifier = (identifier: identifier) => {
	debugName = "identifier";
	identifier.value = parse_regex(reg`/[a-zA-Z][a-zA-Z0-9_]*|<[a-zA-Z][a-zA-Z0-9_]*>/`);
};
const parse_expression_item = (expression_item: expression_item) => {
	debugName = "expression_item";
	parse_term_list(expression_item.term_list);
	if (try_parse_fn(parse_expression_join, expression_item.expression_join)) return true;
	return false;
};
const parse_expression = (expression: expression) => {
	debugName = "expression";
	parse_array_fn(parse_expression_item, expression.value, create_expression_item, 1);
};
const parse_term_list_item = (term_list_item: term_list_item) => {
	debugName = "term_list_item";
	parse_term(term_list_item.term);
	if (try_parse_fn(parse_regex, reg`/,?/`)) return true;
	return false;
};
const parse_term_list = (term_list: term_list) => {
	debugName = "term_list";
	parse_array_fn(parse_term_list_item, term_list.value, create_term_list_item, 1);
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
	identifier_no_assignment.value = parse_regex(reg`/(\b[a-zA-Z][a-zA-Z0-9_]*\b(?!>)|<[a-zA-Z][a-zA-Z0-9_]*>)(?!\s*(::=|=))/`);
};
const parse_terminal = (terminal: terminal) => {
	debugName = "terminal";
	terminal.value = parse_regex(reg`/('[^']*')|("[^"]*")/`);
};
const parse_group = (group: group) => {
	debugName = "group";
	parse_regex(reg`/\(/`);
	parse_expression(group.expression);
	parse_regex(reg`/\)/`);
};
const parse_regex_ = (regex_: regex_) => {
	debugName = "regex_";
	regex_.value = parse_regex(reg`/\/(\\\/|[^\/])*\//`);
};
const parse_hex = (hex: hex) => {
	debugName = "hex";
	hex.value = parse_regex(reg`/#x[0-9A-F]+/`);
};
const parse_character_class = (character_class: character_class) => {
	debugName = "character_class";
	parse_regex(reg`/\[/`);
	parse_array_fn(parse_character_range, character_class.character_range, create_character_range, 1);
	parse_regex(reg`/\]/`);
};
const parse_character_range = (character_range: character_range) => {
	debugName = "character_range";
	character_range.value = parse_regex(reg`/[a-zA-Z0-9]-[a-zA-Z0-9]|#x[0-9A-F]+-[#x0-9A-F]+|[^-\]]|\\-/`);
};
const parse_quantifier = (quantifier: quantifier) => {
	debugName = "quantifier";
	quantifier.value = parse_regex(reg`/\+(?!\+)|\*(?!\*)|\?/`);
};
const parse_expression_join = (expression_join: expression_join) => {
	debugName = "expression_join";
	expression_join.value = parse_regex(reg`/[|-]|\+\+|\*\*/`);
};
const parse_comment = (comment: comment) => {
	debugName = "comment";
	comment.value = parse_regex(reg`/\/\*[\s\S]*?\*\//`);
};

export const parse = (textToParse: string, onFail?: (result: grammar) => void) => {
	text = textToParse;
	index = 0;
	const result = create_grammar();
	successValues.length = 0;
	failedValues.length = 0;
	try {
		parse_grammar(result);
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
