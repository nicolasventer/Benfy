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

export type json = {
	type: "json";
	json_content: json_content;
};
export type json_content = {
	type: "json_content";
	value: null_ | boolean_ | string_ | number_ | array_ | object_;
};
export type null_ = {
	type: "null_";
	value: string;
};
export type boolean_ = {
	type: "boolean_";
	value: string;
};
export type string_ = {
	type: "string_";
	value: string;
};
export type number_ = {
	type: "number_";
	value: string;
};
export type array_ = {
	type: "array_";
	array_content: array_content;
};
export type array_content_item = {
	type: "array_content_item";
	json: json;
};
export type array_content = {
	type: "array_content";
	value: array_content_item[];
};
export type object_ = {
	type: "object_";
	object_content: object_content;
};
export type object_content_item = {
	type: "object_content_item";
	object_kv: object_kv;
};
export type object_content = {
	type: "object_content";
	value: object_content_item[];
};
export type object_kv = {
	type: "object_kv";
	string_: string_;
	json: json;
};

const create_json = (): json => ({ type: "json", json_content: create_json_content() });
const create_json_content = (): json_content => ({ type: "json_content", value: create_null_() });
const create_null_ = (): null_ => ({ type: "null_", value: "" });
const create_boolean_ = (): boolean_ => ({ type: "boolean_", value: "" });
const create_string_ = (): string_ => ({ type: "string_", value: "" });
const create_number_ = (): number_ => ({ type: "number_", value: "" });
const create_array_ = (): array_ => ({ type: "array_", array_content: create_array_content() });
const create_array_content_item = (): array_content_item => ({ type: "array_content_item", json: create_json() });
const create_array_content = (): array_content => ({ type: "array_content", value: [] });
const create_object_ = (): object_ => ({ type: "object_", object_content: create_object_content() });
const create_object_content_item = (): object_content_item => ({ type: "object_content_item", object_kv: create_object_kv() });
const create_object_content = (): object_content => ({ type: "object_content", value: [] });
const create_object_kv = (): object_kv => ({ type: "object_kv", string_: create_string_(), json: create_json() });

const parse_json = (json: json) => {
	debugName = "json";
	parse_regex(reg`/\s*/`);
	parse_json_content(json.json_content);
	parse_regex(reg`/\s*/`);
};
const parse_json_content = (json_content: json_content) => {
	debugName = "json_content";
	json_content.value = create_null_();
	if (try_parse_fn(parse_null_, json_content.value)) return;
	json_content.value = create_boolean_();
	if (try_parse_fn(parse_boolean_, json_content.value)) return;
	json_content.value = create_string_();
	if (try_parse_fn(parse_string_, json_content.value)) return;
	json_content.value = create_number_();
	if (try_parse_fn(parse_number_, json_content.value)) return;
	json_content.value = create_array_();
	if (try_parse_fn(parse_array_, json_content.value)) return;
	json_content.value = create_object_();
	if (try_parse_fn(parse_object_, json_content.value)) return;
	fail_parse("Failed to parse json_content");
};
const parse_null_ = (null_: null_) => {
	debugName = "null_";
	null_.value = parse_regex(reg`/null/`);
};
const parse_boolean_ = (boolean_: boolean_) => {
	debugName = "boolean_";
	boolean_.value = parse_regex(reg`/true|false/`);
};
const parse_string_ = (string_: string_) => {
	debugName = "string_";
	string_.value = parse_regex(reg`/"(\\"|[^"])*"/`);
};
const parse_number_ = (number_: number_) => {
	debugName = "number_";
	number_.value = parse_regex(reg`/(0|[1-9][0-9]*)(.[0-9]+)?(e[+-]?[0-9]+)?/`);
};
const parse_array_ = (array_: array_) => {
	debugName = "array_";
	parse_regex(reg`/\[/`);
	parse_array_content(array_.array_content);
	parse_regex(reg`/\]/`);
};
const parse_array_content_item = (array_content_item: array_content_item) => {
	debugName = "array_content_item";
	parse_json(array_content_item.json);
	if (try_parse_fn(parse_regex, reg`/,/`)) return true;
	return false;
};
const parse_array_content = (array_content: array_content) => {
	debugName = "array_content";
	parse_array_fn(parse_array_content_item, array_content.value, create_array_content_item, 0);
};
const parse_object_ = (object_: object_) => {
	debugName = "object_";
	parse_regex(reg`/\{/`);
	parse_object_content(object_.object_content);
	parse_regex(reg`/}/`);
};
const parse_object_content_item = (object_content_item: object_content_item) => {
	debugName = "object_content_item";
	parse_object_kv(object_content_item.object_kv);
	if (try_parse_fn(parse_regex, reg`/,/`)) return true;
	return false;
};
const parse_object_content = (object_content: object_content) => {
	debugName = "object_content";
	parse_array_fn(parse_object_content_item, object_content.value, create_object_content_item, 0);
};
const parse_object_kv = (object_kv: object_kv) => {
	debugName = "object_kv";
	parse_regex(reg`/\s*/`);
	parse_string_(object_kv.string_);
	parse_regex(reg`/\s*:/`);
	parse_json(object_kv.json);
};

export const parse = (textToParse: string, onFail?: (result: json) => void) => {
	text = textToParse;
	index = 0;
	const result = create_json();
	successValues.length = 0;
	failedValues.length = 0;
	try {
		parse_json(result);
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
