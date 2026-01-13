##
GraphQL-Grammar-EBNF-Definition-June-2018-Edition.ebnf

author:     karminski <code.karminski@outlook.com>
license:    MIT <https://opensource.org/licenses/MIT>

This GraphQL EBNF file arranged by GraphQL Specifition June 2018.
http://spec.graphql.org/June2018/

For grammar summary please see:
https://spec.graphql.org/June2018/#sec-Appendix-Grammar-Summary


This EBNF file use W3C EBNF definition:
https://www.w3.org/TR/xml/#sec-notation

Why we should not use ISO-14977 ebnf:
https://dwheeler.com/essays/dont-use-iso-14977-ebnf.html

For generate Railroad Diagram please see:
https://bottlecaps.de/rr/ui 

list      -> +
opt       -> ?
list, opt -> *
##
# Document Expression
Document: Ignored Definition+ Ignored
# SourceCharacter Expression
SourceCharacter: /\u0009|\u000A|\u000D|[\u0020-\uFFFF]/
# Ignored Tokens Expression
Ignored: UnicodeBOM | WhiteSpace | LineTerminator | Comment | Comma
UnicodeBOM: /\uFEFF/
# Byte Order Mark (U+FEFF)
WhiteSpace: /\u0009|\u0020/
# ASCII: \t | Space, Horizontal Tab (U+0009), Space (U+0020)
LineTerminator: /\u000A|\u000D|\u000D\u000A/
# ASCII: \n | \r\n | \r, New Line (U+000A) | Carriage Return (U+000D) [Lookahead != New Line (U+000A)] | Carriage Return (U+000D)New Line (U+000A)
Comment: /#/ CommentChar*
CommentChar: !LineTerminator SourceCharacter
Comma: /,/
# Lexical Tokens Expression
Token: Punctuator | Name | IntValue | FloatValue | StringValue
Punctuator: /!|\$|\(|\)|\.\.\.|:|=|@|\[|\]|\{|\||\}/
Name: /[_A-Za-z][_0-9A-Za-z]/
IntValue: IntegerPart
IntegerPart: IntegerPart_0 | IntegerPart_1
IntegerPart_0: NegativeSign? Ignored /0/ Ignored
IntegerPart_1: NegativeSign? Ignored NonZeroDigit Ignored Digit* Ignored
# "[\+\-0-9]+"
NegativeSign: /\-/
Digit: /[0-9]/
NonZeroDigit: !/0/ Digit
FloatValue: FloatValue_0 | FloatValue_1 | FloatValue_2
FloatValue_0: IntegerPart FractionalPart
FloatValue_1: IntegerPart ExponentPart
FloatValue_2: IntegerPart FractionalPart ExponentPart
# "[\+\-0-9]+\.[0-9]"
FractionalPart: /\./ Digit+
ExponentPart: ExponentIndicator Sign? Digit+
ExponentIndicator: /e|E/
Sign: /\+|\-/
StringValue: StringValue_0 | StringValue_1 | StringValue_2 | StringValue_3
StringValue_0: /""""""/
StringValue_1: /""/
StringValue_2: /"/ StringCharacter* /"/
StringValue_3: /"""/ BlockStringCharacter* /"""/
StringCharacter: StringCharacter_0 | StringCharacter_1 | StringCharacter_2 | StringCharacter_3 | StringCharacter_4
StringCharacter_0: !/"/ SourceCharacter
StringCharacter_1: !/\\/ SourceCharacter
StringCharacter_2: !LineTerminator SourceCharacter
StringCharacter_3: /\\u/ EscapedUnicode
StringCharacter_4: /\\/ EscapedCharacter
# SourceCharacter but not " or \ or LineTerminator | \uEscapedUnicode | \EscapedCharacter
EscapedUnicode: /[\u0000-\uFFFF]/
EscapedCharacter: /"|\\|\/|b|f|n|r|t/
BlockStringCharacter: BlockStringCharacter_0 | BlockStringCharacter_1 | BlockStringCharacter_2
BlockStringCharacter_0: !/"""/ SourceCharacter
BlockStringCharacter_1: !/\\"""/ SourceCharacter
BlockStringCharacter_2: /\\"""/
# Definition Expression
Definition: ExecutableDefinition | TypeSystemDefinition | TypeSystemExtension
ExecutableDefinition: OperationDefinition | FragmentDefinition
# OperationDefinition Expression
OperationDefinition: OperationDefinition_0 | OperationDefinition_1
OperationDefinition_0: SelectionSet Ignored
OperationDefinition_1: Ignored OperationType Ignored Name? Ignored VariableDefinitions? Ignored Directives? SelectionSet Ignored
OperationType: /query|mutation|subscription/
# SelectionSet Expression
SelectionSet: /\{/ Ignored Selection+ Ignored /\}/ Ignored
Selection: Selection_0 | Selection_1 | Selection_2
Selection_0: Field Ignored
Selection_1: FragmentSpread Ignored
Selection_2: InlineFragment Ignored
# Field Expression
Field: Alias? Ignored Name Ignored Arguments? Ignored Directives? Ignored SelectionSet? Ignored
# Alias Expression
Alias: Name Ignored /:/ Ignored
# Arguments Expression
Arguments: /\(/ Ignored Argument+ Ignored /\)/ Ignored
Argument: Name Ignored /:/ Ignored Value Ignored
# FragmentSpread Expression
FragmentSpread: /\.\.\./ Ignored FragmentName Ignored Directives? Ignored
InlineFragment: /\.\.\./ Ignored TypeCondition? Ignored Directives? Ignored SelectionSet Ignored
FragmentDefinition: /fragment/ Ignored FragmentName Ignored TypeCondition Ignored Directives? Ignored SelectionSet Ignored
FragmentName: !/on/ Name
TypeCondition: /on/ Ignored NamedType Ignored
# Value Expression
Value: Variable | IntValue | FloatValue | StringValue | BooleanValue | NullValue | EnumValue | ListValue | ObjectValue
BooleanValue: /true|false/
NullValue: /null/
EnumValue: EnumValue_0 | EnumValue_1 | EnumValue_2
EnumValue_0: !/true/ Name
EnumValue_1: !/false/ Name
EnumValue_2: !/null/ Name
# Name but not "true" or "false" or "null", "(?!(true|false|null))[_A-Za-z][_0-9A-Za-z]*"
ListValue: ListValue_0 | ListValue_1
ListValue_0: /\[\]/
ListValue_1: /\[/ Value+ /\]/
ObjectValue: ObjectValue_0 | ObjectValue_1
ObjectValue_0: /\{\}/
ObjectValue_1: /\{/ ObjectField+ /\}/
ObjectField: Ignored Name Ignored /:/ Ignored Value Ignored
# VariableDefinitions Expression
VariableDefinitions: /\(/ VariableDefinition+ /\)/
VariableDefinition: Variable Ignored /:/ Ignored Type Ignored DefaultValue? Ignored
Variable: /\$/ Name
DefaultValue: /=/ Ignored Value
# Type Expression
Type: NamedType | ListType | NonNullType
NamedType: Name
ListType: /\[/ Type /\]/
NonNullType: NonNullType_0 | NonNullType_1
NonNullType_0: NamedType /!/
NonNullType_1: ListType /!/
# Directives Expression
Directives: Directive+
Directive: /@/ Ignored Name Ignored Arguments? Ignored
# TypeSystemDefinition Expression
TypeSystemDefinition: SchemaDefinition | TypeDefinition | DirectiveDefinition
TypeSystemExtension: SchemaExtension | TypeExtension
# SchemaDefinition Expression
SchemaDefinition: /schema/ Ignored Directives? Ignored /\{/ Ignored OperationTypeDefinition+ Ignored /\}/ Ignored
SchemaExtension: SchemaExtension_0 | SchemaExtension_1
SchemaExtension_0: /extend/ Ignored /schema/ Directives? Ignored /\{/ Ignored OperationTypeDefinition+ Ignored /\}/ Ignored
SchemaExtension_1: /extend/ Ignored /schema/ Directives Ignored
# OperationTypeDefinition Expression
OperationTypeDefinition: OperationType Ignored /:/ Ignored NamedType Ignored
# Description Expression
Description: StringValue
# TypeDefinition Expression
TypeDefinition: ScalarTypeDefinition | ObjectTypeDefinition | InterfaceTypeDefinition | UnionTypeDefinition | EnumTypeDefinition | InputObjectTypeDefinition
TypeExtension: ScalarTypeExtension | ObjectTypeExtension | InterfaceTypeExtension | UnionTypeExtension | EnumTypeExtension | InputObjectTypeExtension
ScalarTypeDefinition: Description? Ignored /scalar/ Ignored Name Ignored Directives? Ignored
ScalarTypeExtension: /extend/ Ignored /scalar/ Ignored Name Ignored Directives Ignored
ObjectTypeDefinition: Description? Ignored /type/ Ignored Name Ignored ImplementsInterfaces? Ignored Directives? Ignored FieldsDefinition? Ignored
ObjectTypeExtension: ObjectTypeExtension_0 | ObjectTypeExtension_1 | ObjectTypeExtension_2
ObjectTypeExtension_0: /extend/ Ignored /type/ Ignored Name Ignored ImplementsInterfaces? Ignored Directives? Ignored FieldsDefinition Ignored
ObjectTypeExtension_1: /extend/ Ignored /type/ Ignored Name Ignored ImplementsInterfaces? Ignored Directives Ignored
ObjectTypeExtension_2: /extend/ Ignored /type/ Ignored Name Ignored ImplementsInterfaces Ignored
ImplementsInterfaces: ImplementsInterfaces_0 | ImplementsInterfaces_1
ImplementsInterfaces_0: /implements/ Ignored /(&)?/ Ignored NamedType Ignored
ImplementsInterfaces_1: ImplementsInterfaces Ignored /&/ Ignored NamedType Ignored
InterfaceTypeDefinition: Description? Ignored /interface/ Ignored Name Ignored Directives? Ignored FieldsDefinition? Ignored
InterfaceTypeExtension: InterfaceTypeExtension_0 | InterfaceTypeExtension_1
InterfaceTypeExtension_0: /extend/ Ignored /interface/ Ignored Name Ignored Directives? Ignored FieldsDefinition Ignored
InterfaceTypeExtension_1: /extend/ Ignored /interface/ Ignored Name Ignored Directives Ignored
UnionTypeDefinition: Description? Ignored /union/ Ignored Name Ignored Directives? Ignored UnionMemberTypes? Ignored
UnionMemberTypes: UnionMemberTypes_0 | UnionMemberTypes_1
UnionMemberTypes_0: /=/ Ignored /(\|)?/ Ignored NamedType Ignored
UnionMemberTypes_1: UnionMemberTypes Ignored /\|/ Ignored NamedType Ignored
UnionTypeExtension: UnionTypeExtension_0 | UnionTypeExtension_1
UnionTypeExtension_0: /extend/ Ignored /union/ Ignored Name Ignored Directives? Ignored UnionMemberTypes? Ignored
UnionTypeExtension_1: /extend/ Ignored /union/ Ignored Name Ignored Directives Ignored
EnumTypeDefinition: Description? Ignored /enum/ Ignored Name Ignored Directives? Ignored EnumValuesDefinition? Ignored
EnumValuesDefinition: /\{/ Ignored EnumValueDefinition+ Ignored /\}/ Ignored
EnumValueDefinition: Description? Ignored EnumValue Ignored Directives? Ignored
EnumTypeExtension: EnumTypeExtension_0 | EnumTypeExtension_1
EnumTypeExtension_0: /extend/ Ignored /enum/ Ignored Name Ignored Directives? Ignored EnumValuesDefinition Ignored
EnumTypeExtension_1: /extend/ Ignored /enum/ Ignored Name Ignored Directives Ignored
InputObjectTypeDefinition: Description? Ignored /input/ Ignored Name Ignored Directives? Ignored InputFieldsDefinition? Ignored
InputFieldsDefinition: /\{/ Ignored InputValueDefinition+ Ignored /\}/ Ignored
InputObjectTypeExtension: InputObjectTypeExtension_0 | InputObjectTypeExtension_1
InputObjectTypeExtension_0: /extend/ Ignored /input/ Ignored Name Ignored Directives? Ignored InputFieldsDefinition Ignored
InputObjectTypeExtension_1: /extend/ Ignored /input/ Ignored Name Ignored Directives Ignored
# DirectiveDefinition Expression
DirectiveDefinition: Description? Ignored /directive/ Ignored /@/ Ignored Name Ignored ArgumentsDefinition? Ignored /on/ Ignored DirectiveLocations Ignored
DirectiveLocations: DirectiveLocations_0 | DirectiveLocations_1
DirectiveLocations_0: /(\|)?/ Ignored DirectiveLocation Ignored
DirectiveLocations_1: DirectiveLocations Ignored /\|/ Ignored DirectiveLocation Ignored
DirectiveLocation: ExecutableDirectiveLocation | TypeSystemDirectiveLocation
ExecutableDirectiveLocation: /QUERY|MUTATION|SUBSCRIPTION|FIELD|FRAGMENT_DEFINITION|FRAGMENT_SPREAD|INLINE_FRAGMENT/
TypeSystemDirectiveLocation: /SCHEMA|SCALAR|OBJECT|FIELD_DEFINITION|ARGUMENT_DEFINITION|INTERFACE|UNION|ENUM|ENUM_VALUE|INPUT_OBJECT|INPUT_FIELD_DEFINITION/
# FieldsDefinition Expression
FieldsDefinition: /\{/ Ignored FieldDefinition+ Ignored /\}/
FieldDefinition: Description? Ignored Name Ignored ArgumentsDefinition? Ignored /:/ Ignored Type Ignored Directives? Ignored
# ArgumentsDefinition Expression
ArgumentsDefinition: /\(/ Ignored InputValueDefinition+ Ignored /\)/ Ignored
InputValueDefinition: Description? Ignored Name Ignored /:/ Ignored Type Ignored DefaultValue? Ignored Directives? Ignored
