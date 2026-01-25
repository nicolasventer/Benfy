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

export type quantifier_expr = _location_object & {
	type: "quantifier_expr";
	quantifier_test: quantifier_test[];
};
export type quantifier_test = _location_object & {
	type: "quantifier_test";
	value: zero_or_more | one_or_more | zero_or_one | exactly_n | range_n_m | range_n_inf | new_line;
};
export type zero_or_more = _location_object & {
	type: "zero_or_more";
	item: item[];
};
export type item = _location_object & {
	type: "item";
	value: string;
};
export type one_or_more = _location_object & {
	type: "one_or_more";
	item: item[];
};
export type zero_or_one = _location_object & {
	type: "zero_or_one";
	optional?: optional;
};
export type optional = _location_object & {
	type: "optional";
	value: string;
};
export type exactly_n = _location_object & {
	type: "exactly_n";
	digit: digit[];
};
export type digit = _location_object & {
	type: "digit";
	value: string;
};
export type range_n_m = _location_object & {
	type: "range_n_m";
	letter: letter[];
};
export type letter = _location_object & {
	type: "letter";
	value: string;
};
export type range_n_inf = _location_object & {
	type: "range_n_inf";
	letter: letter[];
};
export type new_line = _location_object & {
	type: "new_line";
	value: string;
};

const create_quantifier_expr = (): quantifier_expr => ({ ...getCurrentLocationObject(), type: "quantifier_expr", quantifier_test: [] });
const create_quantifier_test = (): quantifier_test => ({ ...getCurrentLocationObject(), type: "quantifier_test", value: create_zero_or_more() });
const create_zero_or_more = (): zero_or_more => ({ ...getCurrentLocationObject(), type: "zero_or_more", item: [] });
const create_item = (): item => ({ ...getCurrentLocationObject(), type: "item", value: "" });
const create_one_or_more = (): one_or_more => ({ ...getCurrentLocationObject(), type: "one_or_more", item: [] });
const create_zero_or_one = (): zero_or_one => ({ ...getCurrentLocationObject(), type: "zero_or_one" });
const create_optional = (): optional => ({ ...getCurrentLocationObject(), type: "optional", value: "" });
const create_exactly_n = (): exactly_n => ({ ...getCurrentLocationObject(), type: "exactly_n", digit: [] });
const create_digit = (): digit => ({ ...getCurrentLocationObject(), type: "digit", value: "" });
const create_range_n_m = (): range_n_m => ({ ...getCurrentLocationObject(), type: "range_n_m", letter: [] });
const create_letter = (): letter => ({ ...getCurrentLocationObject(), type: "letter", value: "" });
const create_range_n_inf = (): range_n_inf => ({ ...getCurrentLocationObject(), type: "range_n_inf", letter: [] });
const create_new_line = (): new_line => ({ ...getCurrentLocationObject(), type: "new_line", value: "" });

const parse_quantifier_expr = (quantifier_expr: quantifier_expr) => {
	debugName = "quantifier_expr";
	parse_array_fn(parse_quantifier_test, quantifier_expr.quantifier_test, create_quantifier_test, 1);
};
const parse_quantifier_test = (quantifier_test: quantifier_test) => {
	debugName = "quantifier_test";
	quantifier_test.value = create_zero_or_more();
	if (try_parse_fn(parse_zero_or_more, quantifier_test.value)) return;
	quantifier_test.value = create_one_or_more();
	if (try_parse_fn(parse_one_or_more, quantifier_test.value)) return;
	quantifier_test.value = create_zero_or_one();
	if (try_parse_fn(parse_zero_or_one, quantifier_test.value)) return;
	quantifier_test.value = create_exactly_n();
	if (try_parse_fn(parse_exactly_n, quantifier_test.value)) return;
	quantifier_test.value = create_range_n_m();
	if (try_parse_fn(parse_range_n_m, quantifier_test.value)) return;
	quantifier_test.value = create_range_n_inf();
	if (try_parse_fn(parse_range_n_inf, quantifier_test.value)) return;
	quantifier_test.value = create_new_line();
	if (try_parse_fn(parse_new_line, quantifier_test.value)) return;
	fail_parse("Failed to parse quantifier_test");
};
const parse_zero_or_more = (zero_or_more: zero_or_more) => {
	debugName = "zero_or_more";
	parse_regex(reg`/zero_or_more: /`, false, false, false);
	parse_array_fn(parse_item, zero_or_more.item, create_item, 0);
};
const parse_item = (item: item) => {
	debugName = "item";
	item.value = parse_regex(reg`/[a-z]/`, false, false, false);
};
const parse_one_or_more = (one_or_more: one_or_more) => {
	debugName = "one_or_more";
	parse_regex(reg`/one_or_more: /`, false, false, false);
	parse_array_fn(parse_item, one_or_more.item, create_item, 1);
};
const parse_zero_or_one = (zero_or_one: zero_or_one) => {
	debugName = "zero_or_one";
	parse_regex(reg`/zero_or_one: /`, false, false, false);
	zero_or_one.optional = create_optional();
	if (!try_parse_fn(parse_optional, zero_or_one.optional)) zero_or_one.optional = undefined;
};
const parse_optional = (optional: optional) => {
	debugName = "optional";
	optional.value = parse_regex(reg`/optional/`, false, false, false);
};
const parse_exactly_n = (exactly_n: exactly_n) => {
	debugName = "exactly_n";
	parse_regex(reg`/exactly_n: /`, false, false, false);
	parse_array_fn(parse_digit, exactly_n.digit, create_digit, 3, 3);
};
const parse_digit = (digit: digit) => {
	debugName = "digit";
	digit.value = parse_regex(reg`/\d/`, false, false, false);
};
const parse_range_n_m = (range_n_m: range_n_m) => {
	debugName = "range_n_m";
	parse_regex(reg`/range_n_m: /`, false, false, false);
	parse_array_fn(parse_letter, range_n_m.letter, create_letter, 2, 4);
};
const parse_letter = (letter: letter) => {
	debugName = "letter";
	letter.value = parse_regex(reg`/[a-z]/`, false, false, false);
};
const parse_range_n_inf = (range_n_inf: range_n_inf) => {
	debugName = "range_n_inf";
	parse_regex(reg`/range_n_inf: /`, false, false, false);
	parse_array_fn(parse_letter, range_n_inf.letter, create_letter, 2, Number.MAX_SAFE_INTEGER);
};
const parse_new_line = (new_line: new_line) => {
	debugName = "new_line";
	new_line.value = parse_regex(reg`/\r?\n/`, false, false, false);
};

export const parse = (textToParse: string, filePath = "", onFail?: (result: quantifier_expr) => void) => {
	path = filePath;
	text = textToParse;
	index = 0;
	const result = create_quantifier_expr();
	successValues.length = 0;
	failedValues.length = 0;
	try {
		parse_quantifier_expr(result);
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
