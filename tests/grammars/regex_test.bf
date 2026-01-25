# Regex test grammar - tests literal, digit, quantifiers, and flags (i, m)
regex_expr: pattern_item+
pattern_item: literal | digit | number_ | ignore_case | multiline | no_ignore_case | no_multiline | new_line

# Simple patterns
literal: /literal: [a-zA-Z]/
digit: /digit: \d/

# Quantifiers
number_: /number_: \d+(\.\d*)?/

# Flags (ignore case and multiline)
ignore_case: /ignore_case: [a-z]/i
multiline: /multiline: [a-z]$/m

# No flags
no_ignore_case: /no_ignore_case: [a-z]/
no_multiline: /no_multiline: [a-z]$/

# New line
new_line: /\r?\n/
