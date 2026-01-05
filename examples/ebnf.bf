grammar: line*
line: production | comment
production: identifier /=|::=/ expression /;?/
identifier: /[a-zA-Z][a-zA-Z0-9_]*|<[a-zA-Z][a-zA-Z0-9_]*>/
expression: term_list >> expression_join
term_list: term >> /,?/
term: factor quantifier?
factor: identifier_no_assignment | terminal | comment | regex_ | hex | character_class | group
identifier_no_assignment: /(\b[a-zA-Z][a-zA-Z0-9_]*\b(?!>)|<[a-zA-Z][a-zA-Z0-9_]*>)(?!\s*(::=|=))/
terminal: /('[^']*')|("[^"]*")/
group: /\(/ expression /\)/
regex_: /\/(\\\/|[^\/])*\//
hex: /#x[0-9A-F]+/
character_class: /\[/ character_range+ /\]/
character_range: /[a-zA-Z0-9]-[a-zA-Z0-9]|#x[0-9A-F]+-[#x0-9A-F]+|[^-\]]|\\-/
quantifier: /\+(?!\+)|\*(?!\*)|\?/
expression_join: /[|-]|\+\+|\*\*/
comment: /\/\*[\s\S]*?\*\//
