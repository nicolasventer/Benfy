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
	const suffix = skipSpace && /(\d|\w|\\[wd])[*+?]?$/.test(rgx.source) ? "\\b" : "";
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

export type regex_expr = _location_object & {
	type: "regex_expr";
	pattern_item: pattern_item[];
};
export type pattern_item = _location_object & {
	type: "pattern_item";
	value: literal | digit | number_ | ignore_case | multiline | no_ignore_case | no_multiline | new_line;
};
export type literal = _location_object & {
	type: "literal";
	value: string;
};
export type digit = _location_object & {
	type: "digit";
	value: string;
};
export type number_ = _location_object & {
	type: "number_";
	value: string;
};
export type ignore_case = _location_object & {
	type: "ignore_case";
	value: string;
};
export type multiline = _location_object & {
	type: "multiline";
	value: string;
};
export type no_ignore_case = _location_object & {
	type: "no_ignore_case";
	value: string;
};
export type no_multiline = _location_object & {
	type: "no_multiline";
	value: string;
};
export type new_line = _location_object & {
	type: "new_line";
	value: string;
};

const create_regex_expr = (): regex_expr => ({ ...getCurrentLocationObject(), type: "regex_expr", pattern_item: [] });
const create_pattern_item = (): pattern_item => ({ ...getCurrentLocationObject(), type: "pattern_item", value: create_literal() });
const create_literal = (): literal => ({ ...getCurrentLocationObject(), type: "literal", value: "" });
const create_digit = (): digit => ({ ...getCurrentLocationObject(), type: "digit", value: "" });
const create_number_ = (): number_ => ({ ...getCurrentLocationObject(), type: "number_", value: "" });
const create_ignore_case = (): ignore_case => ({ ...getCurrentLocationObject(), type: "ignore_case", value: "" });
const create_multiline = (): multiline => ({ ...getCurrentLocationObject(), type: "multiline", value: "" });
const create_no_ignore_case = (): no_ignore_case => ({ ...getCurrentLocationObject(), type: "no_ignore_case", value: "" });
const create_no_multiline = (): no_multiline => ({ ...getCurrentLocationObject(), type: "no_multiline", value: "" });
const create_new_line = (): new_line => ({ ...getCurrentLocationObject(), type: "new_line", value: "" });

const parse_regex_expr = (regex_expr: regex_expr) => {
	debugName = "regex_expr";
	parse_array_fn(parse_pattern_item, regex_expr.pattern_item, create_pattern_item, 1);
};
const parse_pattern_item = (pattern_item: pattern_item) => {
	debugName = "pattern_item";
	pattern_item.value = create_literal();
	if (try_parse_fn(parse_literal, pattern_item.value)) return;
	pattern_item.value = create_digit();
	if (try_parse_fn(parse_digit, pattern_item.value)) return;
	pattern_item.value = create_number_();
	if (try_parse_fn(parse_number_, pattern_item.value)) return;
	pattern_item.value = create_ignore_case();
	if (try_parse_fn(parse_ignore_case, pattern_item.value)) return;
	pattern_item.value = create_multiline();
	if (try_parse_fn(parse_multiline, pattern_item.value)) return;
	pattern_item.value = create_no_ignore_case();
	if (try_parse_fn(parse_no_ignore_case, pattern_item.value)) return;
	pattern_item.value = create_no_multiline();
	if (try_parse_fn(parse_no_multiline, pattern_item.value)) return;
	pattern_item.value = create_new_line();
	if (try_parse_fn(parse_new_line, pattern_item.value)) return;
	fail_parse("Failed to parse pattern_item");
};
const parse_literal = (literal: literal) => {
	debugName = "literal";
	literal.value = parse_regex(reg`/literal: [a-zA-Z]/`, false, false, false);
};
const parse_digit = (digit: digit) => {
	debugName = "digit";
	digit.value = parse_regex(reg`/digit: \d/`, false, false, false);
};
const parse_number_ = (number_: number_) => {
	debugName = "number_";
	number_.value = parse_regex(reg`/number_: \d+(\.\d*)?/`, false, false, false);
};
const parse_ignore_case = (ignore_case: ignore_case) => {
	debugName = "ignore_case";
	ignore_case.value = parse_regex(reg`/ignore_case: [a-z]/`, false, true, false);
};
const parse_multiline = (multiline: multiline) => {
	debugName = "multiline";
	multiline.value = parse_regex(reg`/multiline: [a-z]$/`, false, false, true);
};
const parse_no_ignore_case = (no_ignore_case: no_ignore_case) => {
	debugName = "no_ignore_case";
	no_ignore_case.value = parse_regex(reg`/no_ignore_case: [a-z]/`, false, false, false);
};
const parse_no_multiline = (no_multiline: no_multiline) => {
	debugName = "no_multiline";
	no_multiline.value = parse_regex(reg`/no_multiline: [a-z]$/`, false, false, false);
};
const parse_new_line = (new_line: new_line) => {
	debugName = "new_line";
	new_line.value = parse_regex(reg`/\r?\n/`, false, false, false);
};

export const parse = (textToParse: string, filePath = "", onFail?: (result: regex_expr) => void) => {
	path = filePath;
	text = textToParse;
	index = 0;
	const result = create_regex_expr();
	successValues.length = 0;
	failedValues.length = 0;
	try {
		parse_regex_expr(result);
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
