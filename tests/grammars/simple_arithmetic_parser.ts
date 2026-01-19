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

export type expr_item = _location_object & {
	type: "expr_item";
	op: op;
	term: term;
};
export type expr = _location_object & {
	type: "expr";
	value: expr_item[];
};
export type term = _location_object & {
	type: "term";
	value: number_ | paren_expr;
};
export type number_ = _location_object & {
	type: "number_";
	value: string;
};
export type paren_expr = _location_object & {
	type: "paren_expr";
	expr: expr;
};
export type op = _location_object & {
	type: "op";
	value: string;
};

const create_expr_item = (): expr_item => ({ ...getCurrentLocationObject(), type: "expr_item", op: create_op(), term: create_term() });
const create_expr = (): expr => ({ ...getCurrentLocationObject(), type: "expr", value: [] });
const create_term = (): term => ({ ...getCurrentLocationObject(), type: "term", value: create_number_() });
const create_number_ = (): number_ => ({ ...getCurrentLocationObject(), type: "number_", value: "" });
const create_paren_expr = (): paren_expr => ({ ...getCurrentLocationObject(), type: "paren_expr", expr: create_expr() });
const create_op = (): op => ({ ...getCurrentLocationObject(), type: "op", value: "" });

const parse_expr_item = (arg: expr_item[]) => {
	debugName = "expr_item";
	if (arg.length > 0) parse_op(arg.at(-1)!.op);
	const obj = create_expr_item();
	parse_term(obj.term);
	arg.push(obj);
};
const parse_expr = (expr: expr) => {
	debugName = "expr";
	parse_array_join_fn(parse_expr_item, expr.value);
};
const parse_term = (term: term) => {
	debugName = "term";
	term.value = create_number_();
	if (try_parse_fn(parse_number_, term.value)) return;
	term.value = create_paren_expr();
	if (try_parse_fn(parse_paren_expr, term.value)) return;
	fail_parse("Failed to parse term");
};
const parse_number_ = (number_: number_) => {
	debugName = "number_";
	number_.value = parse_regex(reg`/\d+(\.\d+)?/`, true, false, false);
};
const parse_paren_expr = (paren_expr: paren_expr) => {
	debugName = "paren_expr";
	parse_regex(reg`/\(/`, true, false, false);
	parse_expr(paren_expr.expr);
	parse_regex(reg`/\)/`, true, false, false);
};
const parse_op = (op: op) => {
	debugName = "op";
	op.value = parse_regex(reg`/[+\-*\/]/`, true, false, false);
};

export const parse = (textToParse: string, filePath = "", onFail?: (result: expr) => void) => {
	path = filePath;
	text = textToParse;
	index = 0;
	const result = create_expr();
	successValues.length = 0;
	failedValues.length = 0;
	try {
		parse_expr(result);
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
