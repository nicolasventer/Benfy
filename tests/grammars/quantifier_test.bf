# Quantifier test grammar - tests all rule quantifier types (*, +, ?, {n}, {n,m}, {n,})
quantifier_expr: quantifier_test+
quantifier_test: zero_or_more | one_or_more | zero_or_one | exactly_n | range_n_m | range_n_inf | new_line

# Zero or more (*)
zero_or_more: /zero_or_more: / item*
item: /[a-z]/

# One or more (+)
one_or_more: /one_or_more: / item+

# Zero or one (?)
zero_or_one: /zero_or_one: / optional?
optional: /optional/

# Exactly n ({n})
exactly_n: /exactly_n: / digit{3}
digit: /\d/

# Range n to m ({n,m})
range_n_m: /range_n_m: / letter{2,4}
letter: /[a-z]/

# Range n to infinity ({n,})
range_n_inf: /range_n_inf: / letter{2,}

# New line
new_line: /\r?\n/
