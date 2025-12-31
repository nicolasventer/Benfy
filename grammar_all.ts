import path from "path";
import { checkRules, checkSyntaxInText } from "./grammar_checker";
import { generateCode } from "./grammar_generator";
import { logs, parse } from "./grammar_parser";

// ============================================================================
// Configuration
// ============================================================================

export interface ParserGeneratorConfig {
	/** Input grammar file path (relative to __dirname or absolute) */
	inputFile: string;
	/** Output TypeScript parser file path (default: computed from inputFile) */
	outputFile?: string;
	/** Output JSON result file path for debugging (optional) */
	debugJsonFile?: string;
}

/**
 * Computes the output file path from the input file path if not provided.
 * Replaces the extension with .ts and places it in the same directory.
 */
function computeOutputFile(inputFile: string): string {
	const inputPath = path.resolve(__dirname, inputFile);
	const parsed = path.parse(inputPath);
	return path.join(parsed.dir, `${parsed.name}_parser.ts`);
}

// ============================================================================
// Main Entry Point
// ============================================================================

export async function generateParser(config: ParserGeneratorConfig) {
	const inputPath = path.resolve(__dirname, config.inputFile);
	const outputPath = config.outputFile ? path.resolve(__dirname, config.outputFile) : computeOutputFile(config.inputFile);
	const debugJsonPath = config.debugJsonFile ? path.resolve(__dirname, config.debugJsonFile) : undefined;

	try {
		// Step 1: Read the grammar file
		console.log(`Reading grammar file: ${inputPath}`);
		const grammarText = await Bun.file(inputPath).text();

		// Step 2: Check syntax errors in the raw text (before parsing)
		console.log("Checking syntax...");
		const syntaxErrors = checkSyntaxInText(grammarText, inputPath);
		if (syntaxErrors.length > 0) {
			console.table(syntaxErrors);
			console.log("Syntax validation failed, exiting...");
			process.exit(1);
		}

		// Step 3: Parse the grammar file
		console.log("Parsing grammar...");
		const parsedGrammar = parse(grammarText, (res) => {
			console.table(logs);
			if (debugJsonPath) {
				console.log(`Writing debug JSON: ${debugJsonPath}`);
				Bun.write(debugJsonPath, JSON.stringify(res, null, "\t"));
			}
			console.log("Parsing failed, exiting...");
			process.exit(1);
		});

		// Step 4: Validate rules (reference checks)
		console.log("Validating grammar rules...");
		const validationResult = checkRules(parsedGrammar, inputPath);

		if (validationResult.errors.length > 0) {
			console.table(validationResult.errors);
			console.log("Validation failed, exiting...");
			process.exit(1);
		}

		if (validationResult.others.length > 0) {
			console.table(validationResult.others);
		}

		// Step 5: Generate TypeScript parser code
		console.log(`Generating parser code: ${outputPath}`);
		const generatedCode = generateCode(parsedGrammar);
		await Bun.write(outputPath, generatedCode);

		// Step 6: Optionally write debug JSON
		if (debugJsonPath) {
			console.log(`Writing debug JSON: ${debugJsonPath}`);
			await Bun.write(debugJsonPath, JSON.stringify(parsedGrammar, null, "\t"));
		}

		console.log("Parser generation completed successfully!");
	} catch (error) {
		console.error("Error during parser generation:", error);
		console.table(logs);
		throw error;
	}
}

// ============================================================================
// Default Configuration (for direct execution)
// ============================================================================

if (import.meta.main) {
	const config: ParserGeneratorConfig = {
		inputFile: "./examples/grammar.bf",
		// outputFile: "json_parser.ts", // Optional: will be computed if not provided
		// debugJsonFile: "b.result.json", // Optional: omit to skip debug output
	};

	await generateParser(config);
}
