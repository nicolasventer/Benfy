grammar: line*
line: rule | comment | new_line
rule: rule_name /: / rule_expr rule_comment? /\r?\n/
rule_name: /[a-z][a-z_]*/
rule_expr: first_rule_regex | first_rule_name
first_rule_regex: rule_regex space_rule_term*
first_rule_name: rule_name rest_rule_name
rest_rule_name: rule_name_with_or | rule_name_as_item | rule_name_as_term
rule_name_with_or: space_rule_name+
rule_name_as_item: rule_first_item_optional / >> / rule_join
rule_first_item_optional: /\??/
rule_join: rule_name | rule_regex
rule_name_as_term: rule_quantifier? space_rule_term*
space_rule_name: / \| / rule_name
space_rule_term: / / rule_term
rule_term: rule_name_quantified | rule_regex
rule_name_quantified: rule_name rule_quantifier?
rule_quantifier: rule_basic_quantifier | rule_brace_quantifier
rule_regex: /\/(\\\/|[^\/])*\//
rule_basic_quantifier: /[+*?]/
rule_brace_quantifier: /\{/ rule_brace_min rule_brace_max? /\}/
rule_brace_min: /\d+/
rule_brace_max: /,/ rule_brace_max_value?
rule_brace_max_value: /\d+/
rule_comment: / #.*/
comment: /#.*\r?\n/
new_line: /\r?\n/
