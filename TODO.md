# TODO

## ✨ Features

- [ ] **Import handling**: Create rule `rule_ref != rule_name` to handle `.`
- [ ] **Watch mode**: File watching for automatic re-parsing
- [ ] **Auto-fix**: Implement automatic error fixing
- [ ] **Interactive execution**: Step-by-step parsing/debugging
- [ ] **Non-interruptive parse**: Background parsing without blocking

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

## 🔮 Future Considerations

- [ ] **EBFN Conversion**: Support conversion from/to EBFN format (for railroad diagrams)

---

## 💡 Ideas to Explore

### Language Features

- Scope management
- Declaration syntax
- Definition syntax
- Import/export system
- Function support
- Class support (attributes, methods)
- Inheritance (public/protected/private) - _later_
