export type LogValue = { debugName: string; rgx: string; status: string; index: number; location: string; text: string };
const successValues: LogValue[] = [];
const failedValues: LogValue[] = [];
export const logs: LogValue[] = [];
let index = 0;
let text = "";
let debugName = "";
let path = "";
const indexToLineCol = (textIndex: number) => {
	const lineBreakBefore = textIndex === 0 ? -1 : text.lastIndexOf("\n", textIndex - 1);
	return {
		line: lineBreakBefore === -1 ? 1 : text.slice(0, lineBreakBefore + 1).match(/\n/g)!.length + 1,
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
		const spaceRegex = /\s*/gy;
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
			location: `${path ? `${path}:` : ""}${line}:${col}`,
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
		const { line, col } = indexToLineCol(index);
		successValues.push({
			debugName: debugName,
			rgx: rgx.source,
			status: "true",
			index: index,
			location: `${path ? `${path}:` : ""}${line}:${col}`,
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
	value: spacing_policy | rule | multiline_comment | singleline_comment | new_line;
};
export type spacing_policy = {
	type: "spacing_policy";
	spacing_policy_value: spacing_policy_value;
	inline_comment: inline_comment[];
};
export type spacing_policy_value = {
	type: "spacing_policy_value";
	value: string;
};
export type rule = {
	type: "rule";
	rule_name: rule_name;
	rule_expr: rule_expr;
	inline_comment: inline_comment[];
};
export type rule_name = {
	type: "rule_name";
	value: string;
};
export type rule_expr = {
	type: "rule_expr";
	value: first_rule_negation | first_rule_regex | first_rule_name;
};
export type first_rule_negation = {
	type: "first_rule_negation";
	rule_name_or_regex: rule_name_or_regex;
	space_rule_term: space_rule_term[];
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
	rule_item_optional?: rule_item_optional;
	rule_name_or_regex: rule_name_or_regex;
};
export type rule_item_optional = {
	type: "rule_item_optional";
	value: string;
};
export type rule_name_or_regex = {
	type: "rule_name_or_regex";
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
	value: rule_term_negative | rule_term_positive;
};
export type rule_term_negative = {
	type: "rule_term_negative";
	rule_name_or_regex: rule_name_or_regex;
};
export type rule_term_positive = {
	type: "rule_term_positive";
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
	rule_regex_content: rule_regex_content;
	rule_regex_flags: rule_regex_flags;
};
export type rule_regex_content = {
	type: "rule_regex_content";
	value: string;
};
export type rule_regex_flags = {
	type: "rule_regex_flags";
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
export type inline_comment = {
	type: "inline_comment";
	value: inline_multiline_comment | inline_singleline_comment;
};
export type inline_singleline_comment = {
	type: "inline_singleline_comment";
	value: string;
};
export type singleline_comment = {
	type: "singleline_comment";
	value: string;
};
export type multiline_comment = {
	type: "multiline_comment";
	value: string;
};
export type inline_multiline_comment = {
	type: "inline_multiline_comment";
	value: string;
};
export type new_line = {
	type: "new_line";
	value: string;
};

const create_grammar = (): grammar => ({ type: "grammar", line: [] });
const create_line = (): line => ({ type: "line", value: create_spacing_policy() });
const create_spacing_policy = (): spacing_policy => ({
	type: "spacing_policy",
	spacing_policy_value: create_spacing_policy_value(),
	inline_comment: [],
});
const create_spacing_policy_value = (): spacing_policy_value => ({ type: "spacing_policy_value", value: "" });
const create_rule = (): rule => ({
	type: "rule",
	rule_name: create_rule_name(),
	rule_expr: create_rule_expr(),
	inline_comment: [],
});
const create_rule_name = (): rule_name => ({ type: "rule_name", value: "" });
const create_rule_expr = (): rule_expr => ({ type: "rule_expr", value: create_first_rule_negation() });
const create_first_rule_negation = (): first_rule_negation => ({
	type: "first_rule_negation",
	rule_name_or_regex: create_rule_name_or_regex(),
	space_rule_term: [],
});
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
	rule_name_or_regex: create_rule_name_or_regex(),
});
const create_rule_item_optional = (): rule_item_optional => ({ type: "rule_item_optional", value: "" });
const create_rule_name_or_regex = (): rule_name_or_regex => ({ type: "rule_name_or_regex", value: create_rule_name() });
const create_rule_name_as_term = (): rule_name_as_term => ({ type: "rule_name_as_term", space_rule_term: [] });
const create_space_rule_name = (): space_rule_name => ({ type: "space_rule_name", rule_name: create_rule_name() });
const create_space_rule_term = (): space_rule_term => ({ type: "space_rule_term", rule_term: create_rule_term() });
const create_rule_term = (): rule_term => ({ type: "rule_term", value: create_rule_term_negative() });
const create_rule_term_negative = (): rule_term_negative => ({
	type: "rule_term_negative",
	rule_name_or_regex: create_rule_name_or_regex(),
});
const create_rule_term_positive = (): rule_term_positive => ({
	type: "rule_term_positive",
	value: create_rule_name_quantified(),
});
const create_rule_name_quantified = (): rule_name_quantified => ({ type: "rule_name_quantified", rule_name: create_rule_name() });
const create_rule_quantifier = (): rule_quantifier => ({ type: "rule_quantifier", value: create_rule_basic_quantifier() });
const create_rule_regex = (): rule_regex => ({
	type: "rule_regex",
	rule_regex_content: create_rule_regex_content(),
	rule_regex_flags: create_rule_regex_flags(),
});
const create_rule_regex_content = (): rule_regex_content => ({ type: "rule_regex_content", value: "" });
const create_rule_regex_flags = (): rule_regex_flags => ({ type: "rule_regex_flags", value: "" });
const create_rule_basic_quantifier = (): rule_basic_quantifier => ({ type: "rule_basic_quantifier", value: "" });
const create_rule_brace_quantifier = (): rule_brace_quantifier => ({
	type: "rule_brace_quantifier",
	rule_brace_min: create_rule_brace_min(),
});
const create_rule_brace_min = (): rule_brace_min => ({ type: "rule_brace_min", value: "" });
const create_rule_brace_max = (): rule_brace_max => ({ type: "rule_brace_max" });
const create_rule_brace_max_value = (): rule_brace_max_value => ({ type: "rule_brace_max_value", value: "" });
const create_inline_comment = (): inline_comment => ({ type: "inline_comment", value: create_inline_multiline_comment() });
const create_inline_singleline_comment = (): inline_singleline_comment => ({ type: "inline_singleline_comment", value: "" });
const create_singleline_comment = (): singleline_comment => ({ type: "singleline_comment", value: "" });
const create_multiline_comment = (): multiline_comment => ({ type: "multiline_comment", value: "" });
const create_inline_multiline_comment = (): inline_multiline_comment => ({ type: "inline_multiline_comment", value: "" });
const create_new_line = (): new_line => ({ type: "new_line", value: "" });

const parse_grammar = (grammar: grammar) => {
	debugName = "grammar";
	parse_array_fn(parse_line, grammar.line, create_line, 0);
};
const parse_line = (line: line) => {
	debugName = "line";
	line.value = create_spacing_policy();
	if (try_parse_fn(parse_spacing_policy, line.value)) return;
	line.value = create_rule();
	if (try_parse_fn(parse_rule, line.value)) return;
	line.value = create_multiline_comment();
	if (try_parse_fn(parse_multiline_comment, line.value)) return;
	line.value = create_singleline_comment();
	if (try_parse_fn(parse_singleline_comment, line.value)) return;
	line.value = create_new_line();
	if (try_parse_fn(parse_new_line, line.value)) return;
	fail_parse("Failed to parse line");
};
const parse_spacing_policy = (spacing_policy: spacing_policy) => {
	debugName = "spacing_policy";
	parse_spacing_policy_value(spacing_policy.spacing_policy_value);
	parse_array_fn(parse_inline_comment, spacing_policy.inline_comment, create_inline_comment, 0);
	parse_regex(reg`/\r?\n/`, false, false, false);
};
const parse_spacing_policy_value = (spacing_policy_value: spacing_policy_value) => {
	debugName = "spacing_policy_value";
	spacing_policy_value.value = parse_regex(reg`/"strict"|"loose"/`, false, false, false);
};
const parse_rule = (rule: rule) => {
	debugName = "rule";
	parse_rule_name(rule.rule_name);
	parse_regex(reg`/: /`, false, false, false);
	parse_rule_expr(rule.rule_expr);
	parse_array_fn(parse_inline_comment, rule.inline_comment, create_inline_comment, 0);
	parse_regex(reg`/\r?\n/`, false, false, false);
};
const parse_rule_name = (rule_name: rule_name) => {
	debugName = "rule_name";
	rule_name.value = parse_regex(reg`/[a-zA-Z][a-zA-Z0-9_]*/`, false, false, false);
};
const parse_rule_expr = (rule_expr: rule_expr) => {
	debugName = "rule_expr";
	rule_expr.value = create_first_rule_negation();
	if (try_parse_fn(parse_first_rule_negation, rule_expr.value)) return;
	rule_expr.value = create_first_rule_regex();
	if (try_parse_fn(parse_first_rule_regex, rule_expr.value)) return;
	rule_expr.value = create_first_rule_name();
	if (try_parse_fn(parse_first_rule_name, rule_expr.value)) return;
	fail_parse("Failed to parse rule_expr");
};
const parse_first_rule_negation = (first_rule_negation: first_rule_negation) => {
	debugName = "first_rule_negation";
	parse_regex(reg`/!/`, false, false, false);
	parse_rule_name_or_regex(first_rule_negation.rule_name_or_regex);
	parse_array_fn(parse_space_rule_term, first_rule_negation.space_rule_term, create_space_rule_term, 0);
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
	rule_name_as_item.rule_item_optional = create_rule_item_optional();
	if (!try_parse_fn(parse_rule_item_optional, rule_name_as_item.rule_item_optional))
		rule_name_as_item.rule_item_optional = undefined;
	parse_regex(reg`/ >> /`, false, false, false);
	parse_rule_name_or_regex(rule_name_as_item.rule_name_or_regex);
};
const parse_rule_item_optional = (rule_item_optional: rule_item_optional) => {
	debugName = "rule_item_optional";
	rule_item_optional.value = parse_regex(reg`/\?/`, false, false, false);
};
const parse_rule_name_or_regex = (rule_name_or_regex: rule_name_or_regex) => {
	debugName = "rule_name_or_regex";
	rule_name_or_regex.value = create_rule_name();
	if (try_parse_fn(parse_rule_name, rule_name_or_regex.value)) return;
	rule_name_or_regex.value = create_rule_regex();
	if (try_parse_fn(parse_rule_regex, rule_name_or_regex.value)) return;
	fail_parse("Failed to parse rule_name_or_regex");
};
const parse_rule_name_as_term = (rule_name_as_term: rule_name_as_term) => {
	debugName = "rule_name_as_term";
	rule_name_as_term.rule_quantifier = create_rule_quantifier();
	if (!try_parse_fn(parse_rule_quantifier, rule_name_as_term.rule_quantifier)) rule_name_as_term.rule_quantifier = undefined;
	parse_array_fn(parse_space_rule_term, rule_name_as_term.space_rule_term, create_space_rule_term, 0);
};
const parse_space_rule_name = (space_rule_name: space_rule_name) => {
	debugName = "space_rule_name";
	parse_regex(reg`/ \| /`, false, false, false);
	parse_rule_name(space_rule_name.rule_name);
};
const parse_space_rule_term = (space_rule_term: space_rule_term) => {
	debugName = "space_rule_term";
	parse_regex(reg`/ /`, false, false, false);
	parse_rule_term(space_rule_term.rule_term);
};
const parse_rule_term = (rule_term: rule_term) => {
	debugName = "rule_term";
	rule_term.value = create_rule_term_negative();
	if (try_parse_fn(parse_rule_term_negative, rule_term.value)) return;
	rule_term.value = create_rule_term_positive();
	if (try_parse_fn(parse_rule_term_positive, rule_term.value)) return;
	fail_parse("Failed to parse rule_term");
};
const parse_rule_term_negative = (rule_term_negative: rule_term_negative) => {
	debugName = "rule_term_negative";
	parse_regex(reg`/!/`, false, false, false);
	parse_rule_name_or_regex(rule_term_negative.rule_name_or_regex);
};
const parse_rule_term_positive = (rule_term_positive: rule_term_positive) => {
	debugName = "rule_term_positive";
	rule_term_positive.value = create_rule_name_quantified();
	if (try_parse_fn(parse_rule_name_quantified, rule_term_positive.value)) return;
	rule_term_positive.value = create_rule_regex();
	if (try_parse_fn(parse_rule_regex, rule_term_positive.value)) return;
	fail_parse("Failed to parse rule_term_positive");
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
	parse_rule_regex_content(rule_regex.rule_regex_content);
	parse_rule_regex_flags(rule_regex.rule_regex_flags);
};
const parse_rule_regex_content = (rule_regex_content: rule_regex_content) => {
	debugName = "rule_regex_content";
	rule_regex_content.value = parse_regex(reg`/\/(\\\/|[^\/])*\//`, false, false, false);
};
const parse_rule_regex_flags = (rule_regex_flags: rule_regex_flags) => {
	debugName = "rule_regex_flags";
	rule_regex_flags.value = parse_regex(reg`/[myni]*/`, false, false, false);
};
const parse_rule_basic_quantifier = (rule_basic_quantifier: rule_basic_quantifier) => {
	debugName = "rule_basic_quantifier";
	rule_basic_quantifier.value = parse_regex(reg`/[+*?]/`, false, false, false);
};
const parse_rule_brace_quantifier = (rule_brace_quantifier: rule_brace_quantifier) => {
	debugName = "rule_brace_quantifier";
	parse_regex(reg`/\{/`, false, false, false);
	parse_rule_brace_min(rule_brace_quantifier.rule_brace_min);
	rule_brace_quantifier.rule_brace_max = create_rule_brace_max();
	if (!try_parse_fn(parse_rule_brace_max, rule_brace_quantifier.rule_brace_max)) rule_brace_quantifier.rule_brace_max = undefined;
	parse_regex(reg`/\}/`, false, false, false);
};
const parse_rule_brace_min = (rule_brace_min: rule_brace_min) => {
	debugName = "rule_brace_min";
	rule_brace_min.value = parse_regex(reg`/\d+/`, false, false, false);
};
const parse_rule_brace_max = (rule_brace_max: rule_brace_max) => {
	debugName = "rule_brace_max";
	parse_regex(reg`/,/`, false, false, false);
	rule_brace_max.rule_brace_max_value = create_rule_brace_max_value();
	if (!try_parse_fn(parse_rule_brace_max_value, rule_brace_max.rule_brace_max_value))
		rule_brace_max.rule_brace_max_value = undefined;
};
const parse_rule_brace_max_value = (rule_brace_max_value: rule_brace_max_value) => {
	debugName = "rule_brace_max_value";
	rule_brace_max_value.value = parse_regex(reg`/\d+/`, false, false, false);
};
const parse_inline_comment = (inline_comment: inline_comment) => {
	debugName = "inline_comment";
	inline_comment.value = create_inline_multiline_comment();
	if (try_parse_fn(parse_inline_multiline_comment, inline_comment.value)) return;
	inline_comment.value = create_inline_singleline_comment();
	if (try_parse_fn(parse_inline_singleline_comment, inline_comment.value)) return;
	fail_parse("Failed to parse inline_comment");
};
const parse_inline_singleline_comment = (inline_singleline_comment: inline_singleline_comment) => {
	debugName = "inline_singleline_comment";
	inline_singleline_comment.value = parse_regex(reg`/ #.*/`, false, false, false);
};
const parse_singleline_comment = (singleline_comment: singleline_comment) => {
	debugName = "singleline_comment";
	singleline_comment.value = parse_regex(reg`/#.*\r?\n/`, false, false, false);
};
const parse_multiline_comment = (multiline_comment: multiline_comment) => {
	debugName = "multiline_comment";
	multiline_comment.value = parse_regex(reg`/##([^#]|#[^#])*##/`, false, false, false);
};
const parse_inline_multiline_comment = (inline_multiline_comment: inline_multiline_comment) => {
	debugName = "inline_multiline_comment";
	inline_multiline_comment.value = parse_regex(reg`/ ##([^#]|#[^#])*##/`, false, false, false);
};
const parse_new_line = (new_line: new_line) => {
	debugName = "new_line";
	new_line.value = parse_regex(reg`/\r?\n/`, false, false, false);
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
		if (index !== text.length) {
			const { line, col } = indexToLineCol(index);
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
