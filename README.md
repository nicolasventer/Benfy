# Benfy

Generate a TypeScript parser from a grammar definition file.

## Description

A parser generator that converts `.bf` grammar files into type-safe TypeScript parsers.

## Features

- **Grammar Definition**: Define parsers using a simple, readable grammar syntax
- **Type-Safe Output**: Generates fully typed TypeScript parsers with TypeScript interfaces
- **Rich Grammar Support**:
  - Regular expressions for pattern matching
  - Rule references and composition
  - Quantifiers (`*`, `+`, `?`, `{n}`, `{n,m}`)
  - Alternations (OR expressions)
  - Separated lists (items with join patterns)
  - Optional elements
- **Validation**: Built-in grammar validation with error, warning, and info messages
- **Debugging**: Comprehensive logging system for parsing failures and successes
- **Error Handling**: Detailed error reporting with position information

### Grammar Validation Rules

- **Errors**:
  - All used rules must exist
  - All rules must have unique names
  - A rule should not be self-contained (should be in an OR expression or quantified with `*` or `?`)
- **Warnings**:
  - All rules should be used
- **Info**:
  - All successive regex patterns should be concatenated

## Example

Here's a complete example of generating a JSON parser:

### Grammar File (`json.bf`)

```bf
json: /\s*/ json_content /\s*/
json_content: null_ | boolean_ | string_ | number_ | array_ | object_
null_: /null/
boolean_: /true|false/
string_: /"(\\"|[^"])*"/
number_: /(0|[1-9][0-9]*)(.[0-9]+)?(e[+-]?[0-9]+)?/
array_: /\[/ array_content /\]/
array_content: json? >> /,/
object_: /\{/ object_content /}/
object_content: object_kv? >> /,/
object_kv: /\s*/ string_ /\s*:/ json
```

### Generate the Parser

**Using the CLI:**
```bash
bun index.ts ./examples/json.bf -o ./examples/json_parser.ts -d ./examples/json.result.json
```

**Or programmatically:**
```typescript
import { generateParser } from "./index";
await generateParser({ inputFile: "./examples/json.bf", outputFile: "./examples/json_parser.ts", debugJsonFile: "./examples/json.result.json" });
```

### Use the Generated Parser

```typescript
import { parse, logs } from "./json_parser";

const result = parse(await Bun.file("./data.json").text(), (res) => {
  console.table(logs); // Debug information on failure
});

console.log(JSON.stringify(result, null, 2));
```

## Usage

### Basic Usage

1. **Create a grammar file** (`.bf` extension):
   ```bf
   my_rule: /pattern/ other_rule
   other_rule: /[a-z]+/
   ```

2. **Generate the parser** (choose one method):

   **CLI method:**
   ```bash
   bun index.ts ./my_grammar.bf
   # Or with custom output:
   bun index.ts ./my_grammar.bf -o ./my_parser.ts -d ./debug.json
   ```

   **Programmatic method:**
   ```typescript
   import { generateParser } from "./index";
   await generateParser({ inputFile: "./my_grammar.bf" });
   ```

3. **Use the generated parser**:
   ```typescript
   import { parse } from "./my_grammar_parser";

   const result = parse("input text");
   ```

### Grammar Syntax

- **Rules**: `rule_name: expression`
- **Regex**: `/pattern/`
- **Alternation**: `rule1 | rule2 | rule3`
- **Quantifiers**: 
  - `rule*` (zero or more)
  - `rule+` (one or more)
  - `rule?` (zero or one)
  - `rule{3}` (exactly 3)
  - `rule{3,5}` (3 to 5)
- **Separated Lists**: 
  - `rule >> separator` (items separated by separator, no trailing separator)
  - `rule? >> separator` (items separated by separator, trailing separator optional)
- **Comments**: `# comment text`

### Command Line Usage

The main entry point is `index.ts`, which accepts command-line arguments:

```bash
bun index.ts <input-file> [options]
```

**Arguments:**
- `<input-file>` - Input grammar file path (required)

**Options:**
- `-o, --output <file>` - Output TypeScript parser file path (optional, defaults to `{input-file}_parser.ts`)
- `-d, --debug <file>` - Output JSON result file path for debugging (optional)
- `-h, --help` - Show help message

**Examples:**
```bash
# Basic usage (output will be grammar_parser.ts)
bun index.ts grammar.bf

# With custom output file
bun index.ts grammar.bf -o custom_parser.ts

# With output and debug files
bun index.ts grammar.bf -o parser.ts -d debug.json
```

### Programmatic Usage

```typescript
import { generateParser } from "./index";
await generateParser({ inputFile: "./grammar.bf", outputFile: "./parser.ts", debugJsonFile: "./debug.json" });
```

You can also run `grammar_all.ts` with its default configuration: `bun run grammar_all.ts`

## Licence

MIT Licence. See [LICENSE file](LICENSE).
Please refer me with:

	Copyright (c) Nicolas VENTER All rights reserved.