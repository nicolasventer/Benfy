json: /\s*/ json_content /\s*/
json_content: null_ | boolean_ | string_ | number_ | array_ | object_
null_: /null/
boolean_: /true|false/
string_: /"(\\"|[^"])*"/
number_: /(0|[1-9][0-9]*)(.[0-9]+)?(e[+-]?[0-9]+)?/
array_: /\[/ array_content /\]/
array_content: json? >> /,/
object_: /\{/ object_content /}/
object_content: object_kv? >> /,/
object_kv: /\s*/ string_ /\s*:/ json
