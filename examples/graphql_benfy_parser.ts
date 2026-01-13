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

export type Document = {
	type: "Document";
	Ignored: Ignored;
	Definition: Definition[];
	Ignored: Ignored;
};
export type SourceCharacter = {
	type: "SourceCharacter";
	value: string;
};
export type Ignored = {
	type: "Ignored";
	value: UnicodeBOM | WhiteSpace | LineTerminator | Comment | Comma;
};
export type UnicodeBOM = {
	type: "UnicodeBOM";
	value: string;
};
export type WhiteSpace = {
	type: "WhiteSpace";
	value: string;
};
export type LineTerminator = {
	type: "LineTerminator";
	value: string;
};
export type Comment = {
	type: "Comment";
	CommentChar: CommentChar[];
};
export type CommentChar = {
	type: "CommentChar";
	SourceCharacter: SourceCharacter;
};
export type Comma = {
	type: "Comma";
	value: string;
};
export type Token = {
	type: "Token";
	value: Punctuator | Name | IntValue | FloatValue | StringValue;
};
export type Punctuator = {
	type: "Punctuator";
	value: string;
};
export type Name = {
	type: "Name";
	value: string;
};
export type IntValue = {
	type: "IntValue";
	IntegerPart: IntegerPart;
};
export type IntegerPart = {
	type: "IntegerPart";
	value: IntegerPart_0 | IntegerPart_1;
};
export type IntegerPart_0 = {
	type: "IntegerPart_0";
	NegativeSign?: NegativeSign;
	Ignored: Ignored;
	Ignored: Ignored;
};
export type IntegerPart_1 = {
	type: "IntegerPart_1";
	NegativeSign?: NegativeSign;
	Ignored: Ignored;
	NonZeroDigit: NonZeroDigit;
	Ignored: Ignored;
	Digit: Digit[];
	Ignored: Ignored;
};
export type NegativeSign = {
	type: "NegativeSign";
	value: string;
};
export type Digit = {
	type: "Digit";
	value: string;
};
export type NonZeroDigit = {
	type: "NonZeroDigit";
	Digit: Digit;
};
export type FloatValue = {
	type: "FloatValue";
	value: FloatValue_0 | FloatValue_1 | FloatValue_2;
};
export type FloatValue_0 = {
	type: "FloatValue_0";
	IntegerPart: IntegerPart;
	FractionalPart: FractionalPart;
};
export type FloatValue_1 = {
	type: "FloatValue_1";
	IntegerPart: IntegerPart;
	ExponentPart: ExponentPart;
};
export type FloatValue_2 = {
	type: "FloatValue_2";
	IntegerPart: IntegerPart;
	FractionalPart: FractionalPart;
	ExponentPart: ExponentPart;
};
export type FractionalPart = {
	type: "FractionalPart";
	Digit: Digit[];
};
export type ExponentPart = {
	type: "ExponentPart";
	ExponentIndicator: ExponentIndicator;
	Sign?: Sign;
	Digit: Digit[];
};
export type ExponentIndicator = {
	type: "ExponentIndicator";
	value: string;
};
export type Sign = {
	type: "Sign";
	value: string;
};
export type StringValue = {
	type: "StringValue";
	value: StringValue_0 | StringValue_1 | StringValue_2 | StringValue_3;
};
export type StringValue_0 = {
	type: "StringValue_0";
	value: string;
};
export type StringValue_1 = {
	type: "StringValue_1";
	value: string;
};
export type StringValue_2 = {
	type: "StringValue_2";
	StringCharacter: StringCharacter[];
};
export type StringValue_3 = {
	type: "StringValue_3";
	BlockStringCharacter: BlockStringCharacter[];
};
export type StringCharacter = {
	type: "StringCharacter";
	value: StringCharacter_0 | StringCharacter_1 | StringCharacter_2 | StringCharacter_3 | StringCharacter_4;
};
export type StringCharacter_0 = {
	type: "StringCharacter_0";
	SourceCharacter: SourceCharacter;
};
export type StringCharacter_1 = {
	type: "StringCharacter_1";
	SourceCharacter: SourceCharacter;
};
export type StringCharacter_2 = {
	type: "StringCharacter_2";
	SourceCharacter: SourceCharacter;
};
export type StringCharacter_3 = {
	type: "StringCharacter_3";
	EscapedUnicode: EscapedUnicode;
};
export type StringCharacter_4 = {
	type: "StringCharacter_4";
	EscapedCharacter: EscapedCharacter;
};
export type EscapedUnicode = {
	type: "EscapedUnicode";
	value: string;
};
export type EscapedCharacter = {
	type: "EscapedCharacter";
	value: string;
};
export type BlockStringCharacter = {
	type: "BlockStringCharacter";
	value: BlockStringCharacter_0 | BlockStringCharacter_1 | BlockStringCharacter_2;
};
export type BlockStringCharacter_0 = {
	type: "BlockStringCharacter_0";
	SourceCharacter: SourceCharacter;
};
export type BlockStringCharacter_1 = {
	type: "BlockStringCharacter_1";
	SourceCharacter: SourceCharacter;
};
export type BlockStringCharacter_2 = {
	type: "BlockStringCharacter_2";
	value: string;
};
export type Definition = {
	type: "Definition";
	value: ExecutableDefinition | TypeSystemDefinition | TypeSystemExtension;
};
export type ExecutableDefinition = {
	type: "ExecutableDefinition";
	value: OperationDefinition | FragmentDefinition;
};
export type OperationDefinition = {
	type: "OperationDefinition";
	value: OperationDefinition_0 | OperationDefinition_1;
};
export type OperationDefinition_0 = {
	type: "OperationDefinition_0";
	SelectionSet: SelectionSet;
	Ignored: Ignored;
};
export type OperationDefinition_1 = {
	type: "OperationDefinition_1";
	Ignored: Ignored;
	OperationType: OperationType;
	Ignored: Ignored;
	Name?: Name;
	Ignored: Ignored;
	VariableDefinitions?: VariableDefinitions;
	Ignored: Ignored;
	Directives?: Directives;
	SelectionSet: SelectionSet;
	Ignored: Ignored;
};
export type OperationType = {
	type: "OperationType";
	value: string;
};
export type SelectionSet = {
	type: "SelectionSet";
	Ignored: Ignored;
	Selection: Selection[];
	Ignored: Ignored;
	Ignored: Ignored;
};
export type Selection = {
	type: "Selection";
	value: Selection_0 | Selection_1 | Selection_2;
};
export type Selection_0 = {
	type: "Selection_0";
	Field: Field;
	Ignored: Ignored;
};
export type Selection_1 = {
	type: "Selection_1";
	FragmentSpread: FragmentSpread;
	Ignored: Ignored;
};
export type Selection_2 = {
	type: "Selection_2";
	InlineFragment: InlineFragment;
	Ignored: Ignored;
};
export type Field = {
	type: "Field";
	Alias?: Alias;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Arguments?: Arguments;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	SelectionSet?: SelectionSet;
	Ignored: Ignored;
};
export type Alias = {
	type: "Alias";
	Name: Name;
	Ignored: Ignored;
	Ignored: Ignored;
};
export type Arguments = {
	type: "Arguments";
	Ignored: Ignored;
	Argument: Argument[];
	Ignored: Ignored;
	Ignored: Ignored;
};
export type Argument = {
	type: "Argument";
	Name: Name;
	Ignored: Ignored;
	Ignored: Ignored;
	Value: Value;
	Ignored: Ignored;
};
export type FragmentSpread = {
	type: "FragmentSpread";
	Ignored: Ignored;
	FragmentName: FragmentName;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
};
export type InlineFragment = {
	type: "InlineFragment";
	Ignored: Ignored;
	TypeCondition?: TypeCondition;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	SelectionSet: SelectionSet;
	Ignored: Ignored;
};
export type FragmentDefinition = {
	type: "FragmentDefinition";
	Ignored: Ignored;
	FragmentName: FragmentName;
	Ignored: Ignored;
	TypeCondition: TypeCondition;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	SelectionSet: SelectionSet;
	Ignored: Ignored;
};
export type FragmentName = {
	type: "FragmentName";
	Name: Name;
};
export type TypeCondition = {
	type: "TypeCondition";
	Ignored: Ignored;
	NamedType: NamedType;
	Ignored: Ignored;
};
export type Value = {
	type: "Value";
	value: Variable | IntValue | FloatValue | StringValue | BooleanValue | NullValue | EnumValue | ListValue | ObjectValue;
};
export type BooleanValue = {
	type: "BooleanValue";
	value: string;
};
export type NullValue = {
	type: "NullValue";
	value: string;
};
export type EnumValue = {
	type: "EnumValue";
	value: EnumValue_0 | EnumValue_1 | EnumValue_2;
};
export type EnumValue_0 = {
	type: "EnumValue_0";
	Name: Name;
};
export type EnumValue_1 = {
	type: "EnumValue_1";
	Name: Name;
};
export type EnumValue_2 = {
	type: "EnumValue_2";
	Name: Name;
};
export type ListValue = {
	type: "ListValue";
	value: ListValue_0 | ListValue_1;
};
export type ListValue_0 = {
	type: "ListValue_0";
	value: string;
};
export type ListValue_1 = {
	type: "ListValue_1";
	Value: Value[];
};
export type ObjectValue = {
	type: "ObjectValue";
	value: ObjectValue_0 | ObjectValue_1;
};
export type ObjectValue_0 = {
	type: "ObjectValue_0";
	value: string;
};
export type ObjectValue_1 = {
	type: "ObjectValue_1";
	ObjectField: ObjectField[];
};
export type ObjectField = {
	type: "ObjectField";
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Ignored: Ignored;
	Value: Value;
	Ignored: Ignored;
};
export type VariableDefinitions = {
	type: "VariableDefinitions";
	VariableDefinition: VariableDefinition[];
};
export type VariableDefinition = {
	type: "VariableDefinition";
	Variable: Variable;
	Ignored: Ignored;
	Ignored: Ignored;
	Type: Type;
	Ignored: Ignored;
	DefaultValue?: DefaultValue;
	Ignored: Ignored;
};
export type Variable = {
	type: "Variable";
	Name: Name;
};
export type DefaultValue = {
	type: "DefaultValue";
	Ignored: Ignored;
	Value: Value;
};
export type Type = {
	type: "Type";
	value: NamedType | ListType | NonNullType;
};
export type NamedType = {
	type: "NamedType";
	Name: Name;
};
export type ListType = {
	type: "ListType";
	Type: Type;
};
export type NonNullType = {
	type: "NonNullType";
	value: NonNullType_0 | NonNullType_1;
};
export type NonNullType_0 = {
	type: "NonNullType_0";
	NamedType: NamedType;
};
export type NonNullType_1 = {
	type: "NonNullType_1";
	ListType: ListType;
};
export type Directives = {
	type: "Directives";
	Directive: Directive[];
};
export type Directive = {
	type: "Directive";
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Arguments?: Arguments;
	Ignored: Ignored;
};
export type TypeSystemDefinition = {
	type: "TypeSystemDefinition";
	value: SchemaDefinition | TypeDefinition | DirectiveDefinition;
};
export type TypeSystemExtension = {
	type: "TypeSystemExtension";
	value: SchemaExtension | TypeExtension;
};
export type SchemaDefinition = {
	type: "SchemaDefinition";
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	Ignored: Ignored;
	OperationTypeDefinition: OperationTypeDefinition[];
	Ignored: Ignored;
	Ignored: Ignored;
};
export type SchemaExtension = {
	type: "SchemaExtension";
	value: SchemaExtension_0 | SchemaExtension_1;
};
export type SchemaExtension_0 = {
	type: "SchemaExtension_0";
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	Ignored: Ignored;
	OperationTypeDefinition: OperationTypeDefinition[];
	Ignored: Ignored;
	Ignored: Ignored;
};
export type SchemaExtension_1 = {
	type: "SchemaExtension_1";
	Ignored: Ignored;
	Directives: Directives;
	Ignored: Ignored;
};
export type OperationTypeDefinition = {
	type: "OperationTypeDefinition";
	OperationType: OperationType;
	Ignored: Ignored;
	Ignored: Ignored;
	NamedType: NamedType;
	Ignored: Ignored;
};
export type Description = {
	type: "Description";
	StringValue: StringValue;
};
export type TypeDefinition = {
	type: "TypeDefinition";
	value: ScalarTypeDefinition | ObjectTypeDefinition | InterfaceTypeDefinition | UnionTypeDefinition | EnumTypeDefinition | InputObjectTypeDefinition;
};
export type TypeExtension = {
	type: "TypeExtension";
	value: ScalarTypeExtension | ObjectTypeExtension | InterfaceTypeExtension | UnionTypeExtension | EnumTypeExtension | InputObjectTypeExtension;
};
export type ScalarTypeDefinition = {
	type: "ScalarTypeDefinition";
	Description?: Description;
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
};
export type ScalarTypeExtension = {
	type: "ScalarTypeExtension";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives: Directives;
	Ignored: Ignored;
};
export type ObjectTypeDefinition = {
	type: "ObjectTypeDefinition";
	Description?: Description;
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	ImplementsInterfaces?: ImplementsInterfaces;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	FieldsDefinition?: FieldsDefinition;
	Ignored: Ignored;
};
export type ObjectTypeExtension = {
	type: "ObjectTypeExtension";
	value: ObjectTypeExtension_0 | ObjectTypeExtension_1 | ObjectTypeExtension_2;
};
export type ObjectTypeExtension_0 = {
	type: "ObjectTypeExtension_0";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	ImplementsInterfaces?: ImplementsInterfaces;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	FieldsDefinition: FieldsDefinition;
	Ignored: Ignored;
};
export type ObjectTypeExtension_1 = {
	type: "ObjectTypeExtension_1";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	ImplementsInterfaces?: ImplementsInterfaces;
	Ignored: Ignored;
	Directives: Directives;
	Ignored: Ignored;
};
export type ObjectTypeExtension_2 = {
	type: "ObjectTypeExtension_2";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	ImplementsInterfaces: ImplementsInterfaces;
	Ignored: Ignored;
};
export type ImplementsInterfaces = {
	type: "ImplementsInterfaces";
	value: ImplementsInterfaces_0 | ImplementsInterfaces_1;
};
export type ImplementsInterfaces_0 = {
	type: "ImplementsInterfaces_0";
	Ignored: Ignored;
	Ignored: Ignored;
	NamedType: NamedType;
	Ignored: Ignored;
};
export type ImplementsInterfaces_1 = {
	type: "ImplementsInterfaces_1";
	ImplementsInterfaces: ImplementsInterfaces;
	Ignored: Ignored;
	Ignored: Ignored;
	NamedType: NamedType;
	Ignored: Ignored;
};
export type InterfaceTypeDefinition = {
	type: "InterfaceTypeDefinition";
	Description?: Description;
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	FieldsDefinition?: FieldsDefinition;
	Ignored: Ignored;
};
export type InterfaceTypeExtension = {
	type: "InterfaceTypeExtension";
	value: InterfaceTypeExtension_0 | InterfaceTypeExtension_1;
};
export type InterfaceTypeExtension_0 = {
	type: "InterfaceTypeExtension_0";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	FieldsDefinition: FieldsDefinition;
	Ignored: Ignored;
};
export type InterfaceTypeExtension_1 = {
	type: "InterfaceTypeExtension_1";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives: Directives;
	Ignored: Ignored;
};
export type UnionTypeDefinition = {
	type: "UnionTypeDefinition";
	Description?: Description;
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	UnionMemberTypes?: UnionMemberTypes;
	Ignored: Ignored;
};
export type UnionMemberTypes = {
	type: "UnionMemberTypes";
	value: UnionMemberTypes_0 | UnionMemberTypes_1;
};
export type UnionMemberTypes_0 = {
	type: "UnionMemberTypes_0";
	Ignored: Ignored;
	Ignored: Ignored;
	NamedType: NamedType;
	Ignored: Ignored;
};
export type UnionMemberTypes_1 = {
	type: "UnionMemberTypes_1";
	UnionMemberTypes: UnionMemberTypes;
	Ignored: Ignored;
	Ignored: Ignored;
	NamedType: NamedType;
	Ignored: Ignored;
};
export type UnionTypeExtension = {
	type: "UnionTypeExtension";
	value: UnionTypeExtension_0 | UnionTypeExtension_1;
};
export type UnionTypeExtension_0 = {
	type: "UnionTypeExtension_0";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	UnionMemberTypes?: UnionMemberTypes;
	Ignored: Ignored;
};
export type UnionTypeExtension_1 = {
	type: "UnionTypeExtension_1";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives: Directives;
	Ignored: Ignored;
};
export type EnumTypeDefinition = {
	type: "EnumTypeDefinition";
	Description?: Description;
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	EnumValuesDefinition?: EnumValuesDefinition;
	Ignored: Ignored;
};
export type EnumValuesDefinition = {
	type: "EnumValuesDefinition";
	Ignored: Ignored;
	EnumValueDefinition: EnumValueDefinition[];
	Ignored: Ignored;
	Ignored: Ignored;
};
export type EnumValueDefinition = {
	type: "EnumValueDefinition";
	Description?: Description;
	Ignored: Ignored;
	EnumValue: EnumValue;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
};
export type EnumTypeExtension = {
	type: "EnumTypeExtension";
	value: EnumTypeExtension_0 | EnumTypeExtension_1;
};
export type EnumTypeExtension_0 = {
	type: "EnumTypeExtension_0";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	EnumValuesDefinition: EnumValuesDefinition;
	Ignored: Ignored;
};
export type EnumTypeExtension_1 = {
	type: "EnumTypeExtension_1";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives: Directives;
	Ignored: Ignored;
};
export type InputObjectTypeDefinition = {
	type: "InputObjectTypeDefinition";
	Description?: Description;
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	InputFieldsDefinition?: InputFieldsDefinition;
	Ignored: Ignored;
};
export type InputFieldsDefinition = {
	type: "InputFieldsDefinition";
	Ignored: Ignored;
	InputValueDefinition: InputValueDefinition[];
	Ignored: Ignored;
	Ignored: Ignored;
};
export type InputObjectTypeExtension = {
	type: "InputObjectTypeExtension";
	value: InputObjectTypeExtension_0 | InputObjectTypeExtension_1;
};
export type InputObjectTypeExtension_0 = {
	type: "InputObjectTypeExtension_0";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
	InputFieldsDefinition: InputFieldsDefinition;
	Ignored: Ignored;
};
export type InputObjectTypeExtension_1 = {
	type: "InputObjectTypeExtension_1";
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Directives: Directives;
	Ignored: Ignored;
};
export type DirectiveDefinition = {
	type: "DirectiveDefinition";
	Description?: Description;
	Ignored: Ignored;
	Ignored: Ignored;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	ArgumentsDefinition?: ArgumentsDefinition;
	Ignored: Ignored;
	Ignored: Ignored;
	DirectiveLocations: DirectiveLocations;
	Ignored: Ignored;
};
export type DirectiveLocations = {
	type: "DirectiveLocations";
	value: DirectiveLocations_0 | DirectiveLocations_1;
};
export type DirectiveLocations_0 = {
	type: "DirectiveLocations_0";
	Ignored: Ignored;
	DirectiveLocation: DirectiveLocation;
	Ignored: Ignored;
};
export type DirectiveLocations_1 = {
	type: "DirectiveLocations_1";
	DirectiveLocations: DirectiveLocations;
	Ignored: Ignored;
	Ignored: Ignored;
	DirectiveLocation: DirectiveLocation;
	Ignored: Ignored;
};
export type DirectiveLocation = {
	type: "DirectiveLocation";
	value: ExecutableDirectiveLocation | TypeSystemDirectiveLocation;
};
export type ExecutableDirectiveLocation = {
	type: "ExecutableDirectiveLocation";
	value: string;
};
export type TypeSystemDirectiveLocation = {
	type: "TypeSystemDirectiveLocation";
	value: string;
};
export type FieldsDefinition = {
	type: "FieldsDefinition";
	Ignored: Ignored;
	FieldDefinition: FieldDefinition[];
	Ignored: Ignored;
};
export type FieldDefinition = {
	type: "FieldDefinition";
	Description?: Description;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	ArgumentsDefinition?: ArgumentsDefinition;
	Ignored: Ignored;
	Ignored: Ignored;
	Type: Type;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
};
export type ArgumentsDefinition = {
	type: "ArgumentsDefinition";
	Ignored: Ignored;
	InputValueDefinition: InputValueDefinition[];
	Ignored: Ignored;
	Ignored: Ignored;
};
export type InputValueDefinition = {
	type: "InputValueDefinition";
	Description?: Description;
	Ignored: Ignored;
	Name: Name;
	Ignored: Ignored;
	Ignored: Ignored;
	Type: Type;
	Ignored: Ignored;
	DefaultValue?: DefaultValue;
	Ignored: Ignored;
	Directives?: Directives;
	Ignored: Ignored;
};

const create_Document = (): Document => ({ type: "Document", Ignored: create_Ignored(), Definition: [], Ignored: create_Ignored() });
const create_SourceCharacter = (): SourceCharacter => ({ type: "SourceCharacter", value: "" });
const create_Ignored = (): Ignored => ({ type: "Ignored", value: create_UnicodeBOM() });
const create_UnicodeBOM = (): UnicodeBOM => ({ type: "UnicodeBOM", value: "" });
const create_WhiteSpace = (): WhiteSpace => ({ type: "WhiteSpace", value: "" });
const create_LineTerminator = (): LineTerminator => ({ type: "LineTerminator", value: "" });
const create_Comment = (): Comment => ({ type: "Comment", CommentChar: [] });
const create_CommentChar = (): CommentChar => ({ type: "CommentChar", SourceCharacter: create_SourceCharacter() });
const create_Comma = (): Comma => ({ type: "Comma", value: "" });
const create_Token = (): Token => ({ type: "Token", value: create_Punctuator() });
const create_Punctuator = (): Punctuator => ({ type: "Punctuator", value: "" });
const create_Name = (): Name => ({ type: "Name", value: "" });
const create_IntValue = (): IntValue => ({ type: "IntValue", IntegerPart: create_IntegerPart() });
const create_IntegerPart = (): IntegerPart => ({ type: "IntegerPart", value: create_IntegerPart_0() });
const create_IntegerPart_0 = (): IntegerPart_0 => ({ type: "IntegerPart_0", Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_IntegerPart_1 = (): IntegerPart_1 => ({ type: "IntegerPart_1", Ignored: create_Ignored(), NonZeroDigit: create_NonZeroDigit(), Ignored: create_Ignored(), Digit: [], Ignored: create_Ignored() });
const create_NegativeSign = (): NegativeSign => ({ type: "NegativeSign", value: "" });
const create_Digit = (): Digit => ({ type: "Digit", value: "" });
const create_NonZeroDigit = (): NonZeroDigit => ({ type: "NonZeroDigit", Digit: create_Digit() });
const create_FloatValue = (): FloatValue => ({ type: "FloatValue", value: create_FloatValue_0() });
const create_FloatValue_0 = (): FloatValue_0 => ({ type: "FloatValue_0", IntegerPart: create_IntegerPart(), FractionalPart: create_FractionalPart() });
const create_FloatValue_1 = (): FloatValue_1 => ({ type: "FloatValue_1", IntegerPart: create_IntegerPart(), ExponentPart: create_ExponentPart() });
const create_FloatValue_2 = (): FloatValue_2 => ({ type: "FloatValue_2", IntegerPart: create_IntegerPart(), FractionalPart: create_FractionalPart(), ExponentPart: create_ExponentPart() });
const create_FractionalPart = (): FractionalPart => ({ type: "FractionalPart", Digit: [] });
const create_ExponentPart = (): ExponentPart => ({ type: "ExponentPart", ExponentIndicator: create_ExponentIndicator(), Digit: [] });
const create_ExponentIndicator = (): ExponentIndicator => ({ type: "ExponentIndicator", value: "" });
const create_Sign = (): Sign => ({ type: "Sign", value: "" });
const create_StringValue = (): StringValue => ({ type: "StringValue", value: create_StringValue_0() });
const create_StringValue_0 = (): StringValue_0 => ({ type: "StringValue_0", value: "" });
const create_StringValue_1 = (): StringValue_1 => ({ type: "StringValue_1", value: "" });
const create_StringValue_2 = (): StringValue_2 => ({ type: "StringValue_2", StringCharacter: [] });
const create_StringValue_3 = (): StringValue_3 => ({ type: "StringValue_3", BlockStringCharacter: [] });
const create_StringCharacter = (): StringCharacter => ({ type: "StringCharacter", value: create_StringCharacter_0() });
const create_StringCharacter_0 = (): StringCharacter_0 => ({ type: "StringCharacter_0", SourceCharacter: create_SourceCharacter() });
const create_StringCharacter_1 = (): StringCharacter_1 => ({ type: "StringCharacter_1", SourceCharacter: create_SourceCharacter() });
const create_StringCharacter_2 = (): StringCharacter_2 => ({ type: "StringCharacter_2", SourceCharacter: create_SourceCharacter() });
const create_StringCharacter_3 = (): StringCharacter_3 => ({ type: "StringCharacter_3", EscapedUnicode: create_EscapedUnicode() });
const create_StringCharacter_4 = (): StringCharacter_4 => ({ type: "StringCharacter_4", EscapedCharacter: create_EscapedCharacter() });
const create_EscapedUnicode = (): EscapedUnicode => ({ type: "EscapedUnicode", value: "" });
const create_EscapedCharacter = (): EscapedCharacter => ({ type: "EscapedCharacter", value: "" });
const create_BlockStringCharacter = (): BlockStringCharacter => ({ type: "BlockStringCharacter", value: create_BlockStringCharacter_0() });
const create_BlockStringCharacter_0 = (): BlockStringCharacter_0 => ({ type: "BlockStringCharacter_0", SourceCharacter: create_SourceCharacter() });
const create_BlockStringCharacter_1 = (): BlockStringCharacter_1 => ({ type: "BlockStringCharacter_1", SourceCharacter: create_SourceCharacter() });
const create_BlockStringCharacter_2 = (): BlockStringCharacter_2 => ({ type: "BlockStringCharacter_2", value: "" });
const create_Definition = (): Definition => ({ type: "Definition", value: create_ExecutableDefinition() });
const create_ExecutableDefinition = (): ExecutableDefinition => ({ type: "ExecutableDefinition", value: create_OperationDefinition() });
const create_OperationDefinition = (): OperationDefinition => ({ type: "OperationDefinition", value: create_OperationDefinition_0() });
const create_OperationDefinition_0 = (): OperationDefinition_0 => ({ type: "OperationDefinition_0", SelectionSet: create_SelectionSet(), Ignored: create_Ignored() });
const create_OperationDefinition_1 = (): OperationDefinition_1 => ({ type: "OperationDefinition_1", Ignored: create_Ignored(), OperationType: create_OperationType(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored(), SelectionSet: create_SelectionSet(), Ignored: create_Ignored() });
const create_OperationType = (): OperationType => ({ type: "OperationType", value: "" });
const create_SelectionSet = (): SelectionSet => ({ type: "SelectionSet", Ignored: create_Ignored(), Selection: [], Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_Selection = (): Selection => ({ type: "Selection", value: create_Selection_0() });
const create_Selection_0 = (): Selection_0 => ({ type: "Selection_0", Field: create_Field(), Ignored: create_Ignored() });
const create_Selection_1 = (): Selection_1 => ({ type: "Selection_1", FragmentSpread: create_FragmentSpread(), Ignored: create_Ignored() });
const create_Selection_2 = (): Selection_2 => ({ type: "Selection_2", InlineFragment: create_InlineFragment(), Ignored: create_Ignored() });
const create_Field = (): Field => ({ type: "Field", Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_Alias = (): Alias => ({ type: "Alias", Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_Arguments = (): Arguments => ({ type: "Arguments", Ignored: create_Ignored(), Argument: [], Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_Argument = (): Argument => ({ type: "Argument", Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Value: create_Value(), Ignored: create_Ignored() });
const create_FragmentSpread = (): FragmentSpread => ({ type: "FragmentSpread", Ignored: create_Ignored(), FragmentName: create_FragmentName(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_InlineFragment = (): InlineFragment => ({ type: "InlineFragment", Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored(), SelectionSet: create_SelectionSet(), Ignored: create_Ignored() });
const create_FragmentDefinition = (): FragmentDefinition => ({ type: "FragmentDefinition", Ignored: create_Ignored(), FragmentName: create_FragmentName(), Ignored: create_Ignored(), TypeCondition: create_TypeCondition(), Ignored: create_Ignored(), Ignored: create_Ignored(), SelectionSet: create_SelectionSet(), Ignored: create_Ignored() });
const create_FragmentName = (): FragmentName => ({ type: "FragmentName", Name: create_Name() });
const create_TypeCondition = (): TypeCondition => ({ type: "TypeCondition", Ignored: create_Ignored(), NamedType: create_NamedType(), Ignored: create_Ignored() });
const create_Value = (): Value => ({ type: "Value", value: create_Variable() });
const create_BooleanValue = (): BooleanValue => ({ type: "BooleanValue", value: "" });
const create_NullValue = (): NullValue => ({ type: "NullValue", value: "" });
const create_EnumValue = (): EnumValue => ({ type: "EnumValue", value: create_EnumValue_0() });
const create_EnumValue_0 = (): EnumValue_0 => ({ type: "EnumValue_0", Name: create_Name() });
const create_EnumValue_1 = (): EnumValue_1 => ({ type: "EnumValue_1", Name: create_Name() });
const create_EnumValue_2 = (): EnumValue_2 => ({ type: "EnumValue_2", Name: create_Name() });
const create_ListValue = (): ListValue => ({ type: "ListValue", value: create_ListValue_0() });
const create_ListValue_0 = (): ListValue_0 => ({ type: "ListValue_0", value: "" });
const create_ListValue_1 = (): ListValue_1 => ({ type: "ListValue_1", Value: [] });
const create_ObjectValue = (): ObjectValue => ({ type: "ObjectValue", value: create_ObjectValue_0() });
const create_ObjectValue_0 = (): ObjectValue_0 => ({ type: "ObjectValue_0", value: "" });
const create_ObjectValue_1 = (): ObjectValue_1 => ({ type: "ObjectValue_1", ObjectField: [] });
const create_ObjectField = (): ObjectField => ({ type: "ObjectField", Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Value: create_Value(), Ignored: create_Ignored() });
const create_VariableDefinitions = (): VariableDefinitions => ({ type: "VariableDefinitions", VariableDefinition: [] });
const create_VariableDefinition = (): VariableDefinition => ({ type: "VariableDefinition", Variable: create_Variable(), Ignored: create_Ignored(), Ignored: create_Ignored(), Type: create_Type(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_Variable = (): Variable => ({ type: "Variable", Name: create_Name() });
const create_DefaultValue = (): DefaultValue => ({ type: "DefaultValue", Ignored: create_Ignored(), Value: create_Value() });
const create_Type = (): Type => ({ type: "Type", value: create_NamedType() });
const create_NamedType = (): NamedType => ({ type: "NamedType", Name: create_Name() });
const create_ListType = (): ListType => ({ type: "ListType", Type: create_Type() });
const create_NonNullType = (): NonNullType => ({ type: "NonNullType", value: create_NonNullType_0() });
const create_NonNullType_0 = (): NonNullType_0 => ({ type: "NonNullType_0", NamedType: create_NamedType() });
const create_NonNullType_1 = (): NonNullType_1 => ({ type: "NonNullType_1", ListType: create_ListType() });
const create_Directives = (): Directives => ({ type: "Directives", Directive: [] });
const create_Directive = (): Directive => ({ type: "Directive", Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_TypeSystemDefinition = (): TypeSystemDefinition => ({ type: "TypeSystemDefinition", value: create_SchemaDefinition() });
const create_TypeSystemExtension = (): TypeSystemExtension => ({ type: "TypeSystemExtension", value: create_SchemaExtension() });
const create_SchemaDefinition = (): SchemaDefinition => ({ type: "SchemaDefinition", Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored(), OperationTypeDefinition: [], Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_SchemaExtension = (): SchemaExtension => ({ type: "SchemaExtension", value: create_SchemaExtension_0() });
const create_SchemaExtension_0 = (): SchemaExtension_0 => ({ type: "SchemaExtension_0", Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored(), OperationTypeDefinition: [], Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_SchemaExtension_1 = (): SchemaExtension_1 => ({ type: "SchemaExtension_1", Ignored: create_Ignored(), Directives: create_Directives(), Ignored: create_Ignored() });
const create_OperationTypeDefinition = (): OperationTypeDefinition => ({ type: "OperationTypeDefinition", OperationType: create_OperationType(), Ignored: create_Ignored(), Ignored: create_Ignored(), NamedType: create_NamedType(), Ignored: create_Ignored() });
const create_Description = (): Description => ({ type: "Description", StringValue: create_StringValue() });
const create_TypeDefinition = (): TypeDefinition => ({ type: "TypeDefinition", value: create_ScalarTypeDefinition() });
const create_TypeExtension = (): TypeExtension => ({ type: "TypeExtension", value: create_ScalarTypeExtension() });
const create_ScalarTypeDefinition = (): ScalarTypeDefinition => ({ type: "ScalarTypeDefinition", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_ScalarTypeExtension = (): ScalarTypeExtension => ({ type: "ScalarTypeExtension", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Directives: create_Directives(), Ignored: create_Ignored() });
const create_ObjectTypeDefinition = (): ObjectTypeDefinition => ({ type: "ObjectTypeDefinition", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_ObjectTypeExtension = (): ObjectTypeExtension => ({ type: "ObjectTypeExtension", value: create_ObjectTypeExtension_0() });
const create_ObjectTypeExtension_0 = (): ObjectTypeExtension_0 => ({ type: "ObjectTypeExtension_0", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored(), FieldsDefinition: create_FieldsDefinition(), Ignored: create_Ignored() });
const create_ObjectTypeExtension_1 = (): ObjectTypeExtension_1 => ({ type: "ObjectTypeExtension_1", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Directives: create_Directives(), Ignored: create_Ignored() });
const create_ObjectTypeExtension_2 = (): ObjectTypeExtension_2 => ({ type: "ObjectTypeExtension_2", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), ImplementsInterfaces: create_ImplementsInterfaces(), Ignored: create_Ignored() });
const create_ImplementsInterfaces = (): ImplementsInterfaces => ({ type: "ImplementsInterfaces", value: create_ImplementsInterfaces_0() });
const create_ImplementsInterfaces_0 = (): ImplementsInterfaces_0 => ({ type: "ImplementsInterfaces_0", Ignored: create_Ignored(), Ignored: create_Ignored(), NamedType: create_NamedType(), Ignored: create_Ignored() });
const create_ImplementsInterfaces_1 = (): ImplementsInterfaces_1 => ({ type: "ImplementsInterfaces_1", ImplementsInterfaces: create_ImplementsInterfaces(), Ignored: create_Ignored(), Ignored: create_Ignored(), NamedType: create_NamedType(), Ignored: create_Ignored() });
const create_InterfaceTypeDefinition = (): InterfaceTypeDefinition => ({ type: "InterfaceTypeDefinition", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_InterfaceTypeExtension = (): InterfaceTypeExtension => ({ type: "InterfaceTypeExtension", value: create_InterfaceTypeExtension_0() });
const create_InterfaceTypeExtension_0 = (): InterfaceTypeExtension_0 => ({ type: "InterfaceTypeExtension_0", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), FieldsDefinition: create_FieldsDefinition(), Ignored: create_Ignored() });
const create_InterfaceTypeExtension_1 = (): InterfaceTypeExtension_1 => ({ type: "InterfaceTypeExtension_1", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Directives: create_Directives(), Ignored: create_Ignored() });
const create_UnionTypeDefinition = (): UnionTypeDefinition => ({ type: "UnionTypeDefinition", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_UnionMemberTypes = (): UnionMemberTypes => ({ type: "UnionMemberTypes", value: create_UnionMemberTypes_0() });
const create_UnionMemberTypes_0 = (): UnionMemberTypes_0 => ({ type: "UnionMemberTypes_0", Ignored: create_Ignored(), Ignored: create_Ignored(), NamedType: create_NamedType(), Ignored: create_Ignored() });
const create_UnionMemberTypes_1 = (): UnionMemberTypes_1 => ({ type: "UnionMemberTypes_1", UnionMemberTypes: create_UnionMemberTypes(), Ignored: create_Ignored(), Ignored: create_Ignored(), NamedType: create_NamedType(), Ignored: create_Ignored() });
const create_UnionTypeExtension = (): UnionTypeExtension => ({ type: "UnionTypeExtension", value: create_UnionTypeExtension_0() });
const create_UnionTypeExtension_0 = (): UnionTypeExtension_0 => ({ type: "UnionTypeExtension_0", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_UnionTypeExtension_1 = (): UnionTypeExtension_1 => ({ type: "UnionTypeExtension_1", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Directives: create_Directives(), Ignored: create_Ignored() });
const create_EnumTypeDefinition = (): EnumTypeDefinition => ({ type: "EnumTypeDefinition", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_EnumValuesDefinition = (): EnumValuesDefinition => ({ type: "EnumValuesDefinition", Ignored: create_Ignored(), EnumValueDefinition: [], Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_EnumValueDefinition = (): EnumValueDefinition => ({ type: "EnumValueDefinition", Ignored: create_Ignored(), EnumValue: create_EnumValue(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_EnumTypeExtension = (): EnumTypeExtension => ({ type: "EnumTypeExtension", value: create_EnumTypeExtension_0() });
const create_EnumTypeExtension_0 = (): EnumTypeExtension_0 => ({ type: "EnumTypeExtension_0", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), EnumValuesDefinition: create_EnumValuesDefinition(), Ignored: create_Ignored() });
const create_EnumTypeExtension_1 = (): EnumTypeExtension_1 => ({ type: "EnumTypeExtension_1", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Directives: create_Directives(), Ignored: create_Ignored() });
const create_InputObjectTypeDefinition = (): InputObjectTypeDefinition => ({ type: "InputObjectTypeDefinition", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_InputFieldsDefinition = (): InputFieldsDefinition => ({ type: "InputFieldsDefinition", Ignored: create_Ignored(), InputValueDefinition: [], Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_InputObjectTypeExtension = (): InputObjectTypeExtension => ({ type: "InputObjectTypeExtension", value: create_InputObjectTypeExtension_0() });
const create_InputObjectTypeExtension_0 = (): InputObjectTypeExtension_0 => ({ type: "InputObjectTypeExtension_0", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), InputFieldsDefinition: create_InputFieldsDefinition(), Ignored: create_Ignored() });
const create_InputObjectTypeExtension_1 = (): InputObjectTypeExtension_1 => ({ type: "InputObjectTypeExtension_1", Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Directives: create_Directives(), Ignored: create_Ignored() });
const create_DirectiveDefinition = (): DirectiveDefinition => ({ type: "DirectiveDefinition", Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored(), DirectiveLocations: create_DirectiveLocations(), Ignored: create_Ignored() });
const create_DirectiveLocations = (): DirectiveLocations => ({ type: "DirectiveLocations", value: create_DirectiveLocations_0() });
const create_DirectiveLocations_0 = (): DirectiveLocations_0 => ({ type: "DirectiveLocations_0", Ignored: create_Ignored(), DirectiveLocation: create_DirectiveLocation(), Ignored: create_Ignored() });
const create_DirectiveLocations_1 = (): DirectiveLocations_1 => ({ type: "DirectiveLocations_1", DirectiveLocations: create_DirectiveLocations(), Ignored: create_Ignored(), Ignored: create_Ignored(), DirectiveLocation: create_DirectiveLocation(), Ignored: create_Ignored() });
const create_DirectiveLocation = (): DirectiveLocation => ({ type: "DirectiveLocation", value: create_ExecutableDirectiveLocation() });
const create_ExecutableDirectiveLocation = (): ExecutableDirectiveLocation => ({ type: "ExecutableDirectiveLocation", value: "" });
const create_TypeSystemDirectiveLocation = (): TypeSystemDirectiveLocation => ({ type: "TypeSystemDirectiveLocation", value: "" });
const create_FieldsDefinition = (): FieldsDefinition => ({ type: "FieldsDefinition", Ignored: create_Ignored(), FieldDefinition: [], Ignored: create_Ignored() });
const create_FieldDefinition = (): FieldDefinition => ({ type: "FieldDefinition", Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored(), Type: create_Type(), Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_ArgumentsDefinition = (): ArgumentsDefinition => ({ type: "ArgumentsDefinition", Ignored: create_Ignored(), InputValueDefinition: [], Ignored: create_Ignored(), Ignored: create_Ignored() });
const create_InputValueDefinition = (): InputValueDefinition => ({ type: "InputValueDefinition", Ignored: create_Ignored(), Name: create_Name(), Ignored: create_Ignored(), Ignored: create_Ignored(), Type: create_Type(), Ignored: create_Ignored(), Ignored: create_Ignored(), Ignored: create_Ignored() });

const parse_Document = (Document: Document) => {
	debugName = "Document";
	parse_Ignored(Document.Ignored);
	parse_array_fn(parse_Definition, Document.Definition, create_Definition, 1);
	parse_Ignored(Document.Ignored);
};
const parse_SourceCharacter = (SourceCharacter: SourceCharacter) => {
	debugName = "SourceCharacter";
	SourceCharacter.value = parse_regex(reg`/\u0009|\u000A|\u000D|[\u0020-\uFFFF]/`, false, false, false);
};
const parse_Ignored = (Ignored: Ignored) => {
	debugName = "Ignored";
	Ignored.value = create_UnicodeBOM();
	if (try_parse_fn(parse_UnicodeBOM, Ignored.value)) return;
	Ignored.value = create_WhiteSpace();
	if (try_parse_fn(parse_WhiteSpace, Ignored.value)) return;
	Ignored.value = create_LineTerminator();
	if (try_parse_fn(parse_LineTerminator, Ignored.value)) return;
	Ignored.value = create_Comment();
	if (try_parse_fn(parse_Comment, Ignored.value)) return;
	Ignored.value = create_Comma();
	if (try_parse_fn(parse_Comma, Ignored.value)) return;
	fail_parse("Failed to parse Ignored");
};
const parse_UnicodeBOM = (UnicodeBOM: UnicodeBOM) => {
	debugName = "UnicodeBOM";
	UnicodeBOM.value = parse_regex(reg`/\uFEFF/`, false, false, false);
};
const parse_WhiteSpace = (WhiteSpace: WhiteSpace) => {
	debugName = "WhiteSpace";
	WhiteSpace.value = parse_regex(reg`/\u0009|\u0020/`, false, false, false);
};
const parse_LineTerminator = (LineTerminator: LineTerminator) => {
	debugName = "LineTerminator";
	LineTerminator.value = parse_regex(reg`/\u000A|\u000D|\u000D\u000A/`, false, false, false);
};
const parse_Comment = (Comment: Comment) => {
	debugName = "Comment";
	parse_regex(reg`/#/`, false, false, false);
	parse_array_fn(parse_CommentChar, Comment.CommentChar, create_CommentChar, 0);
};
const parse_CommentChar = (CommentChar: CommentChar) => {
	debugName = "CommentChar";
	if (try_parse_fn(parse_LineTerminator, create_LineTerminator())) throw new Error("Match should be failed: LineTerminator");
	parse_SourceCharacter(CommentChar.SourceCharacter);
};
const parse_Comma = (Comma: Comma) => {
	debugName = "Comma";
	Comma.value = parse_regex(reg`/,/`, false, false, false);
};
const parse_Token = (Token: Token) => {
	debugName = "Token";
	Token.value = create_Punctuator();
	if (try_parse_fn(parse_Punctuator, Token.value)) return;
	Token.value = create_Name();
	if (try_parse_fn(parse_Name, Token.value)) return;
	Token.value = create_IntValue();
	if (try_parse_fn(parse_IntValue, Token.value)) return;
	Token.value = create_FloatValue();
	if (try_parse_fn(parse_FloatValue, Token.value)) return;
	Token.value = create_StringValue();
	if (try_parse_fn(parse_StringValue, Token.value)) return;
	fail_parse("Failed to parse Token");
};
const parse_Punctuator = (Punctuator: Punctuator) => {
	debugName = "Punctuator";
	Punctuator.value = parse_regex(reg`/!|\$|\(|\)|\.\.\.|:|=|@|\[|\]|\{|\||\}/`, false, false, false);
};
const parse_Name = (Name: Name) => {
	debugName = "Name";
	Name.value = parse_regex(reg`/[_A-Za-z][_0-9A-Za-z]/`, false, false, false);
};
const parse_IntValue = (IntValue: IntValue) => {
	debugName = "IntValue";
	parse_IntegerPart(IntValue.IntegerPart);
};
const parse_IntegerPart = (IntegerPart: IntegerPart) => {
	debugName = "IntegerPart";
	IntegerPart.value = create_IntegerPart_0();
	if (try_parse_fn(parse_IntegerPart_0, IntegerPart.value)) return;
	IntegerPart.value = create_IntegerPart_1();
	if (try_parse_fn(parse_IntegerPart_1, IntegerPart.value)) return;
	fail_parse("Failed to parse IntegerPart");
};
const parse_IntegerPart_0 = (IntegerPart_0: IntegerPart_0) => {
	debugName = "IntegerPart_0";
	IntegerPart_0.NegativeSign = create_NegativeSign();
	if (!try_parse_fn(parse_NegativeSign, IntegerPart_0.NegativeSign)) IntegerPart_0.NegativeSign = undefined;
	parse_Ignored(IntegerPart_0.Ignored);
	parse_regex(reg`/0/`, false, false, false);
	parse_Ignored(IntegerPart_0.Ignored);
};
const parse_IntegerPart_1 = (IntegerPart_1: IntegerPart_1) => {
	debugName = "IntegerPart_1";
	IntegerPart_1.NegativeSign = create_NegativeSign();
	if (!try_parse_fn(parse_NegativeSign, IntegerPart_1.NegativeSign)) IntegerPart_1.NegativeSign = undefined;
	parse_Ignored(IntegerPart_1.Ignored);
	parse_NonZeroDigit(IntegerPart_1.NonZeroDigit);
	parse_Ignored(IntegerPart_1.Ignored);
	parse_array_fn(parse_Digit, IntegerPart_1.Digit, create_Digit, 0);
	parse_Ignored(IntegerPart_1.Ignored);
};
const parse_NegativeSign = (NegativeSign: NegativeSign) => {
	debugName = "NegativeSign";
	NegativeSign.value = parse_regex(reg`/\-/`, false, false, false);
};
const parse_Digit = (Digit: Digit) => {
	debugName = "Digit";
	Digit.value = parse_regex(reg`/[0-9]/`, false, false, false);
};
const parse_NonZeroDigit = (NonZeroDigit: NonZeroDigit) => {
	debugName = "NonZeroDigit";
	if (try_parse_fn(parse_regex, reg`/0/`, false, false, false)) throw new Error("Match should be failed: /0/");
	parse_Digit(NonZeroDigit.Digit);
};
const parse_FloatValue = (FloatValue: FloatValue) => {
	debugName = "FloatValue";
	FloatValue.value = create_FloatValue_0();
	if (try_parse_fn(parse_FloatValue_0, FloatValue.value)) return;
	FloatValue.value = create_FloatValue_1();
	if (try_parse_fn(parse_FloatValue_1, FloatValue.value)) return;
	FloatValue.value = create_FloatValue_2();
	if (try_parse_fn(parse_FloatValue_2, FloatValue.value)) return;
	fail_parse("Failed to parse FloatValue");
};
const parse_FloatValue_0 = (FloatValue_0: FloatValue_0) => {
	debugName = "FloatValue_0";
	parse_IntegerPart(FloatValue_0.IntegerPart);
	parse_FractionalPart(FloatValue_0.FractionalPart);
};
const parse_FloatValue_1 = (FloatValue_1: FloatValue_1) => {
	debugName = "FloatValue_1";
	parse_IntegerPart(FloatValue_1.IntegerPart);
	parse_ExponentPart(FloatValue_1.ExponentPart);
};
const parse_FloatValue_2 = (FloatValue_2: FloatValue_2) => {
	debugName = "FloatValue_2";
	parse_IntegerPart(FloatValue_2.IntegerPart);
	parse_FractionalPart(FloatValue_2.FractionalPart);
	parse_ExponentPart(FloatValue_2.ExponentPart);
};
const parse_FractionalPart = (FractionalPart: FractionalPart) => {
	debugName = "FractionalPart";
	parse_regex(reg`/\./`, false, false, false);
	parse_array_fn(parse_Digit, FractionalPart.Digit, create_Digit, 1);
};
const parse_ExponentPart = (ExponentPart: ExponentPart) => {
	debugName = "ExponentPart";
	parse_ExponentIndicator(ExponentPart.ExponentIndicator);
	ExponentPart.Sign = create_Sign();
	if (!try_parse_fn(parse_Sign, ExponentPart.Sign)) ExponentPart.Sign = undefined;
	parse_array_fn(parse_Digit, ExponentPart.Digit, create_Digit, 1);
};
const parse_ExponentIndicator = (ExponentIndicator: ExponentIndicator) => {
	debugName = "ExponentIndicator";
	ExponentIndicator.value = parse_regex(reg`/e|E/`, false, false, false);
};
const parse_Sign = (Sign: Sign) => {
	debugName = "Sign";
	Sign.value = parse_regex(reg`/\+|\-/`, false, false, false);
};
const parse_StringValue = (StringValue: StringValue) => {
	debugName = "StringValue";
	StringValue.value = create_StringValue_0();
	if (try_parse_fn(parse_StringValue_0, StringValue.value)) return;
	StringValue.value = create_StringValue_1();
	if (try_parse_fn(parse_StringValue_1, StringValue.value)) return;
	StringValue.value = create_StringValue_2();
	if (try_parse_fn(parse_StringValue_2, StringValue.value)) return;
	StringValue.value = create_StringValue_3();
	if (try_parse_fn(parse_StringValue_3, StringValue.value)) return;
	fail_parse("Failed to parse StringValue");
};
const parse_StringValue_0 = (StringValue_0: StringValue_0) => {
	debugName = "StringValue_0";
	StringValue_0.value = parse_regex(reg`/""""""/`, false, false, false);
};
const parse_StringValue_1 = (StringValue_1: StringValue_1) => {
	debugName = "StringValue_1";
	StringValue_1.value = parse_regex(reg`/""/`, false, false, false);
};
const parse_StringValue_2 = (StringValue_2: StringValue_2) => {
	debugName = "StringValue_2";
	parse_regex(reg`/"/`, false, false, false);
	parse_array_fn(parse_StringCharacter, StringValue_2.StringCharacter, create_StringCharacter, 0);
	parse_regex(reg`/"/`, false, false, false);
};
const parse_StringValue_3 = (StringValue_3: StringValue_3) => {
	debugName = "StringValue_3";
	parse_regex(reg`/"""/`, false, false, false);
	parse_array_fn(parse_BlockStringCharacter, StringValue_3.BlockStringCharacter, create_BlockStringCharacter, 0);
	parse_regex(reg`/"""/`, false, false, false);
};
const parse_StringCharacter = (StringCharacter: StringCharacter) => {
	debugName = "StringCharacter";
	StringCharacter.value = create_StringCharacter_0();
	if (try_parse_fn(parse_StringCharacter_0, StringCharacter.value)) return;
	StringCharacter.value = create_StringCharacter_1();
	if (try_parse_fn(parse_StringCharacter_1, StringCharacter.value)) return;
	StringCharacter.value = create_StringCharacter_2();
	if (try_parse_fn(parse_StringCharacter_2, StringCharacter.value)) return;
	StringCharacter.value = create_StringCharacter_3();
	if (try_parse_fn(parse_StringCharacter_3, StringCharacter.value)) return;
	StringCharacter.value = create_StringCharacter_4();
	if (try_parse_fn(parse_StringCharacter_4, StringCharacter.value)) return;
	fail_parse("Failed to parse StringCharacter");
};
const parse_StringCharacter_0 = (StringCharacter_0: StringCharacter_0) => {
	debugName = "StringCharacter_0";
	if (try_parse_fn(parse_regex, reg`/"/`, false, false, false)) throw new Error("Match should be failed: /\"/");
	parse_SourceCharacter(StringCharacter_0.SourceCharacter);
};
const parse_StringCharacter_1 = (StringCharacter_1: StringCharacter_1) => {
	debugName = "StringCharacter_1";
	if (try_parse_fn(parse_regex, reg`/\\/`, false, false, false)) throw new Error("Match should be failed: /\\/");
	parse_SourceCharacter(StringCharacter_1.SourceCharacter);
};
const parse_StringCharacter_2 = (StringCharacter_2: StringCharacter_2) => {
	debugName = "StringCharacter_2";
	if (try_parse_fn(parse_LineTerminator, create_LineTerminator())) throw new Error("Match should be failed: LineTerminator");
	parse_SourceCharacter(StringCharacter_2.SourceCharacter);
};
const parse_StringCharacter_3 = (StringCharacter_3: StringCharacter_3) => {
	debugName = "StringCharacter_3";
	parse_regex(reg`/\\u/`, false, false, false);
	parse_EscapedUnicode(StringCharacter_3.EscapedUnicode);
};
const parse_StringCharacter_4 = (StringCharacter_4: StringCharacter_4) => {
	debugName = "StringCharacter_4";
	parse_regex(reg`/\\/`, false, false, false);
	parse_EscapedCharacter(StringCharacter_4.EscapedCharacter);
};
const parse_EscapedUnicode = (EscapedUnicode: EscapedUnicode) => {
	debugName = "EscapedUnicode";
	EscapedUnicode.value = parse_regex(reg`/[\u0000-\uFFFF]/`, false, false, false);
};
const parse_EscapedCharacter = (EscapedCharacter: EscapedCharacter) => {
	debugName = "EscapedCharacter";
	EscapedCharacter.value = parse_regex(reg`/"|\\|\/|b|f|n|r|t/`, false, false, false);
};
const parse_BlockStringCharacter = (BlockStringCharacter: BlockStringCharacter) => {
	debugName = "BlockStringCharacter";
	BlockStringCharacter.value = create_BlockStringCharacter_0();
	if (try_parse_fn(parse_BlockStringCharacter_0, BlockStringCharacter.value)) return;
	BlockStringCharacter.value = create_BlockStringCharacter_1();
	if (try_parse_fn(parse_BlockStringCharacter_1, BlockStringCharacter.value)) return;
	BlockStringCharacter.value = create_BlockStringCharacter_2();
	if (try_parse_fn(parse_BlockStringCharacter_2, BlockStringCharacter.value)) return;
	fail_parse("Failed to parse BlockStringCharacter");
};
const parse_BlockStringCharacter_0 = (BlockStringCharacter_0: BlockStringCharacter_0) => {
	debugName = "BlockStringCharacter_0";
	if (try_parse_fn(parse_regex, reg`/"""/`, false, false, false)) throw new Error("Match should be failed: /\"""/");
	parse_SourceCharacter(BlockStringCharacter_0.SourceCharacter);
};
const parse_BlockStringCharacter_1 = (BlockStringCharacter_1: BlockStringCharacter_1) => {
	debugName = "BlockStringCharacter_1";
	if (try_parse_fn(parse_regex, reg`/\\"""/`, false, false, false)) throw new Error("Match should be failed: /\\\"""/");
	parse_SourceCharacter(BlockStringCharacter_1.SourceCharacter);
};
const parse_BlockStringCharacter_2 = (BlockStringCharacter_2: BlockStringCharacter_2) => {
	debugName = "BlockStringCharacter_2";
	BlockStringCharacter_2.value = parse_regex(reg`/\\"""/`, false, false, false);
};
const parse_Definition = (Definition: Definition) => {
	debugName = "Definition";
	Definition.value = create_ExecutableDefinition();
	if (try_parse_fn(parse_ExecutableDefinition, Definition.value)) return;
	Definition.value = create_TypeSystemDefinition();
	if (try_parse_fn(parse_TypeSystemDefinition, Definition.value)) return;
	Definition.value = create_TypeSystemExtension();
	if (try_parse_fn(parse_TypeSystemExtension, Definition.value)) return;
	fail_parse("Failed to parse Definition");
};
const parse_ExecutableDefinition = (ExecutableDefinition: ExecutableDefinition) => {
	debugName = "ExecutableDefinition";
	ExecutableDefinition.value = create_OperationDefinition();
	if (try_parse_fn(parse_OperationDefinition, ExecutableDefinition.value)) return;
	ExecutableDefinition.value = create_FragmentDefinition();
	if (try_parse_fn(parse_FragmentDefinition, ExecutableDefinition.value)) return;
	fail_parse("Failed to parse ExecutableDefinition");
};
const parse_OperationDefinition = (OperationDefinition: OperationDefinition) => {
	debugName = "OperationDefinition";
	OperationDefinition.value = create_OperationDefinition_0();
	if (try_parse_fn(parse_OperationDefinition_0, OperationDefinition.value)) return;
	OperationDefinition.value = create_OperationDefinition_1();
	if (try_parse_fn(parse_OperationDefinition_1, OperationDefinition.value)) return;
	fail_parse("Failed to parse OperationDefinition");
};
const parse_OperationDefinition_0 = (OperationDefinition_0: OperationDefinition_0) => {
	debugName = "OperationDefinition_0";
	parse_SelectionSet(OperationDefinition_0.SelectionSet);
	parse_Ignored(OperationDefinition_0.Ignored);
};
const parse_OperationDefinition_1 = (OperationDefinition_1: OperationDefinition_1) => {
	debugName = "OperationDefinition_1";
	parse_Ignored(OperationDefinition_1.Ignored);
	parse_OperationType(OperationDefinition_1.OperationType);
	parse_Ignored(OperationDefinition_1.Ignored);
	OperationDefinition_1.Name = create_Name();
	if (!try_parse_fn(parse_Name, OperationDefinition_1.Name)) OperationDefinition_1.Name = undefined;
	parse_Ignored(OperationDefinition_1.Ignored);
	OperationDefinition_1.VariableDefinitions = create_VariableDefinitions();
	if (!try_parse_fn(parse_VariableDefinitions, OperationDefinition_1.VariableDefinitions)) OperationDefinition_1.VariableDefinitions = undefined;
	parse_Ignored(OperationDefinition_1.Ignored);
	OperationDefinition_1.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, OperationDefinition_1.Directives)) OperationDefinition_1.Directives = undefined;
	parse_SelectionSet(OperationDefinition_1.SelectionSet);
	parse_Ignored(OperationDefinition_1.Ignored);
};
const parse_OperationType = (OperationType: OperationType) => {
	debugName = "OperationType";
	OperationType.value = parse_regex(reg`/query|mutation|subscription/`, false, false, false);
};
const parse_SelectionSet = (SelectionSet: SelectionSet) => {
	debugName = "SelectionSet";
	parse_regex(reg`/\{/`, false, false, false);
	parse_Ignored(SelectionSet.Ignored);
	parse_array_fn(parse_Selection, SelectionSet.Selection, create_Selection, 1);
	parse_Ignored(SelectionSet.Ignored);
	parse_regex(reg`/\}/`, false, false, false);
	parse_Ignored(SelectionSet.Ignored);
};
const parse_Selection = (Selection: Selection) => {
	debugName = "Selection";
	Selection.value = create_Selection_0();
	if (try_parse_fn(parse_Selection_0, Selection.value)) return;
	Selection.value = create_Selection_1();
	if (try_parse_fn(parse_Selection_1, Selection.value)) return;
	Selection.value = create_Selection_2();
	if (try_parse_fn(parse_Selection_2, Selection.value)) return;
	fail_parse("Failed to parse Selection");
};
const parse_Selection_0 = (Selection_0: Selection_0) => {
	debugName = "Selection_0";
	parse_Field(Selection_0.Field);
	parse_Ignored(Selection_0.Ignored);
};
const parse_Selection_1 = (Selection_1: Selection_1) => {
	debugName = "Selection_1";
	parse_FragmentSpread(Selection_1.FragmentSpread);
	parse_Ignored(Selection_1.Ignored);
};
const parse_Selection_2 = (Selection_2: Selection_2) => {
	debugName = "Selection_2";
	parse_InlineFragment(Selection_2.InlineFragment);
	parse_Ignored(Selection_2.Ignored);
};
const parse_Field = (Field: Field) => {
	debugName = "Field";
	Field.Alias = create_Alias();
	if (!try_parse_fn(parse_Alias, Field.Alias)) Field.Alias = undefined;
	parse_Ignored(Field.Ignored);
	parse_Name(Field.Name);
	parse_Ignored(Field.Ignored);
	Field.Arguments = create_Arguments();
	if (!try_parse_fn(parse_Arguments, Field.Arguments)) Field.Arguments = undefined;
	parse_Ignored(Field.Ignored);
	Field.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, Field.Directives)) Field.Directives = undefined;
	parse_Ignored(Field.Ignored);
	Field.SelectionSet = create_SelectionSet();
	if (!try_parse_fn(parse_SelectionSet, Field.SelectionSet)) Field.SelectionSet = undefined;
	parse_Ignored(Field.Ignored);
};
const parse_Alias = (Alias: Alias) => {
	debugName = "Alias";
	parse_Name(Alias.Name);
	parse_Ignored(Alias.Ignored);
	parse_regex(reg`/:/`, false, false, false);
	parse_Ignored(Alias.Ignored);
};
const parse_Arguments = (Arguments: Arguments) => {
	debugName = "Arguments";
	parse_regex(reg`/\(/`, false, false, false);
	parse_Ignored(Arguments.Ignored);
	parse_array_fn(parse_Argument, Arguments.Argument, create_Argument, 1);
	parse_Ignored(Arguments.Ignored);
	parse_regex(reg`/\)/`, false, false, false);
	parse_Ignored(Arguments.Ignored);
};
const parse_Argument = (Argument: Argument) => {
	debugName = "Argument";
	parse_Name(Argument.Name);
	parse_Ignored(Argument.Ignored);
	parse_regex(reg`/:/`, false, false, false);
	parse_Ignored(Argument.Ignored);
	parse_Value(Argument.Value);
	parse_Ignored(Argument.Ignored);
};
const parse_FragmentSpread = (FragmentSpread: FragmentSpread) => {
	debugName = "FragmentSpread";
	parse_regex(reg`/\.\.\./`, false, false, false);
	parse_Ignored(FragmentSpread.Ignored);
	parse_FragmentName(FragmentSpread.FragmentName);
	parse_Ignored(FragmentSpread.Ignored);
	FragmentSpread.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, FragmentSpread.Directives)) FragmentSpread.Directives = undefined;
	parse_Ignored(FragmentSpread.Ignored);
};
const parse_InlineFragment = (InlineFragment: InlineFragment) => {
	debugName = "InlineFragment";
	parse_regex(reg`/\.\.\./`, false, false, false);
	parse_Ignored(InlineFragment.Ignored);
	InlineFragment.TypeCondition = create_TypeCondition();
	if (!try_parse_fn(parse_TypeCondition, InlineFragment.TypeCondition)) InlineFragment.TypeCondition = undefined;
	parse_Ignored(InlineFragment.Ignored);
	InlineFragment.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, InlineFragment.Directives)) InlineFragment.Directives = undefined;
	parse_Ignored(InlineFragment.Ignored);
	parse_SelectionSet(InlineFragment.SelectionSet);
	parse_Ignored(InlineFragment.Ignored);
};
const parse_FragmentDefinition = (FragmentDefinition: FragmentDefinition) => {
	debugName = "FragmentDefinition";
	parse_regex(reg`/fragment/`, false, false, false);
	parse_Ignored(FragmentDefinition.Ignored);
	parse_FragmentName(FragmentDefinition.FragmentName);
	parse_Ignored(FragmentDefinition.Ignored);
	parse_TypeCondition(FragmentDefinition.TypeCondition);
	parse_Ignored(FragmentDefinition.Ignored);
	FragmentDefinition.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, FragmentDefinition.Directives)) FragmentDefinition.Directives = undefined;
	parse_Ignored(FragmentDefinition.Ignored);
	parse_SelectionSet(FragmentDefinition.SelectionSet);
	parse_Ignored(FragmentDefinition.Ignored);
};
const parse_FragmentName = (FragmentName: FragmentName) => {
	debugName = "FragmentName";
	if (try_parse_fn(parse_regex, reg`/on/`, false, false, false)) throw new Error("Match should be failed: /on/");
	parse_Name(FragmentName.Name);
};
const parse_TypeCondition = (TypeCondition: TypeCondition) => {
	debugName = "TypeCondition";
	parse_regex(reg`/on/`, false, false, false);
	parse_Ignored(TypeCondition.Ignored);
	parse_NamedType(TypeCondition.NamedType);
	parse_Ignored(TypeCondition.Ignored);
};
const parse_Value = (Value: Value) => {
	debugName = "Value";
	Value.value = create_Variable();
	if (try_parse_fn(parse_Variable, Value.value)) return;
	Value.value = create_IntValue();
	if (try_parse_fn(parse_IntValue, Value.value)) return;
	Value.value = create_FloatValue();
	if (try_parse_fn(parse_FloatValue, Value.value)) return;
	Value.value = create_StringValue();
	if (try_parse_fn(parse_StringValue, Value.value)) return;
	Value.value = create_BooleanValue();
	if (try_parse_fn(parse_BooleanValue, Value.value)) return;
	Value.value = create_NullValue();
	if (try_parse_fn(parse_NullValue, Value.value)) return;
	Value.value = create_EnumValue();
	if (try_parse_fn(parse_EnumValue, Value.value)) return;
	Value.value = create_ListValue();
	if (try_parse_fn(parse_ListValue, Value.value)) return;
	Value.value = create_ObjectValue();
	if (try_parse_fn(parse_ObjectValue, Value.value)) return;
	fail_parse("Failed to parse Value");
};
const parse_BooleanValue = (BooleanValue: BooleanValue) => {
	debugName = "BooleanValue";
	BooleanValue.value = parse_regex(reg`/true|false/`, false, false, false);
};
const parse_NullValue = (NullValue: NullValue) => {
	debugName = "NullValue";
	NullValue.value = parse_regex(reg`/null/`, false, false, false);
};
const parse_EnumValue = (EnumValue: EnumValue) => {
	debugName = "EnumValue";
	EnumValue.value = create_EnumValue_0();
	if (try_parse_fn(parse_EnumValue_0, EnumValue.value)) return;
	EnumValue.value = create_EnumValue_1();
	if (try_parse_fn(parse_EnumValue_1, EnumValue.value)) return;
	EnumValue.value = create_EnumValue_2();
	if (try_parse_fn(parse_EnumValue_2, EnumValue.value)) return;
	fail_parse("Failed to parse EnumValue");
};
const parse_EnumValue_0 = (EnumValue_0: EnumValue_0) => {
	debugName = "EnumValue_0";
	if (try_parse_fn(parse_regex, reg`/true/`, false, false, false)) throw new Error("Match should be failed: /true/");
	parse_Name(EnumValue_0.Name);
};
const parse_EnumValue_1 = (EnumValue_1: EnumValue_1) => {
	debugName = "EnumValue_1";
	if (try_parse_fn(parse_regex, reg`/false/`, false, false, false)) throw new Error("Match should be failed: /false/");
	parse_Name(EnumValue_1.Name);
};
const parse_EnumValue_2 = (EnumValue_2: EnumValue_2) => {
	debugName = "EnumValue_2";
	if (try_parse_fn(parse_regex, reg`/null/`, false, false, false)) throw new Error("Match should be failed: /null/");
	parse_Name(EnumValue_2.Name);
};
const parse_ListValue = (ListValue: ListValue) => {
	debugName = "ListValue";
	ListValue.value = create_ListValue_0();
	if (try_parse_fn(parse_ListValue_0, ListValue.value)) return;
	ListValue.value = create_ListValue_1();
	if (try_parse_fn(parse_ListValue_1, ListValue.value)) return;
	fail_parse("Failed to parse ListValue");
};
const parse_ListValue_0 = (ListValue_0: ListValue_0) => {
	debugName = "ListValue_0";
	ListValue_0.value = parse_regex(reg`/\[\]/`, false, false, false);
};
const parse_ListValue_1 = (ListValue_1: ListValue_1) => {
	debugName = "ListValue_1";
	parse_regex(reg`/\[/`, false, false, false);
	parse_array_fn(parse_Value, ListValue_1.Value, create_Value, 1);
	parse_regex(reg`/\]/`, false, false, false);
};
const parse_ObjectValue = (ObjectValue: ObjectValue) => {
	debugName = "ObjectValue";
	ObjectValue.value = create_ObjectValue_0();
	if (try_parse_fn(parse_ObjectValue_0, ObjectValue.value)) return;
	ObjectValue.value = create_ObjectValue_1();
	if (try_parse_fn(parse_ObjectValue_1, ObjectValue.value)) return;
	fail_parse("Failed to parse ObjectValue");
};
const parse_ObjectValue_0 = (ObjectValue_0: ObjectValue_0) => {
	debugName = "ObjectValue_0";
	ObjectValue_0.value = parse_regex(reg`/\{\}/`, false, false, false);
};
const parse_ObjectValue_1 = (ObjectValue_1: ObjectValue_1) => {
	debugName = "ObjectValue_1";
	parse_regex(reg`/\{/`, false, false, false);
	parse_array_fn(parse_ObjectField, ObjectValue_1.ObjectField, create_ObjectField, 1);
	parse_regex(reg`/\}/`, false, false, false);
};
const parse_ObjectField = (ObjectField: ObjectField) => {
	debugName = "ObjectField";
	parse_Ignored(ObjectField.Ignored);
	parse_Name(ObjectField.Name);
	parse_Ignored(ObjectField.Ignored);
	parse_regex(reg`/:/`, false, false, false);
	parse_Ignored(ObjectField.Ignored);
	parse_Value(ObjectField.Value);
	parse_Ignored(ObjectField.Ignored);
};
const parse_VariableDefinitions = (VariableDefinitions: VariableDefinitions) => {
	debugName = "VariableDefinitions";
	parse_regex(reg`/\(/`, false, false, false);
	parse_array_fn(parse_VariableDefinition, VariableDefinitions.VariableDefinition, create_VariableDefinition, 1);
	parse_regex(reg`/\)/`, false, false, false);
};
const parse_VariableDefinition = (VariableDefinition: VariableDefinition) => {
	debugName = "VariableDefinition";
	parse_Variable(VariableDefinition.Variable);
	parse_Ignored(VariableDefinition.Ignored);
	parse_regex(reg`/:/`, false, false, false);
	parse_Ignored(VariableDefinition.Ignored);
	parse_Type(VariableDefinition.Type);
	parse_Ignored(VariableDefinition.Ignored);
	VariableDefinition.DefaultValue = create_DefaultValue();
	if (!try_parse_fn(parse_DefaultValue, VariableDefinition.DefaultValue)) VariableDefinition.DefaultValue = undefined;
	parse_Ignored(VariableDefinition.Ignored);
};
const parse_Variable = (Variable: Variable) => {
	debugName = "Variable";
	parse_regex(reg`/\$/`, false, false, false);
	parse_Name(Variable.Name);
};
const parse_DefaultValue = (DefaultValue: DefaultValue) => {
	debugName = "DefaultValue";
	parse_regex(reg`/=/`, false, false, false);
	parse_Ignored(DefaultValue.Ignored);
	parse_Value(DefaultValue.Value);
};
const parse_Type = (Type: Type) => {
	debugName = "Type";
	Type.value = create_NamedType();
	if (try_parse_fn(parse_NamedType, Type.value)) return;
	Type.value = create_ListType();
	if (try_parse_fn(parse_ListType, Type.value)) return;
	Type.value = create_NonNullType();
	if (try_parse_fn(parse_NonNullType, Type.value)) return;
	fail_parse("Failed to parse Type");
};
const parse_NamedType = (NamedType: NamedType) => {
	debugName = "NamedType";
	parse_Name(NamedType.Name);
};
const parse_ListType = (ListType: ListType) => {
	debugName = "ListType";
	parse_regex(reg`/\[/`, false, false, false);
	parse_Type(ListType.Type);
	parse_regex(reg`/\]/`, false, false, false);
};
const parse_NonNullType = (NonNullType: NonNullType) => {
	debugName = "NonNullType";
	NonNullType.value = create_NonNullType_0();
	if (try_parse_fn(parse_NonNullType_0, NonNullType.value)) return;
	NonNullType.value = create_NonNullType_1();
	if (try_parse_fn(parse_NonNullType_1, NonNullType.value)) return;
	fail_parse("Failed to parse NonNullType");
};
const parse_NonNullType_0 = (NonNullType_0: NonNullType_0) => {
	debugName = "NonNullType_0";
	parse_NamedType(NonNullType_0.NamedType);
	parse_regex(reg`/!/`, false, false, false);
};
const parse_NonNullType_1 = (NonNullType_1: NonNullType_1) => {
	debugName = "NonNullType_1";
	parse_ListType(NonNullType_1.ListType);
	parse_regex(reg`/!/`, false, false, false);
};
const parse_Directives = (Directives: Directives) => {
	debugName = "Directives";
	parse_array_fn(parse_Directive, Directives.Directive, create_Directive, 1);
};
const parse_Directive = (Directive: Directive) => {
	debugName = "Directive";
	parse_regex(reg`/@/`, false, false, false);
	parse_Ignored(Directive.Ignored);
	parse_Name(Directive.Name);
	parse_Ignored(Directive.Ignored);
	Directive.Arguments = create_Arguments();
	if (!try_parse_fn(parse_Arguments, Directive.Arguments)) Directive.Arguments = undefined;
	parse_Ignored(Directive.Ignored);
};
const parse_TypeSystemDefinition = (TypeSystemDefinition: TypeSystemDefinition) => {
	debugName = "TypeSystemDefinition";
	TypeSystemDefinition.value = create_SchemaDefinition();
	if (try_parse_fn(parse_SchemaDefinition, TypeSystemDefinition.value)) return;
	TypeSystemDefinition.value = create_TypeDefinition();
	if (try_parse_fn(parse_TypeDefinition, TypeSystemDefinition.value)) return;
	TypeSystemDefinition.value = create_DirectiveDefinition();
	if (try_parse_fn(parse_DirectiveDefinition, TypeSystemDefinition.value)) return;
	fail_parse("Failed to parse TypeSystemDefinition");
};
const parse_TypeSystemExtension = (TypeSystemExtension: TypeSystemExtension) => {
	debugName = "TypeSystemExtension";
	TypeSystemExtension.value = create_SchemaExtension();
	if (try_parse_fn(parse_SchemaExtension, TypeSystemExtension.value)) return;
	TypeSystemExtension.value = create_TypeExtension();
	if (try_parse_fn(parse_TypeExtension, TypeSystemExtension.value)) return;
	fail_parse("Failed to parse TypeSystemExtension");
};
const parse_SchemaDefinition = (SchemaDefinition: SchemaDefinition) => {
	debugName = "SchemaDefinition";
	parse_regex(reg`/schema/`, false, false, false);
	parse_Ignored(SchemaDefinition.Ignored);
	SchemaDefinition.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, SchemaDefinition.Directives)) SchemaDefinition.Directives = undefined;
	parse_Ignored(SchemaDefinition.Ignored);
	parse_regex(reg`/\{/`, false, false, false);
	parse_Ignored(SchemaDefinition.Ignored);
	parse_array_fn(parse_OperationTypeDefinition, SchemaDefinition.OperationTypeDefinition, create_OperationTypeDefinition, 1);
	parse_Ignored(SchemaDefinition.Ignored);
	parse_regex(reg`/\}/`, false, false, false);
	parse_Ignored(SchemaDefinition.Ignored);
};
const parse_SchemaExtension = (SchemaExtension: SchemaExtension) => {
	debugName = "SchemaExtension";
	SchemaExtension.value = create_SchemaExtension_0();
	if (try_parse_fn(parse_SchemaExtension_0, SchemaExtension.value)) return;
	SchemaExtension.value = create_SchemaExtension_1();
	if (try_parse_fn(parse_SchemaExtension_1, SchemaExtension.value)) return;
	fail_parse("Failed to parse SchemaExtension");
};
const parse_SchemaExtension_0 = (SchemaExtension_0: SchemaExtension_0) => {
	debugName = "SchemaExtension_0";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(SchemaExtension_0.Ignored);
	parse_regex(reg`/schema/`, false, false, false);
	SchemaExtension_0.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, SchemaExtension_0.Directives)) SchemaExtension_0.Directives = undefined;
	parse_Ignored(SchemaExtension_0.Ignored);
	parse_regex(reg`/\{/`, false, false, false);
	parse_Ignored(SchemaExtension_0.Ignored);
	parse_array_fn(parse_OperationTypeDefinition, SchemaExtension_0.OperationTypeDefinition, create_OperationTypeDefinition, 1);
	parse_Ignored(SchemaExtension_0.Ignored);
	parse_regex(reg`/\}/`, false, false, false);
	parse_Ignored(SchemaExtension_0.Ignored);
};
const parse_SchemaExtension_1 = (SchemaExtension_1: SchemaExtension_1) => {
	debugName = "SchemaExtension_1";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(SchemaExtension_1.Ignored);
	parse_regex(reg`/schema/`, false, false, false);
	parse_Directives(SchemaExtension_1.Directives);
	parse_Ignored(SchemaExtension_1.Ignored);
};
const parse_OperationTypeDefinition = (OperationTypeDefinition: OperationTypeDefinition) => {
	debugName = "OperationTypeDefinition";
	parse_OperationType(OperationTypeDefinition.OperationType);
	parse_Ignored(OperationTypeDefinition.Ignored);
	parse_regex(reg`/:/`, false, false, false);
	parse_Ignored(OperationTypeDefinition.Ignored);
	parse_NamedType(OperationTypeDefinition.NamedType);
	parse_Ignored(OperationTypeDefinition.Ignored);
};
const parse_Description = (Description: Description) => {
	debugName = "Description";
	parse_StringValue(Description.StringValue);
};
const parse_TypeDefinition = (TypeDefinition: TypeDefinition) => {
	debugName = "TypeDefinition";
	TypeDefinition.value = create_ScalarTypeDefinition();
	if (try_parse_fn(parse_ScalarTypeDefinition, TypeDefinition.value)) return;
	TypeDefinition.value = create_ObjectTypeDefinition();
	if (try_parse_fn(parse_ObjectTypeDefinition, TypeDefinition.value)) return;
	TypeDefinition.value = create_InterfaceTypeDefinition();
	if (try_parse_fn(parse_InterfaceTypeDefinition, TypeDefinition.value)) return;
	TypeDefinition.value = create_UnionTypeDefinition();
	if (try_parse_fn(parse_UnionTypeDefinition, TypeDefinition.value)) return;
	TypeDefinition.value = create_EnumTypeDefinition();
	if (try_parse_fn(parse_EnumTypeDefinition, TypeDefinition.value)) return;
	TypeDefinition.value = create_InputObjectTypeDefinition();
	if (try_parse_fn(parse_InputObjectTypeDefinition, TypeDefinition.value)) return;
	fail_parse("Failed to parse TypeDefinition");
};
const parse_TypeExtension = (TypeExtension: TypeExtension) => {
	debugName = "TypeExtension";
	TypeExtension.value = create_ScalarTypeExtension();
	if (try_parse_fn(parse_ScalarTypeExtension, TypeExtension.value)) return;
	TypeExtension.value = create_ObjectTypeExtension();
	if (try_parse_fn(parse_ObjectTypeExtension, TypeExtension.value)) return;
	TypeExtension.value = create_InterfaceTypeExtension();
	if (try_parse_fn(parse_InterfaceTypeExtension, TypeExtension.value)) return;
	TypeExtension.value = create_UnionTypeExtension();
	if (try_parse_fn(parse_UnionTypeExtension, TypeExtension.value)) return;
	TypeExtension.value = create_EnumTypeExtension();
	if (try_parse_fn(parse_EnumTypeExtension, TypeExtension.value)) return;
	TypeExtension.value = create_InputObjectTypeExtension();
	if (try_parse_fn(parse_InputObjectTypeExtension, TypeExtension.value)) return;
	fail_parse("Failed to parse TypeExtension");
};
const parse_ScalarTypeDefinition = (ScalarTypeDefinition: ScalarTypeDefinition) => {
	debugName = "ScalarTypeDefinition";
	ScalarTypeDefinition.Description = create_Description();
	if (!try_parse_fn(parse_Description, ScalarTypeDefinition.Description)) ScalarTypeDefinition.Description = undefined;
	parse_Ignored(ScalarTypeDefinition.Ignored);
	parse_regex(reg`/scalar/`, false, false, false);
	parse_Ignored(ScalarTypeDefinition.Ignored);
	parse_Name(ScalarTypeDefinition.Name);
	parse_Ignored(ScalarTypeDefinition.Ignored);
	ScalarTypeDefinition.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, ScalarTypeDefinition.Directives)) ScalarTypeDefinition.Directives = undefined;
	parse_Ignored(ScalarTypeDefinition.Ignored);
};
const parse_ScalarTypeExtension = (ScalarTypeExtension: ScalarTypeExtension) => {
	debugName = "ScalarTypeExtension";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(ScalarTypeExtension.Ignored);
	parse_regex(reg`/scalar/`, false, false, false);
	parse_Ignored(ScalarTypeExtension.Ignored);
	parse_Name(ScalarTypeExtension.Name);
	parse_Ignored(ScalarTypeExtension.Ignored);
	parse_Directives(ScalarTypeExtension.Directives);
	parse_Ignored(ScalarTypeExtension.Ignored);
};
const parse_ObjectTypeDefinition = (ObjectTypeDefinition: ObjectTypeDefinition) => {
	debugName = "ObjectTypeDefinition";
	ObjectTypeDefinition.Description = create_Description();
	if (!try_parse_fn(parse_Description, ObjectTypeDefinition.Description)) ObjectTypeDefinition.Description = undefined;
	parse_Ignored(ObjectTypeDefinition.Ignored);
	parse_regex(reg`/type/`, false, false, false);
	parse_Ignored(ObjectTypeDefinition.Ignored);
	parse_Name(ObjectTypeDefinition.Name);
	parse_Ignored(ObjectTypeDefinition.Ignored);
	ObjectTypeDefinition.ImplementsInterfaces = create_ImplementsInterfaces();
	if (!try_parse_fn(parse_ImplementsInterfaces, ObjectTypeDefinition.ImplementsInterfaces)) ObjectTypeDefinition.ImplementsInterfaces = undefined;
	parse_Ignored(ObjectTypeDefinition.Ignored);
	ObjectTypeDefinition.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, ObjectTypeDefinition.Directives)) ObjectTypeDefinition.Directives = undefined;
	parse_Ignored(ObjectTypeDefinition.Ignored);
	ObjectTypeDefinition.FieldsDefinition = create_FieldsDefinition();
	if (!try_parse_fn(parse_FieldsDefinition, ObjectTypeDefinition.FieldsDefinition)) ObjectTypeDefinition.FieldsDefinition = undefined;
	parse_Ignored(ObjectTypeDefinition.Ignored);
};
const parse_ObjectTypeExtension = (ObjectTypeExtension: ObjectTypeExtension) => {
	debugName = "ObjectTypeExtension";
	ObjectTypeExtension.value = create_ObjectTypeExtension_0();
	if (try_parse_fn(parse_ObjectTypeExtension_0, ObjectTypeExtension.value)) return;
	ObjectTypeExtension.value = create_ObjectTypeExtension_1();
	if (try_parse_fn(parse_ObjectTypeExtension_1, ObjectTypeExtension.value)) return;
	ObjectTypeExtension.value = create_ObjectTypeExtension_2();
	if (try_parse_fn(parse_ObjectTypeExtension_2, ObjectTypeExtension.value)) return;
	fail_parse("Failed to parse ObjectTypeExtension");
};
const parse_ObjectTypeExtension_0 = (ObjectTypeExtension_0: ObjectTypeExtension_0) => {
	debugName = "ObjectTypeExtension_0";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(ObjectTypeExtension_0.Ignored);
	parse_regex(reg`/type/`, false, false, false);
	parse_Ignored(ObjectTypeExtension_0.Ignored);
	parse_Name(ObjectTypeExtension_0.Name);
	parse_Ignored(ObjectTypeExtension_0.Ignored);
	ObjectTypeExtension_0.ImplementsInterfaces = create_ImplementsInterfaces();
	if (!try_parse_fn(parse_ImplementsInterfaces, ObjectTypeExtension_0.ImplementsInterfaces)) ObjectTypeExtension_0.ImplementsInterfaces = undefined;
	parse_Ignored(ObjectTypeExtension_0.Ignored);
	ObjectTypeExtension_0.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, ObjectTypeExtension_0.Directives)) ObjectTypeExtension_0.Directives = undefined;
	parse_Ignored(ObjectTypeExtension_0.Ignored);
	parse_FieldsDefinition(ObjectTypeExtension_0.FieldsDefinition);
	parse_Ignored(ObjectTypeExtension_0.Ignored);
};
const parse_ObjectTypeExtension_1 = (ObjectTypeExtension_1: ObjectTypeExtension_1) => {
	debugName = "ObjectTypeExtension_1";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(ObjectTypeExtension_1.Ignored);
	parse_regex(reg`/type/`, false, false, false);
	parse_Ignored(ObjectTypeExtension_1.Ignored);
	parse_Name(ObjectTypeExtension_1.Name);
	parse_Ignored(ObjectTypeExtension_1.Ignored);
	ObjectTypeExtension_1.ImplementsInterfaces = create_ImplementsInterfaces();
	if (!try_parse_fn(parse_ImplementsInterfaces, ObjectTypeExtension_1.ImplementsInterfaces)) ObjectTypeExtension_1.ImplementsInterfaces = undefined;
	parse_Ignored(ObjectTypeExtension_1.Ignored);
	parse_Directives(ObjectTypeExtension_1.Directives);
	parse_Ignored(ObjectTypeExtension_1.Ignored);
};
const parse_ObjectTypeExtension_2 = (ObjectTypeExtension_2: ObjectTypeExtension_2) => {
	debugName = "ObjectTypeExtension_2";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(ObjectTypeExtension_2.Ignored);
	parse_regex(reg`/type/`, false, false, false);
	parse_Ignored(ObjectTypeExtension_2.Ignored);
	parse_Name(ObjectTypeExtension_2.Name);
	parse_Ignored(ObjectTypeExtension_2.Ignored);
	parse_ImplementsInterfaces(ObjectTypeExtension_2.ImplementsInterfaces);
	parse_Ignored(ObjectTypeExtension_2.Ignored);
};
const parse_ImplementsInterfaces = (ImplementsInterfaces: ImplementsInterfaces) => {
	debugName = "ImplementsInterfaces";
	ImplementsInterfaces.value = create_ImplementsInterfaces_0();
	if (try_parse_fn(parse_ImplementsInterfaces_0, ImplementsInterfaces.value)) return;
	ImplementsInterfaces.value = create_ImplementsInterfaces_1();
	if (try_parse_fn(parse_ImplementsInterfaces_1, ImplementsInterfaces.value)) return;
	fail_parse("Failed to parse ImplementsInterfaces");
};
const parse_ImplementsInterfaces_0 = (ImplementsInterfaces_0: ImplementsInterfaces_0) => {
	debugName = "ImplementsInterfaces_0";
	parse_regex(reg`/implements/`, false, false, false);
	parse_Ignored(ImplementsInterfaces_0.Ignored);
	parse_regex(reg`/(&)?/`, false, false, false);
	parse_Ignored(ImplementsInterfaces_0.Ignored);
	parse_NamedType(ImplementsInterfaces_0.NamedType);
	parse_Ignored(ImplementsInterfaces_0.Ignored);
};
const parse_ImplementsInterfaces_1 = (ImplementsInterfaces_1: ImplementsInterfaces_1) => {
	debugName = "ImplementsInterfaces_1";
	parse_ImplementsInterfaces(ImplementsInterfaces_1.ImplementsInterfaces);
	parse_Ignored(ImplementsInterfaces_1.Ignored);
	parse_regex(reg`/&/`, false, false, false);
	parse_Ignored(ImplementsInterfaces_1.Ignored);
	parse_NamedType(ImplementsInterfaces_1.NamedType);
	parse_Ignored(ImplementsInterfaces_1.Ignored);
};
const parse_InterfaceTypeDefinition = (InterfaceTypeDefinition: InterfaceTypeDefinition) => {
	debugName = "InterfaceTypeDefinition";
	InterfaceTypeDefinition.Description = create_Description();
	if (!try_parse_fn(parse_Description, InterfaceTypeDefinition.Description)) InterfaceTypeDefinition.Description = undefined;
	parse_Ignored(InterfaceTypeDefinition.Ignored);
	parse_regex(reg`/interface/`, false, false, false);
	parse_Ignored(InterfaceTypeDefinition.Ignored);
	parse_Name(InterfaceTypeDefinition.Name);
	parse_Ignored(InterfaceTypeDefinition.Ignored);
	InterfaceTypeDefinition.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, InterfaceTypeDefinition.Directives)) InterfaceTypeDefinition.Directives = undefined;
	parse_Ignored(InterfaceTypeDefinition.Ignored);
	InterfaceTypeDefinition.FieldsDefinition = create_FieldsDefinition();
	if (!try_parse_fn(parse_FieldsDefinition, InterfaceTypeDefinition.FieldsDefinition)) InterfaceTypeDefinition.FieldsDefinition = undefined;
	parse_Ignored(InterfaceTypeDefinition.Ignored);
};
const parse_InterfaceTypeExtension = (InterfaceTypeExtension: InterfaceTypeExtension) => {
	debugName = "InterfaceTypeExtension";
	InterfaceTypeExtension.value = create_InterfaceTypeExtension_0();
	if (try_parse_fn(parse_InterfaceTypeExtension_0, InterfaceTypeExtension.value)) return;
	InterfaceTypeExtension.value = create_InterfaceTypeExtension_1();
	if (try_parse_fn(parse_InterfaceTypeExtension_1, InterfaceTypeExtension.value)) return;
	fail_parse("Failed to parse InterfaceTypeExtension");
};
const parse_InterfaceTypeExtension_0 = (InterfaceTypeExtension_0: InterfaceTypeExtension_0) => {
	debugName = "InterfaceTypeExtension_0";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(InterfaceTypeExtension_0.Ignored);
	parse_regex(reg`/interface/`, false, false, false);
	parse_Ignored(InterfaceTypeExtension_0.Ignored);
	parse_Name(InterfaceTypeExtension_0.Name);
	parse_Ignored(InterfaceTypeExtension_0.Ignored);
	InterfaceTypeExtension_0.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, InterfaceTypeExtension_0.Directives)) InterfaceTypeExtension_0.Directives = undefined;
	parse_Ignored(InterfaceTypeExtension_0.Ignored);
	parse_FieldsDefinition(InterfaceTypeExtension_0.FieldsDefinition);
	parse_Ignored(InterfaceTypeExtension_0.Ignored);
};
const parse_InterfaceTypeExtension_1 = (InterfaceTypeExtension_1: InterfaceTypeExtension_1) => {
	debugName = "InterfaceTypeExtension_1";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(InterfaceTypeExtension_1.Ignored);
	parse_regex(reg`/interface/`, false, false, false);
	parse_Ignored(InterfaceTypeExtension_1.Ignored);
	parse_Name(InterfaceTypeExtension_1.Name);
	parse_Ignored(InterfaceTypeExtension_1.Ignored);
	parse_Directives(InterfaceTypeExtension_1.Directives);
	parse_Ignored(InterfaceTypeExtension_1.Ignored);
};
const parse_UnionTypeDefinition = (UnionTypeDefinition: UnionTypeDefinition) => {
	debugName = "UnionTypeDefinition";
	UnionTypeDefinition.Description = create_Description();
	if (!try_parse_fn(parse_Description, UnionTypeDefinition.Description)) UnionTypeDefinition.Description = undefined;
	parse_Ignored(UnionTypeDefinition.Ignored);
	parse_regex(reg`/union/`, false, false, false);
	parse_Ignored(UnionTypeDefinition.Ignored);
	parse_Name(UnionTypeDefinition.Name);
	parse_Ignored(UnionTypeDefinition.Ignored);
	UnionTypeDefinition.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, UnionTypeDefinition.Directives)) UnionTypeDefinition.Directives = undefined;
	parse_Ignored(UnionTypeDefinition.Ignored);
	UnionTypeDefinition.UnionMemberTypes = create_UnionMemberTypes();
	if (!try_parse_fn(parse_UnionMemberTypes, UnionTypeDefinition.UnionMemberTypes)) UnionTypeDefinition.UnionMemberTypes = undefined;
	parse_Ignored(UnionTypeDefinition.Ignored);
};
const parse_UnionMemberTypes = (UnionMemberTypes: UnionMemberTypes) => {
	debugName = "UnionMemberTypes";
	UnionMemberTypes.value = create_UnionMemberTypes_0();
	if (try_parse_fn(parse_UnionMemberTypes_0, UnionMemberTypes.value)) return;
	UnionMemberTypes.value = create_UnionMemberTypes_1();
	if (try_parse_fn(parse_UnionMemberTypes_1, UnionMemberTypes.value)) return;
	fail_parse("Failed to parse UnionMemberTypes");
};
const parse_UnionMemberTypes_0 = (UnionMemberTypes_0: UnionMemberTypes_0) => {
	debugName = "UnionMemberTypes_0";
	parse_regex(reg`/=/`, false, false, false);
	parse_Ignored(UnionMemberTypes_0.Ignored);
	parse_regex(reg`/(\|)?/`, false, false, false);
	parse_Ignored(UnionMemberTypes_0.Ignored);
	parse_NamedType(UnionMemberTypes_0.NamedType);
	parse_Ignored(UnionMemberTypes_0.Ignored);
};
const parse_UnionMemberTypes_1 = (UnionMemberTypes_1: UnionMemberTypes_1) => {
	debugName = "UnionMemberTypes_1";
	parse_UnionMemberTypes(UnionMemberTypes_1.UnionMemberTypes);
	parse_Ignored(UnionMemberTypes_1.Ignored);
	parse_regex(reg`/\|/`, false, false, false);
	parse_Ignored(UnionMemberTypes_1.Ignored);
	parse_NamedType(UnionMemberTypes_1.NamedType);
	parse_Ignored(UnionMemberTypes_1.Ignored);
};
const parse_UnionTypeExtension = (UnionTypeExtension: UnionTypeExtension) => {
	debugName = "UnionTypeExtension";
	UnionTypeExtension.value = create_UnionTypeExtension_0();
	if (try_parse_fn(parse_UnionTypeExtension_0, UnionTypeExtension.value)) return;
	UnionTypeExtension.value = create_UnionTypeExtension_1();
	if (try_parse_fn(parse_UnionTypeExtension_1, UnionTypeExtension.value)) return;
	fail_parse("Failed to parse UnionTypeExtension");
};
const parse_UnionTypeExtension_0 = (UnionTypeExtension_0: UnionTypeExtension_0) => {
	debugName = "UnionTypeExtension_0";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(UnionTypeExtension_0.Ignored);
	parse_regex(reg`/union/`, false, false, false);
	parse_Ignored(UnionTypeExtension_0.Ignored);
	parse_Name(UnionTypeExtension_0.Name);
	parse_Ignored(UnionTypeExtension_0.Ignored);
	UnionTypeExtension_0.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, UnionTypeExtension_0.Directives)) UnionTypeExtension_0.Directives = undefined;
	parse_Ignored(UnionTypeExtension_0.Ignored);
	UnionTypeExtension_0.UnionMemberTypes = create_UnionMemberTypes();
	if (!try_parse_fn(parse_UnionMemberTypes, UnionTypeExtension_0.UnionMemberTypes)) UnionTypeExtension_0.UnionMemberTypes = undefined;
	parse_Ignored(UnionTypeExtension_0.Ignored);
};
const parse_UnionTypeExtension_1 = (UnionTypeExtension_1: UnionTypeExtension_1) => {
	debugName = "UnionTypeExtension_1";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(UnionTypeExtension_1.Ignored);
	parse_regex(reg`/union/`, false, false, false);
	parse_Ignored(UnionTypeExtension_1.Ignored);
	parse_Name(UnionTypeExtension_1.Name);
	parse_Ignored(UnionTypeExtension_1.Ignored);
	parse_Directives(UnionTypeExtension_1.Directives);
	parse_Ignored(UnionTypeExtension_1.Ignored);
};
const parse_EnumTypeDefinition = (EnumTypeDefinition: EnumTypeDefinition) => {
	debugName = "EnumTypeDefinition";
	EnumTypeDefinition.Description = create_Description();
	if (!try_parse_fn(parse_Description, EnumTypeDefinition.Description)) EnumTypeDefinition.Description = undefined;
	parse_Ignored(EnumTypeDefinition.Ignored);
	parse_regex(reg`/enum/`, false, false, false);
	parse_Ignored(EnumTypeDefinition.Ignored);
	parse_Name(EnumTypeDefinition.Name);
	parse_Ignored(EnumTypeDefinition.Ignored);
	EnumTypeDefinition.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, EnumTypeDefinition.Directives)) EnumTypeDefinition.Directives = undefined;
	parse_Ignored(EnumTypeDefinition.Ignored);
	EnumTypeDefinition.EnumValuesDefinition = create_EnumValuesDefinition();
	if (!try_parse_fn(parse_EnumValuesDefinition, EnumTypeDefinition.EnumValuesDefinition)) EnumTypeDefinition.EnumValuesDefinition = undefined;
	parse_Ignored(EnumTypeDefinition.Ignored);
};
const parse_EnumValuesDefinition = (EnumValuesDefinition: EnumValuesDefinition) => {
	debugName = "EnumValuesDefinition";
	parse_regex(reg`/\{/`, false, false, false);
	parse_Ignored(EnumValuesDefinition.Ignored);
	parse_array_fn(parse_EnumValueDefinition, EnumValuesDefinition.EnumValueDefinition, create_EnumValueDefinition, 1);
	parse_Ignored(EnumValuesDefinition.Ignored);
	parse_regex(reg`/\}/`, false, false, false);
	parse_Ignored(EnumValuesDefinition.Ignored);
};
const parse_EnumValueDefinition = (EnumValueDefinition: EnumValueDefinition) => {
	debugName = "EnumValueDefinition";
	EnumValueDefinition.Description = create_Description();
	if (!try_parse_fn(parse_Description, EnumValueDefinition.Description)) EnumValueDefinition.Description = undefined;
	parse_Ignored(EnumValueDefinition.Ignored);
	parse_EnumValue(EnumValueDefinition.EnumValue);
	parse_Ignored(EnumValueDefinition.Ignored);
	EnumValueDefinition.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, EnumValueDefinition.Directives)) EnumValueDefinition.Directives = undefined;
	parse_Ignored(EnumValueDefinition.Ignored);
};
const parse_EnumTypeExtension = (EnumTypeExtension: EnumTypeExtension) => {
	debugName = "EnumTypeExtension";
	EnumTypeExtension.value = create_EnumTypeExtension_0();
	if (try_parse_fn(parse_EnumTypeExtension_0, EnumTypeExtension.value)) return;
	EnumTypeExtension.value = create_EnumTypeExtension_1();
	if (try_parse_fn(parse_EnumTypeExtension_1, EnumTypeExtension.value)) return;
	fail_parse("Failed to parse EnumTypeExtension");
};
const parse_EnumTypeExtension_0 = (EnumTypeExtension_0: EnumTypeExtension_0) => {
	debugName = "EnumTypeExtension_0";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(EnumTypeExtension_0.Ignored);
	parse_regex(reg`/enum/`, false, false, false);
	parse_Ignored(EnumTypeExtension_0.Ignored);
	parse_Name(EnumTypeExtension_0.Name);
	parse_Ignored(EnumTypeExtension_0.Ignored);
	EnumTypeExtension_0.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, EnumTypeExtension_0.Directives)) EnumTypeExtension_0.Directives = undefined;
	parse_Ignored(EnumTypeExtension_0.Ignored);
	parse_EnumValuesDefinition(EnumTypeExtension_0.EnumValuesDefinition);
	parse_Ignored(EnumTypeExtension_0.Ignored);
};
const parse_EnumTypeExtension_1 = (EnumTypeExtension_1: EnumTypeExtension_1) => {
	debugName = "EnumTypeExtension_1";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(EnumTypeExtension_1.Ignored);
	parse_regex(reg`/enum/`, false, false, false);
	parse_Ignored(EnumTypeExtension_1.Ignored);
	parse_Name(EnumTypeExtension_1.Name);
	parse_Ignored(EnumTypeExtension_1.Ignored);
	parse_Directives(EnumTypeExtension_1.Directives);
	parse_Ignored(EnumTypeExtension_1.Ignored);
};
const parse_InputObjectTypeDefinition = (InputObjectTypeDefinition: InputObjectTypeDefinition) => {
	debugName = "InputObjectTypeDefinition";
	InputObjectTypeDefinition.Description = create_Description();
	if (!try_parse_fn(parse_Description, InputObjectTypeDefinition.Description)) InputObjectTypeDefinition.Description = undefined;
	parse_Ignored(InputObjectTypeDefinition.Ignored);
	parse_regex(reg`/input/`, false, false, false);
	parse_Ignored(InputObjectTypeDefinition.Ignored);
	parse_Name(InputObjectTypeDefinition.Name);
	parse_Ignored(InputObjectTypeDefinition.Ignored);
	InputObjectTypeDefinition.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, InputObjectTypeDefinition.Directives)) InputObjectTypeDefinition.Directives = undefined;
	parse_Ignored(InputObjectTypeDefinition.Ignored);
	InputObjectTypeDefinition.InputFieldsDefinition = create_InputFieldsDefinition();
	if (!try_parse_fn(parse_InputFieldsDefinition, InputObjectTypeDefinition.InputFieldsDefinition)) InputObjectTypeDefinition.InputFieldsDefinition = undefined;
	parse_Ignored(InputObjectTypeDefinition.Ignored);
};
const parse_InputFieldsDefinition = (InputFieldsDefinition: InputFieldsDefinition) => {
	debugName = "InputFieldsDefinition";
	parse_regex(reg`/\{/`, false, false, false);
	parse_Ignored(InputFieldsDefinition.Ignored);
	parse_array_fn(parse_InputValueDefinition, InputFieldsDefinition.InputValueDefinition, create_InputValueDefinition, 1);
	parse_Ignored(InputFieldsDefinition.Ignored);
	parse_regex(reg`/\}/`, false, false, false);
	parse_Ignored(InputFieldsDefinition.Ignored);
};
const parse_InputObjectTypeExtension = (InputObjectTypeExtension: InputObjectTypeExtension) => {
	debugName = "InputObjectTypeExtension";
	InputObjectTypeExtension.value = create_InputObjectTypeExtension_0();
	if (try_parse_fn(parse_InputObjectTypeExtension_0, InputObjectTypeExtension.value)) return;
	InputObjectTypeExtension.value = create_InputObjectTypeExtension_1();
	if (try_parse_fn(parse_InputObjectTypeExtension_1, InputObjectTypeExtension.value)) return;
	fail_parse("Failed to parse InputObjectTypeExtension");
};
const parse_InputObjectTypeExtension_0 = (InputObjectTypeExtension_0: InputObjectTypeExtension_0) => {
	debugName = "InputObjectTypeExtension_0";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(InputObjectTypeExtension_0.Ignored);
	parse_regex(reg`/input/`, false, false, false);
	parse_Ignored(InputObjectTypeExtension_0.Ignored);
	parse_Name(InputObjectTypeExtension_0.Name);
	parse_Ignored(InputObjectTypeExtension_0.Ignored);
	InputObjectTypeExtension_0.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, InputObjectTypeExtension_0.Directives)) InputObjectTypeExtension_0.Directives = undefined;
	parse_Ignored(InputObjectTypeExtension_0.Ignored);
	parse_InputFieldsDefinition(InputObjectTypeExtension_0.InputFieldsDefinition);
	parse_Ignored(InputObjectTypeExtension_0.Ignored);
};
const parse_InputObjectTypeExtension_1 = (InputObjectTypeExtension_1: InputObjectTypeExtension_1) => {
	debugName = "InputObjectTypeExtension_1";
	parse_regex(reg`/extend/`, false, false, false);
	parse_Ignored(InputObjectTypeExtension_1.Ignored);
	parse_regex(reg`/input/`, false, false, false);
	parse_Ignored(InputObjectTypeExtension_1.Ignored);
	parse_Name(InputObjectTypeExtension_1.Name);
	parse_Ignored(InputObjectTypeExtension_1.Ignored);
	parse_Directives(InputObjectTypeExtension_1.Directives);
	parse_Ignored(InputObjectTypeExtension_1.Ignored);
};
const parse_DirectiveDefinition = (DirectiveDefinition: DirectiveDefinition) => {
	debugName = "DirectiveDefinition";
	DirectiveDefinition.Description = create_Description();
	if (!try_parse_fn(parse_Description, DirectiveDefinition.Description)) DirectiveDefinition.Description = undefined;
	parse_Ignored(DirectiveDefinition.Ignored);
	parse_regex(reg`/directive/`, false, false, false);
	parse_Ignored(DirectiveDefinition.Ignored);
	parse_regex(reg`/@/`, false, false, false);
	parse_Ignored(DirectiveDefinition.Ignored);
	parse_Name(DirectiveDefinition.Name);
	parse_Ignored(DirectiveDefinition.Ignored);
	DirectiveDefinition.ArgumentsDefinition = create_ArgumentsDefinition();
	if (!try_parse_fn(parse_ArgumentsDefinition, DirectiveDefinition.ArgumentsDefinition)) DirectiveDefinition.ArgumentsDefinition = undefined;
	parse_Ignored(DirectiveDefinition.Ignored);
	parse_regex(reg`/on/`, false, false, false);
	parse_Ignored(DirectiveDefinition.Ignored);
	parse_DirectiveLocations(DirectiveDefinition.DirectiveLocations);
	parse_Ignored(DirectiveDefinition.Ignored);
};
const parse_DirectiveLocations = (DirectiveLocations: DirectiveLocations) => {
	debugName = "DirectiveLocations";
	DirectiveLocations.value = create_DirectiveLocations_0();
	if (try_parse_fn(parse_DirectiveLocations_0, DirectiveLocations.value)) return;
	DirectiveLocations.value = create_DirectiveLocations_1();
	if (try_parse_fn(parse_DirectiveLocations_1, DirectiveLocations.value)) return;
	fail_parse("Failed to parse DirectiveLocations");
};
const parse_DirectiveLocations_0 = (DirectiveLocations_0: DirectiveLocations_0) => {
	debugName = "DirectiveLocations_0";
	parse_regex(reg`/(\|)?/`, false, false, false);
	parse_Ignored(DirectiveLocations_0.Ignored);
	parse_DirectiveLocation(DirectiveLocations_0.DirectiveLocation);
	parse_Ignored(DirectiveLocations_0.Ignored);
};
const parse_DirectiveLocations_1 = (DirectiveLocations_1: DirectiveLocations_1) => {
	debugName = "DirectiveLocations_1";
	parse_DirectiveLocations(DirectiveLocations_1.DirectiveLocations);
	parse_Ignored(DirectiveLocations_1.Ignored);
	parse_regex(reg`/\|/`, false, false, false);
	parse_Ignored(DirectiveLocations_1.Ignored);
	parse_DirectiveLocation(DirectiveLocations_1.DirectiveLocation);
	parse_Ignored(DirectiveLocations_1.Ignored);
};
const parse_DirectiveLocation = (DirectiveLocation: DirectiveLocation) => {
	debugName = "DirectiveLocation";
	DirectiveLocation.value = create_ExecutableDirectiveLocation();
	if (try_parse_fn(parse_ExecutableDirectiveLocation, DirectiveLocation.value)) return;
	DirectiveLocation.value = create_TypeSystemDirectiveLocation();
	if (try_parse_fn(parse_TypeSystemDirectiveLocation, DirectiveLocation.value)) return;
	fail_parse("Failed to parse DirectiveLocation");
};
const parse_ExecutableDirectiveLocation = (ExecutableDirectiveLocation: ExecutableDirectiveLocation) => {
	debugName = "ExecutableDirectiveLocation";
	ExecutableDirectiveLocation.value = parse_regex(reg`/QUERY|MUTATION|SUBSCRIPTION|FIELD|FRAGMENT_DEFINITION|FRAGMENT_SPREAD|INLINE_FRAGMENT/`, false, false, false);
};
const parse_TypeSystemDirectiveLocation = (TypeSystemDirectiveLocation: TypeSystemDirectiveLocation) => {
	debugName = "TypeSystemDirectiveLocation";
	TypeSystemDirectiveLocation.value = parse_regex(reg`/SCHEMA|SCALAR|OBJECT|FIELD_DEFINITION|ARGUMENT_DEFINITION|INTERFACE|UNION|ENUM|ENUM_VALUE|INPUT_OBJECT|INPUT_FIELD_DEFINITION/`, false, false, false);
};
const parse_FieldsDefinition = (FieldsDefinition: FieldsDefinition) => {
	debugName = "FieldsDefinition";
	parse_regex(reg`/\{/`, false, false, false);
	parse_Ignored(FieldsDefinition.Ignored);
	parse_array_fn(parse_FieldDefinition, FieldsDefinition.FieldDefinition, create_FieldDefinition, 1);
	parse_Ignored(FieldsDefinition.Ignored);
	parse_regex(reg`/\}/`, false, false, false);
};
const parse_FieldDefinition = (FieldDefinition: FieldDefinition) => {
	debugName = "FieldDefinition";
	FieldDefinition.Description = create_Description();
	if (!try_parse_fn(parse_Description, FieldDefinition.Description)) FieldDefinition.Description = undefined;
	parse_Ignored(FieldDefinition.Ignored);
	parse_Name(FieldDefinition.Name);
	parse_Ignored(FieldDefinition.Ignored);
	FieldDefinition.ArgumentsDefinition = create_ArgumentsDefinition();
	if (!try_parse_fn(parse_ArgumentsDefinition, FieldDefinition.ArgumentsDefinition)) FieldDefinition.ArgumentsDefinition = undefined;
	parse_Ignored(FieldDefinition.Ignored);
	parse_regex(reg`/:/`, false, false, false);
	parse_Ignored(FieldDefinition.Ignored);
	parse_Type(FieldDefinition.Type);
	parse_Ignored(FieldDefinition.Ignored);
	FieldDefinition.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, FieldDefinition.Directives)) FieldDefinition.Directives = undefined;
	parse_Ignored(FieldDefinition.Ignored);
};
const parse_ArgumentsDefinition = (ArgumentsDefinition: ArgumentsDefinition) => {
	debugName = "ArgumentsDefinition";
	parse_regex(reg`/\(/`, false, false, false);
	parse_Ignored(ArgumentsDefinition.Ignored);
	parse_array_fn(parse_InputValueDefinition, ArgumentsDefinition.InputValueDefinition, create_InputValueDefinition, 1);
	parse_Ignored(ArgumentsDefinition.Ignored);
	parse_regex(reg`/\)/`, false, false, false);
	parse_Ignored(ArgumentsDefinition.Ignored);
};
const parse_InputValueDefinition = (InputValueDefinition: InputValueDefinition) => {
	debugName = "InputValueDefinition";
	InputValueDefinition.Description = create_Description();
	if (!try_parse_fn(parse_Description, InputValueDefinition.Description)) InputValueDefinition.Description = undefined;
	parse_Ignored(InputValueDefinition.Ignored);
	parse_Name(InputValueDefinition.Name);
	parse_Ignored(InputValueDefinition.Ignored);
	parse_regex(reg`/:/`, false, false, false);
	parse_Ignored(InputValueDefinition.Ignored);
	parse_Type(InputValueDefinition.Type);
	parse_Ignored(InputValueDefinition.Ignored);
	InputValueDefinition.DefaultValue = create_DefaultValue();
	if (!try_parse_fn(parse_DefaultValue, InputValueDefinition.DefaultValue)) InputValueDefinition.DefaultValue = undefined;
	parse_Ignored(InputValueDefinition.Ignored);
	InputValueDefinition.Directives = create_Directives();
	if (!try_parse_fn(parse_Directives, InputValueDefinition.Directives)) InputValueDefinition.Directives = undefined;
	parse_Ignored(InputValueDefinition.Ignored);
};

export const parse = (textToParse: string, filePath = "", onFail?: (result: Document) => void) => {
	path = filePath;
	text = textToParse;
	index = 0;
	const result = create_Document();
	successValues.length = 0;
	failedValues.length = 0;
	try {
		parse_Document(result);
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
