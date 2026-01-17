# Benfy

Benfy is a parser generator that converts `.bf` grammar files into type-safe TypeScript parsers.

## Features

- **Grammar Definition**: Define your grammar using a simple, readable syntax
- **Type-Safe Output**: Generates fully typed TypeScript parsers with proper type inference
- **Rich Grammar Support**: 
  - Regular expressions with flags (`/pattern/slmi`)
  - Quantifiers (`+`, `*`, `?`, `{n}`, `{n,m}`)
  - Negation (`!rule` or `!/regex/`)
  - Items with separators (`rule >> separator`)
  - Alternation (`rule1 | rule2`)
  - Spacing policies (strict/loose)
- **Validation**: Automatic validation of rule references and grammar structure
- **Debugging**: Optional JSON output for debugging parsed grammar structures
- **Error Handling**: Detailed error messages with line and column information
- **Location Metadata**: Optional location data in generated parser output
- **Comments**: Support for single-line (`#`) and multi-line (`##...##`) comments

## Usage

### Basic Usage

Generate a parser from a grammar file:

```bash
bun index.ts <your-grammar.bf>
```

This will generate a TypeScript parser file named `<your-grammar>_parser.ts` in the same directory as your grammar file.

### Command Line Options

```bash
bun index.ts <input-file> [options]

Arguments:
  <input-file>          Input grammar file path

Options:
  -o, --output <file>   Output TypeScript parser file path
                        (if no path provided, uses <input-name>_parser.ts)
  -d, --debug [file]    Output JSON result file path for debugging
                        (if no path provided, uses <input-name>_result.json)
  -s, --strip           Strip location data from debug JSON output
                        (default: false)
  -l, --location        Include location data in generated parser output
                        (default: false)
  -h, --help            Show this help message
```

### Examples

```bash
# Generate parser with default output name
bun index.ts grammar.bf

# Specify custom output file
bun index.ts grammar.bf -o parser.ts

# Generate parser with debug JSON output
bun index.ts grammar.bf -d

# Generate parser with custom output and debug files
bun index.ts grammar.bf -o parser.ts -d debug.json

# Generate parser with debug JSON (strip locations)
bun index.ts grammar.bf -d --strip

# Include location data in generated parser
bun index.ts grammar.bf -l
```

## Grammar File Syntax

Benfy grammar files use a simple, readable syntax. Look at `examples/grammar.bf` to see a complete example of the grammar syntax itself.

### Grammar Syntax

- **Rules**: `rule_name: expression`
- **Regex**: `/pattern/` with optional flags (`s`=strict spacing, `l`=loose spacing, `m`=multiline, `i`=ignoreCase)
- **Alternation**: `rule1 | rule2 | rule3`
- **Quantifiers**: 
  - `rule*` (zero or more)
  - `rule+` (one or more)
  - `rule?` (zero or one)
  - `rule{3}` (exactly 3)
  - `rule{3,5}` (3 to 5)
- **Negation**: `!rule` or `!/regex/` (negative lookahead)
- **Separated Lists**: 
  - `rule >> separator` (items separated by separator, no trailing separator)
  - `rule? >> separator` (items separated by separator, trailing separator optional)
- **Spacing Policy**: 
  - `"strict"` - Whitespace must be explicitly matched (default)
  - `"loose"` - Automatically skip starting whitespace
  - Can be overridden with regex flag `s` (strict) or `l` (loose)
- **Comments**: 
  - `# comment text` (single-line)
  - `## multi-line comment ##` (multi-line)

### Examples

Here are examples illustrating the syntaxes that may be harder to understand:

#### Items with Separators

```bf
# Match items separated by a delimiter
array: item >> /,/
item: /\d+/
# ==> here [1,2,3] is valid but [1,2,3,] is not

# Match items separated by a delimiter with optional trailing item
array: item? >> /,/
item: /\d+/
# ==> here [1,2,3] and [1,2,3,] are valid
```

#### Spacing Policy

Control how whitespace is handled globally:

```bf
"strict" # Whitespace must be explicitly matched (default)
"loose"  # Automatically skip starting whitespace
```

It can be overridden anywhere in the grammar or with Regex flags.

```bf
"loose"
rule_1: /abc/ # equivalent to /\s*\babc\b/
rule_2: /abc/s # equivalent to /abc/, here "s" is the regex flag for strict spacing policy
"strict"
rule_3: /abc/ # equivalent to /abc/, here "strict" is the spacing policy
rule_4: /abc/l # equivalent to /\s*\babc\b/, here "l" is the regex flag for loose spacing policy
```

## Workflow

1. **Create a grammar file** (`.bf` extension)
   ```bf
   # WARNING: This content is not valid Benfy grammar, it is just an example to show how to write a grammar file.
   json: json_content
   json_content: object_ | array_ | string_ | number_ | boolean_ | null_
   object_: /\{/ object_content /\}/
   object_content: object_kv? >> /,/
   object_kv: string_ /:/ json
   ```

2. **Generate the parser**
   ```bash
   bun index.ts json.bf
   ```
   This creates `json_parser.ts`

3. **Use the generated parser**
   ```typescript
   import { parse_json } from './json_parser';
   
   const result = parse_json('{"key": "value"}');
   ```

## Examples

Check out the `examples/` directory for complete examples:

- `json.bf` - JSON parser grammar
- `grammar.bf` - Benfy's own grammar definition
- `ebnf.bf` - EBNF parser grammar
- `graphql_benfy.bf` - GraphQL grammar (converted from EBNF)

## Error Handling

Benfy provides detailed error messages including:
- File location (file:line:column)
- Matched pattern information
- Context around the error location
- Reference validation errors for undefined rules

### Log Format

Each log entry contains the following information:

- **`debugName`**: The name of the rule being parsed
- **`rgx`**: The regex pattern that was attempted
- **`status`**: `"true"` for successful matches, `"false"` for failures
- **`index`**: Character position in the input string
- **`location`**: File location in format `file:line:col` (or just `line:col` if no file path)
- **`text`**: Preview of the text at that position (up to 25 characters)

### Example Output

When you call `console.table(logs)`, you'll see output like this:

```
┌─────────────┬──────────────────┬────────┬───────┬──────────┬─────────────────────┐
│ debugName   │ rgx              │ status │ index │ location │ text                │
├─────────────┼──────────────────┼────────┼───────┼──────────┼─────────────────────┤
│ json        │ \s*              │ true   │ 0     │ 1:1      │ {"invalid": json}   │
│ json_content│ \{               │ true   │ 1     │ 1:2      │ {"invalid": json}   │
│ object_kv   │ "(\\"|[^"])*"    │ true   │ 2     │ 1:3      │ "invalid": json}    │
│ json        │ \s*              │ false  │ 13    │ 1:14     │ json}               │
└─────────────┴──────────────────┴────────┴───────┴──────────┴─────────────────────┘
```

This helps you understand:
- Which rules were attempted
- Where in the input the parser failed
- What text was being parsed at that point
- The exact location (line and column) of the failure

### Logs in Error Callbacks

You can also access logs in the error callback:

```typescript
import { logs, parse_json } from './json_parser';

const result = parse_json(
  '{"invalid": json}',
  '', // file path (optional)
  (error) => {
    console.table(logs);
    console.error('Parse failed:', error);
  }
);
```

## License

MIT License. See [LICENSE file](LICENSE).
Please refer me with:

	Copyright (c) Nicolas VENTER All rights reserved.
