"loose"

# Simple arithmetic grammar for tests
expr: term >> op
term: number_ | paren_expr
number_: /\d+(\.\d+)?/
paren_expr: /\(/ expr /\)/
op: /[+\-*\/]/
