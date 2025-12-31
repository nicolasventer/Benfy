# TODOs

- grammar should have at least one rule

# TODO features

- import ==> create rule rule_ref != rule_name to handle .
- info spec to impl (successive regex)
- watch mode
- implement auto-fix
- interactive execution (step by step)
- non interruptive parse

## TODO auto-fix

- syntax:
	- uppercase (auto-fix)
	- multiple spaces (auto-fix)
	- space in rule name (auto-fix)
	- regex quantifiers (config auto-fix)
	- quantifiers in or rule (config auto-fix)
	- invalid regex
	- successive regex (auto-fix)
- grammar:
	- invalid reference
	- missing soft reference (special config auto-fix)
	- cyclic hard reference

- no fix --> --no-fix in command
- auto-fix --> none in command
- config auto-fix --> --fix in command
- special config auto-fix --> --fix-all in command

# TODO useful

- typescript.bf
- number.bf
- regex.bf

# TODO later

conversion from/to EBFN (for railroad diagrams)

# TOSEE

scope
declaration
definition
import
export
function
class (attribute, method)

(later) inheritance (public/protected/private)
