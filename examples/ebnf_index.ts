import { generateBenfyGrammar, generateEbnfGrammar } from "./ebnf_generator";
import { logs, parse } from "./ebnf_parser";

const res = parse(await Bun.file("./graphql.ebnf").text(), () => console.table(logs));
// console.table(logs);

await Bun.write("./graphql_sanitized.ebnf", generateEbnfGrammar(res));
await Bun.write("./graphql_benfy.bf", generateBenfyGrammar(res));
