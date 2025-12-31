- syntax:
	- uppercase (auto-fix)
	- multiple spaces (auto-fix)
	- space in rule name (auto-fix)
	- regex modifiers (config auto-fix)
	- modifiers in or rule (config auto-fix)
	- modifiers in array rule (config auto-fix)
	- invalid regex

- grammar:
	- invalid reference
	- missing soft reference (special config auto-fix)
	- cyclic hard reference

- console.table( file, line, col, error type, error message, matched pattern) ?
- console.error with line column
- watch mode

- no fix --> --no-fix in command
- auto-fix --> none in command
- config auto-fix --> --fix in command
- special config auto-fix --> --fix-all in command


- auto add rule: json (could be considered as keyword), number?, regex?


==

update benfy-lang syntaxes/bf.tmLanguage.json

better input/ouput of parser_generator.ts
