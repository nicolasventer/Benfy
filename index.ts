import path from "path";
import { checkRules } from "./grammar_checker";
import { generateCode } from "./grammar_generator";
import { logs, parse } from "./grammar_parser";

export interface ParserGeneratorConfig {
	/** Input grammar file path (relative to __dirname or absolute) */
	inputFile: string;
	/** Output TypeScript parser file path (default: computed from inputFile) */
	outputFile?: string;
	/** Output JSON result file path for debugging (optional) */
	debugJsonFile?: string;
}

interface CliArgs {
	inputFile: string;
	outputFile?: string;
	debugJsonFile?: string;
}

function parseArgs(): CliArgs {
	const args = process.argv.slice(2);
	const result: CliArgs = {
		inputFile: "",
	};

	let i = 0;
	while (i < args.length) {
		const arg = args[i];

		if (arg === "-o" || arg === "--output") {
			if (i + 1 >= args.length) {
				console.error("Error: -o requires a file path");
				process.exit(1);
			}
			result.outputFile = args[++i];
		} else if (arg === "-d" || arg === "--debug") {
			// If next arg exists and doesn't start with -, it's a path
			if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
				result.debugJsonFile = args[++i];
			} else {
				// -d without path: will be computed later from input file
				result.debugJsonFile = "";
			}
		} else if (arg === "-h" || arg === "--help") {
			console.log(`
Usage: bun index.ts <input-file> [options]

Arguments:
  <input-file>          Input grammar file path

Options:
  -o, --output <file>   Output TypeScript parser file path
                        (if no path provided, uses <input-name>_parser.ts)
  -d, --debug [file]    Output JSON result file path for debugging
                        (if no path provided, uses <input-name>_result.json)
  -h, --help            Show this help message

Examples:
  bun index.ts grammar.bf
  bun index.ts grammar.bf -o parser.ts
  bun index.ts grammar.bf -o parser.ts -d debug.json
  bun index.ts grammar.bf -d
			`);
			process.exit(0);
		} else if (!arg.startsWith("-")) {
			if (result.inputFile) {
				console.error("Error: Multiple input files specified");
				process.exit(1);
			}
			result.inputFile = arg;
		} else {
			console.error(`Error: Unknown option: ${arg}`);
			console.error("Use -h or --help for usage information");
			process.exit(1);
		}

		i++;
	}

	if (!result.inputFile) {
		console.error("Error: Input file is required");
		console.error("Use -h or --help for usage information");
		process.exit(1);
	}

	return result;
}

/**
 * Computes the output file path from the input file path if not provided.
 * Replaces the extension with .ts and places it in the same directory.
 */
function computeOutputFile(inputFile: string): string {
	const inputPath = path.resolve(inputFile);
	const parsed = path.parse(inputPath);
	return path.join(parsed.dir, `${parsed.name}_parser.ts`);
}

/**
 * Computes the debug JSON file path from the input file path.
 * Uses the input file name with "_result.json" extension in the same directory.
 */
function computeDebugFile(inputFile: string): string {
	const inputPath = path.resolve(inputFile);
	const parsed = path.parse(inputPath);
	return path.join(parsed.dir, `${parsed.name}_result.json`);
}

export async function generateParser(config: ParserGeneratorConfig) {
	const inputPath = path.resolve(config.inputFile);
	const outputPath = config.outputFile ? path.resolve(config.outputFile) : computeOutputFile(config.inputFile);
	const debugJsonPath =
		config.debugJsonFile !== undefined
			? config.debugJsonFile === ""
				? computeDebugFile(config.inputFile)
				: path.resolve(config.debugJsonFile)
			: undefined;

	try {
		// Step 1: Read the grammar file
		console.log(`Reading grammar file: ${inputPath}`);
		const grammarText = await Bun.file(inputPath).text();

		// Step 2: Parse the grammar file
		console.log("Parsing grammar...");
		const parsedGrammar = parse(grammarText, config.inputFile, (res) => {
			console.table(logs);
			if (debugJsonPath) {
				console.log(`Writing debug JSON: ${debugJsonPath}`);
				Bun.write(debugJsonPath, JSON.stringify(res, null, "\t"));
			}
			console.log("Parsing failed, exiting...");
			process.exit(1);
		});

		// Step 3: Optionally write debug JSON
		if (debugJsonPath) {
			console.log(`Writing debug JSON: ${debugJsonPath}`);
			await Bun.write(debugJsonPath, JSON.stringify(parsedGrammar, null, "\t"));
		}

		// Step 4: Validate rules (reference checks)
		console.log("Validating grammar rules...");
		const validationResult = checkRules(parsedGrammar, inputPath);

		if (validationResult.others.length > 0) {
			console.table(validationResult.others);
		}

		if (validationResult.errors.length > 0) {
			console.table(validationResult.errors);
			console.log("Validation failed, exiting...");
			process.exit(1);
		}

		// Step 5: Generate TypeScript parser code
		console.log(`Generating parser code: ${outputPath}`);
		const generatedCode = generateCode(parsedGrammar);
		await Bun.write(outputPath, generatedCode);

		console.log("Parser generation completed successfully!");
	} catch (error) {
		console.error("Error during parser generation:", error);
		console.table(logs);
		throw error;
	}
}

async function main() {
	const args = parseArgs();
	const config: ParserGeneratorConfig = {
		inputFile: args.inputFile,
		outputFile: args.outputFile,
		debugJsonFile: args.debugJsonFile,
	};
	await generateParser(config);
}

if (import.meta.main) {
	await main();
}
