# TODO

## TODO EBNF

- [ ] support of ::+
- [ ] support of line comments with //
- [ ] support of multiline comment with (* *)
- [ ] support of {...} for group (like (...))

- [ ] ISO/IEC 14977:
  - [ ] remove support of + * ?
  - [ ] [...] optional
  - [ ] {...} 0 or more
  - [ ] support of line comment with start of line with '+'

## TODO BENFY

- [ ] tests
- [ ] support of rule|: (equivalent of ::+) ?
- [ ] auto rename when generating parser (for keword like 'case', 'number', 'type', ...)
- [ ] manual renaming like definition_0 --> module_definition (yaml file)

## TODO BOTH

- [ ] merge ebnf_index with index (add options to select language and also conversion options (like strict/loose))

## ✨ Features

- [x] **EBNF Conversion from**: Support conversion from Benfy to EBNF format
- [ ] **EBNF Conversion to**: Support conversion from EBNF to Benfy format
- [ ] **Railroad diagrams**: Support generation of railroad diagrams from EBNF
- [ ] **Auto-sort**: Implement automatic sorting of rules
- [ ] **Auto-fix**: Implement automatic error fixing (TO CANCEL)

---

## 🔧 Auto-fix Implementation

### Syntax Fixes

| Issue                     | Fix Type            |
| ------------------------- | ------------------- |
| Uppercase inconsistencies | Auto-fix            |
| Multiple spaces           | Auto-fix            |
| Space in rule name        | Auto-fix            |
| Regex quantifiers         | Config auto-fix     |
| Quantifiers in OR rule    | Config auto-fix     |
| Invalid regex             | Manual fix required |
| Successive regex          | Auto-fix            |

### Grammar Fixes

| Issue                  | Fix Type                |
| ---------------------- | ----------------------- |
| Invalid reference      | Manual fix required     |
| Missing soft reference | Special config auto-fix |
| Cyclic hard reference  | Manual fix required     |

### Command Line Flags

| Behavior                | Flag             |
| ----------------------- | ---------------- |
| No fix                  | `--no-fix`       |
| Auto-fix                | (none - default) |
| Config auto-fix         | `--fix`          |
| Special config auto-fix | `--fix-all`      |

---

## 📚 Useful Examples

- [ ] `typescript.bf` - TypeScript grammar example
- [ ] `number.bf` - Number parsing grammar
- [ ] `regex.bf` - Regular expression grammar

---

## 💡 Ideas to Explore

### Semantic analyzer

- Scope management
- Declaration syntax
- Definition syntax
- Import/export system
- Function support
- Class support (attributes, methods)
- Inheritance (public/protected/private) - _later_
