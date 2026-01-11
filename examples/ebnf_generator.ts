import type { grammar } from "./ebnf_parser";

// ============================================================================
// Generator Module
// ============================================================================

function sanitizeGrammar(parsedGrammar: grammar): grammar {
	const sanitizedGrammar = structuredClone(parsedGrammar);

	for (let lineIndex = 0; lineIndex < sanitizedGrammar.line.length; lineIndex++) {
		const line = sanitizedGrammar.line[lineIndex];
		if (line.value.type !== "production") continue;
		const production = line.value;
		if (production.expression.value.length === 1) continue;
		let bNeedToSplit = false;
		let bHaveOrJoin = false;
		for (let expression_index = 0; expression_index < production.expression.value.length; expression_index++) {
			const expression = production.expression.value[expression_index];
			let bCannotHaveOrJoin = false; // multiple identifiers or identifier with quantifier
			let bHasIdentifier = false;
			let groupIndex = 0;
			for (const term_list of expression.term_list.value) {
				if (bCannotHaveOrJoin) break;
				const term = term_list.term;
				const factor = term.factor.value;
				if (factor.type === "identifier_no_assignment") {
					if (bHasIdentifier || term.quantifier) bCannotHaveOrJoin = true;
					bHasIdentifier = true;
				} else if (
					factor.type === "terminal" ||
					factor.type === "hex" ||
					factor.type === "regex_" ||
					factor.type === "character_class"
				) {
					if (bHasIdentifier) bCannotHaveOrJoin = true;
				} else if (factor.type === "group") {
					const newName = `${production.identifier.value}_group_${groupIndex}`;
					sanitizedGrammar.line.splice(lineIndex + 1 + groupIndex, 0, {
						type: "line",
						value: {
							type: "production",
							identifier: { type: "identifier", value: newName },
							expression: factor.expression,
						},
					});
					term.factor.value = { type: "identifier_no_assignment", value: newName };
					groupIndex++;
				}
			}
			if (expression.expression_join.value === "|") bHaveOrJoin = true;
			else if (
				expression.expression_join.value === "-" ||
				expression.expression_join.value === "++" ||
				expression.expression_join.value === "**" // TODO: ** && bHasIdentifier --> must split
			)
				bCannotHaveOrJoin = true;
			if (bHaveOrJoin && bCannotHaveOrJoin) {
				bNeedToSplit = true;
				break;
			}
		}
		if (bNeedToSplit) {
			let indexToAppend = -1;
			for (let expression_index = 0; expression_index < production.expression.value.length; expression_index++) {
				const expression = production.expression.value[expression_index];
				const newName = `${production.identifier.value}_${expression_index}`;
				const expression_join = expression.expression_join;
				expression.expression_join = {
					type: "expression_join",
					value: expression_join.value !== "|" ? expression_join.value : "",
				};
				if (indexToAppend !== -1) {
					const productionToAppend = sanitizedGrammar.line[indexToAppend].value;
					if (productionToAppend.type !== "production") throw new Error("Line to append is not a production");
					production.expression.value[expression_index - 1].expression_join = expression_join;
					productionToAppend.expression.value.push(expression);
					production.expression.value.splice(expression_index, 1);
					expression_index--;
				} else {
					sanitizedGrammar.line.splice(lineIndex + 1 + expression_index, 0, {
						type: "line",
						value: {
							type: "production",
							identifier: { type: "identifier", value: newName },
							expression: { type: "expression", value: [expression] },
						},
					});
					production.expression.value[expression_index] = {
						type: "expression_item",
						expression_join,
						term_list: {
							type: "term_list",
							value: [
								{
									type: "term_list_item",
									term: {
										type: "term",
										factor: { type: "factor", value: { type: "identifier_no_assignment", value: newName } },
										quantifier: undefined,
									},
								},
							],
						},
					};
				}

				indexToAppend = expression_join.value !== "|" ? lineIndex + 1 + expression_index : -1;
			}
		}
	}

	return sanitizedGrammar;
}

export function generateEbnfGrammar(parsedGrammar: grammar): string {
	const sanitizedGrammar = sanitizeGrammar(parsedGrammar);
	let result = "";
	for (const line of sanitizedGrammar.line) {
		if (line.value.type === "production") {
			result += `${line.value.identifier.value} ::=`;
			for (const expression of line.value.expression.value) {
				expression.term_list.value.forEach((term_list, term_list_index) => {
					result += " ";
					const factor = term_list.term.factor.value;
					if (
						factor.type === "identifier_no_assignment" ||
						factor.type === "terminal" ||
						factor.type === "hex" ||
						factor.type === "regex_"
					) {
						result += factor.value;
					} else if (factor.type === "comment")
						result += `${term_list_index === expression.term_list.value.length - 1 ? "\n" : ""}${factor.value}`;
					else if (factor.type === "character_class")
						result += `[${factor.character_range.map((character_range) => character_range.value).join("")}]`;
					else if (factor.type === "group") throw new Error("Sanitized grammar should not have group");
					if (term_list.term.quantifier) result += `${term_list.term.quantifier.value}`;
				});
				if (expression.expression_join.value !== "") result += ` ${expression.expression_join.value}`;
			}
		} else if (line.value.type === "comment") result += line.value.value;
		result += "\n";
	}
	return result;
}

const escapeRegex = (value: string) => value.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
const replaceHex = (value: string) => value.replace(/#x[0-9A-F]+/g, (match) => `\\u${match.slice(2)}`);

const regexWithQuantifier = (value: string, quantifier: string, bSlash: boolean = true) =>
	`${bSlash ? "/" : ""}${quantifier ? "(" : ""}${replaceHex(escapeRegex(value))}${quantifier ? `)${quantifier}` : ""}${
		bSlash ? "/" : ""
	}`;

const toBenfyComment = (value: string) =>
	value.includes("\n")
		? `##${value
				.slice(2, -2)
				.split("\n")
				.map((line) => line.trimStart().replace(/^\*\s*/, ""))
				.join("\n")}##`
		: value
				.slice(2, -2)
				.trim()
				.split("\n")
				.map((line) => `# ${line}`)
				.join("\n");

const toBenfyIdentifier = (value: string) => value.replace(/-/g, "_").replace(/<\S+>/g, (match) => match.slice(1, -1));

export function generateBenfyGrammar(parsedGrammar: grammar, bStrict: boolean = true): string {
	const sanitizedGrammar = sanitizeGrammar(parsedGrammar);
	let result = "";
	for (const line of sanitizedGrammar.line) {
		if (line.value.type === "production") {
			result += `${toBenfyIdentifier(line.value.identifier.value)}:`;
			const bHasNoIdentifier = line.value.expression.value.every((expression) =>
				expression.term_list.value.every((term_list) => term_list.term.factor.value.type !== "identifier_no_assignment")
			);
			if (bHasNoIdentifier) {
				result += " /";
				let interleaveExpressionStr = "";
				let commentStr = "";
				for (const expression of line.value.expression.value) {
					const last_non_comment_index = expression.term_list.value.findLastIndex(
						(term_list) => term_list.term.factor.value.type !== "comment"
					);
					const last_term_index = expression.term_list.value.length - 1;
					let expressionStr = "";
					expression.term_list.value.forEach((term_list, term_list_index) => {
						const factor = term_list.term.factor.value;
						const quantifier = term_list.term.quantifier ? term_list.term.quantifier.value : "";
						const plusQuantifier =
							term_list_index === last_non_comment_index && expression.expression_join.value === "++" ? "+" : "";
						const realQuantifier = quantifier === "*" ? quantifier : plusQuantifier || quantifier;
						if (factor.type === "identifier_no_assignment")
							throw new Error("This branch should not have identifier_no_assignment");
						else if (factor.type === "regex_")
							expressionStr += regexWithQuantifier(factor.value.slice(0, -1), realQuantifier, false);
						else if (factor.type === "terminal")
							expressionStr += regexWithQuantifier(factor.value.slice(1, -1), realQuantifier, false);
						else if (factor.type === "hex") expressionStr += regexWithQuantifier(factor.value, realQuantifier, false);
						else if (factor.type === "comment") {
							if (term_list_index === last_term_index) commentStr += `\n${toBenfyComment(factor.value)}`;
						} else if (factor.type === "character_class")
							expressionStr += `[${factor.character_range.map((character_range) => replaceHex(character_range.value)).join("")}]`;
						else if (factor.type === "group") throw new Error("Sanitized grammar should not have group");
					});
					const exprToAdd = interleaveExpressionStr
						? `(${interleaveExpressionStr}${expressionStr}|${expressionStr}${interleaveExpressionStr})`
						: expressionStr;
					interleaveExpressionStr = "";
					if (expression.expression_join.value === "|") result += `${exprToAdd}|`;
					else if (expression.expression_join.value === "") result += `${exprToAdd}${bStrict ? "" : "s*"}`;
					else if (expression.expression_join.value === "-") console.warn("'-' join not supported for noIdentifier branch");
					if (expression.expression_join.value === "**") interleaveExpressionStr = exprToAdd;
				}
				result += `/${commentStr}`;
			} else {
				let interleaveExpressionStr = "";
				let minusExpressionStr = "";
				let commentStr = "";
				for (const expression of line.value.expression.value) {
					const last_non_comment_index = expression.term_list.value.findLastIndex(
						(term_list) => term_list.term.factor.value.type !== "comment"
					);
					const last_term_index = expression.term_list.value.length - 1;
					let expressionStr = "";
					expression.term_list.value.forEach((term_list, term_list_index) => {
						const factor = term_list.term.factor.value;
						const quantifier = term_list.term.quantifier ? term_list.term.quantifier.value : "";
						const plusQuantifier = expression.expression_join.value === "++" ? "+" : "";
						const realQuantifier = quantifier === "*" ? quantifier : plusQuantifier || quantifier;
						if (factor.type === "identifier_no_assignment")
							expressionStr += `${toBenfyIdentifier(factor.value)}${realQuantifier}`;
						else if (factor.type === "regex_") expressionStr += regexWithQuantifier(factor.value.slice(0, -1), realQuantifier);
						else if (factor.type === "terminal") expressionStr += regexWithQuantifier(factor.value.slice(1, -1), realQuantifier);
						else if (factor.type === "hex") expressionStr += regexWithQuantifier(factor.value, realQuantifier);
						else if (factor.type === "comment") {
							if (term_list_index === last_term_index) commentStr += `\n${toBenfyComment(factor.value)}`;
						} else if (factor.type === "character_class")
							expressionStr += `/[${factor.character_range
								.map((character_range) => replaceHex(character_range.value))
								.join("")}]${realQuantifier}/`;
						else if (factor.type === "group") throw new Error("Sanitized grammar should not have group");
						if (term_list_index <= last_non_comment_index) expressionStr += " ";
					});
					const exprToAdd = interleaveExpressionStr
						? `${interleaveExpressionStr}${expressionStr}| ${expressionStr}${interleaveExpressionStr}`
						: minusExpressionStr
						? `!${expressionStr}${minusExpressionStr.trimEnd()}`
						: expressionStr;
					if (
						(interleaveExpressionStr || minusExpressionStr) &&
						(expression.expression_join.value === "**" || expression.expression_join.value === "-")
					)
						throw new Error("''-' and '**' joins not supported after '-' or '**' for branch with identifier, use group");
					interleaveExpressionStr = "";
					minusExpressionStr = "";
					if (expression.expression_join.value === "|") result += ` ${exprToAdd}|`;
					else if (expression.expression_join.value === "") result += ` ${exprToAdd}`;
					else if (expression.expression_join.value === "-") minusExpressionStr = exprToAdd;
					if (expression.expression_join.value === "**") interleaveExpressionStr = exprToAdd; // TODO: should not be handled here
				}
				result += commentStr;
			}
		} else if (line.value.type === "comment") result += toBenfyComment(line.value.value);
		result += "\n";
	}
	return result;
}
