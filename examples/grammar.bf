grammar: line*
line: spacing_policy | rule | multiline_comment | singleline_comment | new_line
spacing_policy: spacing_policy_value inline_comment* /\r?\n/
spacing_policy_value: /"strict"|"loose"/
rule: rule_name /: / rule_expr inline_comment* /\r?\n/
rule_name: /[a-zA-Z][a-zA-Z0-9_]*/
rule_expr: first_rule_negation | first_rule_regex | first_rule_name
first_rule_negation: /!/ rule_name_or_regex space_rule_term*
first_rule_regex: rule_regex space_rule_term*
first_rule_name: rule_name rest_rule_name
rest_rule_name: rule_name_with_or | rule_name_as_item | rule_name_as_term
rule_name_with_or: space_rule_name+
rule_name_as_item: rule_item_optional? / >> / rule_name_or_regex
rule_item_optional: /\?/
rule_name_or_regex: rule_name | rule_regex
rule_name_as_term: rule_quantifier? space_rule_term*
space_rule_name: / \| / rule_name
space_rule_term: / / rule_term
rule_term: rule_term_negative | rule_term_positive
rule_term_negative: /!/ rule_name_or_regex
rule_term_positive: rule_name_quantified | rule_regex
rule_name_quantified: rule_name rule_quantifier?
rule_quantifier: rule_basic_quantifier | rule_brace_quantifier
rule_regex: rule_regex_content rule_regex_flags
rule_regex_content: /\/(\\.|[^\/])*\//
rule_regex_flags: /[slmi]*/
rule_basic_quantifier: /[+*?]/
rule_brace_quantifier: /\{/ rule_brace_min rule_brace_max? /\}/
rule_brace_min: /\d+/
rule_brace_max: /,/ rule_brace_max_value?
rule_brace_max_value: /\d+/
inline_comment: inline_multiline_comment | inline_singleline_comment
inline_singleline_comment: / #.*/
singleline_comment: /#.*\r?\n/
multiline_comment: /##([^#]|#[^#])*##/
inline_multiline_comment: / ##([^#]|#[^#])*##/
new_line: /\r?\n/
