# Benfy

Generate a parser from a grammar


grammar rules:
- error:
  - all used rules should exist
  - all rules should have a unique name
  - a rule should not be self-contained (should be in a OR expression or quantified with * or ?)
- warning:
  - all rules should be used
- info:
  - all successive regex should be concatenated
