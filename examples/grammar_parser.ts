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
	rule: rule[];
};
export type rule = {
	type: "rule";
	rule_name: rule_name;
	rule_expr: rule_expr;
	rule_comment?: rule_comment;
};
export type rule_name = {
	type: "rule_name";
	value: string;
};
export type rule_expr = {
	type: "rule_expr";
	value: first_rule_regex | first_rule_name;
};
export type first_rule_regex = {
	type: "first_rule_regex";
	rule_regex: rule_regex;
	space_rule_term: space_rule_term[];
};
export type first_rule_name = {
	type: "first_rule_name";
	rule_name: rule_name;
	rest_rule_name: rest_rule_name;
};
export type rest_rule_name = {
	type: "rest_rule_name";
	value: rule_name_with_or | rule_name_as_item | rule_name_as_term;
};
export type rule_name_with_or = {
	type: "rule_name_with_or";
	space_rule_name: space_rule_name[];
};
export type rule_name_as_item = {
	type: "rule_name_as_item";
	rule_first_item_optional: rule_first_item_optional;
	rule_join: rule_join;
};
export type rule_first_item_optional = {
	type: "rule_first_item_optional";
	value: string;
};
export type rule_join = {
	type: "rule_join";
	value: rule_name | rule_regex;
};
export type rule_name_as_term = {
	type: "rule_name_as_term";
	rule_quantifier?: rule_quantifier;
	space_rule_term: space_rule_term[];
};
export type space_rule_name = {
	type: "space_rule_name";
	rule_name: rule_name;
};
export type space_rule_term = {
	type: "space_rule_term";
	rule_term: rule_term;
};
export type rule_term = {
	type: "rule_term";
	value: rule_name_quantified | rule_regex;
};
export type rule_name_quantified = {
	type: "rule_name_quantified";
	rule_name: rule_name;
	rule_quantifier?: rule_quantifier;
};
export type rule_quantifier = {
	type: "rule_quantifier";
	value: rule_basic_quantifier | rule_brace_quantifier;
};
export type rule_regex = {
	type: "rule_regex";
	value: string;
};
export type rule_basic_quantifier = {
	type: "rule_basic_quantifier";
	value: string;
};
export type rule_brace_quantifier = {
	type: "rule_brace_quantifier";
	rule_brace_min: rule_brace_min;
	rule_brace_max?: rule_brace_max;
};
export type rule_brace_min = {
	type: "rule_brace_min";
	value: string;
};
export type rule_brace_max = {
	type: "rule_brace_max";
	rule_brace_max_value?: rule_brace_max_value;
};
export type rule_brace_max_value = {
	type: "rule_brace_max_value";
	value: string;
};
export type rule_comment = {
	type: "rule_comment";
	value: string;
};

const create_grammar = (): grammar => ({ type: "grammar", rule: [] });
const create_rule = (): rule => ({ type: "rule", rule_name: create_rule_name(), rule_expr: create_rule_expr() });
const create_rule_name = (): rule_name => ({ type: "rule_name", value: "" });
const create_rule_expr = (): rule_expr => ({ type: "rule_expr", value: create_first_rule_regex() });
const create_first_rule_regex = (): first_rule_regex => ({
	type: "first_rule_regex",
	rule_regex: create_rule_regex(),
	space_rule_term: [],
});
const create_first_rule_name = (): first_rule_name => ({
	type: "first_rule_name",
	rule_name: create_rule_name(),
	rest_rule_name: create_rest_rule_name(),
});
const create_rest_rule_name = (): rest_rule_name => ({ type: "rest_rule_name", value: create_rule_name_with_or() });
const create_rule_name_with_or = (): rule_name_with_or => ({ type: "rule_name_with_or", space_rule_name: [] });
const create_rule_name_as_item = (): rule_name_as_item => ({
	type: "rule_name_as_item",
	rule_first_item_optional: create_rule_first_item_optional(),
	rule_join: create_rule_join(),
});
const create_rule_first_item_optional = (): rule_first_item_optional => ({ type: "rule_first_item_optional", value: "" });
const create_rule_join = (): rule_join => ({ type: "rule_join", value: create_rule_name() });
const create_rule_name_as_term = (): rule_name_as_term => ({ type: "rule_name_as_term", space_rule_term: [] });
const create_space_rule_name = (): space_rule_name => ({ type: "space_rule_name", rule_name: create_rule_name() });
const create_space_rule_term = (): space_rule_term => ({ type: "space_rule_term", rule_term: create_rule_term() });
const create_rule_term = (): rule_term => ({ type: "rule_term", value: create_rule_name_quantified() });
const create_rule_name_quantified = (): rule_name_quantified => ({ type: "rule_name_quantified", rule_name: create_rule_name() });
const create_rule_quantifier = (): rule_quantifier => ({ type: "rule_quantifier", value: create_rule_basic_quantifier() });
const create_rule_regex = (): rule_regex => ({ type: "rule_regex", value: "" });
const create_rule_basic_quantifier = (): rule_basic_quantifier => ({ type: "rule_basic_quantifier", value: "" });
const create_rule_brace_quantifier = (): rule_brace_quantifier => ({
	type: "rule_brace_quantifier",
	rule_brace_min: create_rule_brace_min(),
});
const create_rule_brace_min = (): rule_brace_min => ({ type: "rule_brace_min", value: "" });
const create_rule_brace_max = (): rule_brace_max => ({ type: "rule_brace_max" });
const create_rule_brace_max_value = (): rule_brace_max_value => ({ type: "rule_brace_max_value", value: "" });
const create_rule_comment = (): rule_comment => ({ type: "rule_comment", value: "" });

const parse_grammar = (grammar: grammar) => {
	debugName = "grammar";
	parse_array_fn(parse_rule, grammar.rule, create_rule, 1);
};
const parse_rule = (rule: rule) => {
	debugName = "rule";
	parse_rule_name(rule.rule_name);
	parse_regex(reg`/: /`);
	parse_rule_expr(rule.rule_expr);
	rule.rule_comment = create_rule_comment();
	if (!try_parse_fn(parse_rule_comment, rule.rule_comment)) rule.rule_comment = undefined;
	parse_regex(reg`/\r?\n/`);
};
const parse_rule_name = (rule_name: rule_name) => {
	debugName = "rule_name";
	rule_name.value = parse_regex(reg`/[a-z][a-z_]*/`);
};
const parse_rule_expr = (rule_expr: rule_expr) => {
	debugName = "rule_expr";
	rule_expr.value = create_first_rule_regex();
	if (try_parse_fn(parse_first_rule_regex, rule_expr.value)) return;
	rule_expr.value = create_first_rule_name();
	if (try_parse_fn(parse_first_rule_name, rule_expr.value)) return;
	fail_parse("Failed to parse rule_expr");
};
const parse_first_rule_regex = (first_rule_regex: first_rule_regex) => {
	debugName = "first_rule_regex";
	parse_rule_regex(first_rule_regex.rule_regex);
	parse_array_fn(parse_space_rule_term, first_rule_regex.space_rule_term, create_space_rule_term, 0);
};
const parse_first_rule_name = (first_rule_name: first_rule_name) => {
	debugName = "first_rule_name";
	parse_rule_name(first_rule_name.rule_name);
	parse_rest_rule_name(first_rule_name.rest_rule_name);
};
const parse_rest_rule_name = (rest_rule_name: rest_rule_name) => {
	debugName = "rest_rule_name";
	rest_rule_name.value = create_rule_name_with_or();
	if (try_parse_fn(parse_rule_name_with_or, rest_rule_name.value)) return;
	rest_rule_name.value = create_rule_name_as_item();
	if (try_parse_fn(parse_rule_name_as_item, rest_rule_name.value)) return;
	rest_rule_name.value = create_rule_name_as_term();
	if (try_parse_fn(parse_rule_name_as_term, rest_rule_name.value)) return;
	fail_parse("Failed to parse rest_rule_name");
};
const parse_rule_name_with_or = (rule_name_with_or: rule_name_with_or) => {
	debugName = "rule_name_with_or";
	parse_array_fn(parse_space_rule_name, rule_name_with_or.space_rule_name, create_space_rule_name, 1);
};
const parse_rule_name_as_item = (rule_name_as_item: rule_name_as_item) => {
	debugName = "rule_name_as_item";
	parse_rule_first_item_optional(rule_name_as_item.rule_first_item_optional);
	parse_regex(reg`/ >> /`);
	parse_rule_join(rule_name_as_item.rule_join);
};
const parse_rule_first_item_optional = (rule_first_item_optional: rule_first_item_optional) => {
	debugName = "rule_first_item_optional";
	rule_first_item_optional.value = parse_regex(reg`/\??/`);
};
const parse_rule_join = (rule_join: rule_join) => {
	debugName = "rule_join";
	rule_join.value = create_rule_name();
	if (try_parse_fn(parse_rule_name, rule_join.value)) return;
	rule_join.value = create_rule_regex();
	if (try_parse_fn(parse_rule_regex, rule_join.value)) return;
	fail_parse("Failed to parse rule_join");
};
const parse_rule_name_as_term = (rule_name_as_term: rule_name_as_term) => {
	debugName = "rule_name_as_term";
	rule_name_as_term.rule_quantifier = create_rule_quantifier();
	if (!try_parse_fn(parse_rule_quantifier, rule_name_as_term.rule_quantifier)) rule_name_as_term.rule_quantifier = undefined;
	parse_array_fn(parse_space_rule_term, rule_name_as_term.space_rule_term, create_space_rule_term, 0);
};
const parse_space_rule_name = (space_rule_name: space_rule_name) => {
	debugName = "space_rule_name";
	parse_regex(reg`/ \| /`);
	parse_rule_name(space_rule_name.rule_name);
};
const parse_space_rule_term = (space_rule_term: space_rule_term) => {
	debugName = "space_rule_term";
	parse_regex(reg`/ /`);
	parse_rule_term(space_rule_term.rule_term);
};
const parse_rule_term = (rule_term: rule_term) => {
	debugName = "rule_term";
	rule_term.value = create_rule_name_quantified();
	if (try_parse_fn(parse_rule_name_quantified, rule_term.value)) return;
	rule_term.value = create_rule_regex();
	if (try_parse_fn(parse_rule_regex, rule_term.value)) return;
	fail_parse("Failed to parse rule_term");
};
const parse_rule_name_quantified = (rule_name_quantified: rule_name_quantified) => {
	debugName = "rule_name_quantified";
	parse_rule_name(rule_name_quantified.rule_name);
	rule_name_quantified.rule_quantifier = create_rule_quantifier();
	if (!try_parse_fn(parse_rule_quantifier, rule_name_quantified.rule_quantifier))
		rule_name_quantified.rule_quantifier = undefined;
};
const parse_rule_quantifier = (rule_quantifier: rule_quantifier) => {
	debugName = "rule_quantifier";
	rule_quantifier.value = create_rule_basic_quantifier();
	if (try_parse_fn(parse_rule_basic_quantifier, rule_quantifier.value)) return;
	rule_quantifier.value = create_rule_brace_quantifier();
	if (try_parse_fn(parse_rule_brace_quantifier, rule_quantifier.value)) return;
	fail_parse("Failed to parse rule_quantifier");
};
const parse_rule_regex = (rule_regex: rule_regex) => {
	debugName = "rule_regex";
	rule_regex.value = parse_regex(reg`/\/(\\\/|[^\/])*\//`);
};
const parse_rule_basic_quantifier = (rule_basic_quantifier: rule_basic_quantifier) => {
	debugName = "rule_basic_quantifier";
	rule_basic_quantifier.value = parse_regex(reg`/[+*?]/`);
};
const parse_rule_brace_quantifier = (rule_brace_quantifier: rule_brace_quantifier) => {
	debugName = "rule_brace_quantifier";
	parse_regex(reg`/\{/`);
	parse_rule_brace_min(rule_brace_quantifier.rule_brace_min);
	rule_brace_quantifier.rule_brace_max = create_rule_brace_max();
	if (!try_parse_fn(parse_rule_brace_max, rule_brace_quantifier.rule_brace_max)) rule_brace_quantifier.rule_brace_max = undefined;
	parse_regex(reg`/\}/`);
};
const parse_rule_brace_min = (rule_brace_min: rule_brace_min) => {
	debugName = "rule_brace_min";
	rule_brace_min.value = parse_regex(reg`/\d+/`);
};
const parse_rule_brace_max = (rule_brace_max: rule_brace_max) => {
	debugName = "rule_brace_max";
	parse_regex(reg`/,/`);
	rule_brace_max.rule_brace_max_value = create_rule_brace_max_value();
	if (!try_parse_fn(parse_rule_brace_max_value, rule_brace_max.rule_brace_max_value))
		rule_brace_max.rule_brace_max_value = undefined;
};
const parse_rule_brace_max_value = (rule_brace_max_value: rule_brace_max_value) => {
	debugName = "rule_brace_max_value";
	rule_brace_max_value.value = parse_regex(reg`/\d+/`);
};
const parse_rule_comment = (rule_comment: rule_comment) => {
	debugName = "rule_comment";
	rule_comment.value = parse_regex(reg`/ #.*/`);
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
