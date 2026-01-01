import { generateParser, type ParserGeneratorConfig } from "./index";

if (import.meta.main) {
	const config: ParserGeneratorConfig = {
		inputFile: "./examples/grammar.bf",
		// outputFile: "./examples/grammar_parser.ts", // Optional: will be computed if not provided
		// debugJsonFile: "./examples/grammar.result.json", // Optional: omit to skip debug output
	};

	await generateParser(config);
}
