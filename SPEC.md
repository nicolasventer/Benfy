grammar rules:
- error:
  - all used rules should exist
  - all rules should have a unique name
  - a rule should not be self-contained (should be in a OR expression or quantified with * or ?)
- warning:
  - all rules should be used
- info:
  - all rules implied in a OR expression (without ?) should start with a different string
  - all successive string should be concatenated
- suggestion:
  - all modified strings in a OR expression should be placed in a separate rule (optionally ignored)

grammar properties:
- same rule name term including quantifier (* <=> +) are gathered in an array
- rule name term with brace quantifier are gathered in an array with the count in the name (min and max if specified)
- only one rule name per OR block
- rule name implied in a OR block should not be quantified