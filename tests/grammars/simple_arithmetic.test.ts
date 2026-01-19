import { describe, expect, test } from "bun:test";
import { parse } from "./simple_arithmetic_parser";

describe("Simple Arithmetic Parser", () => {
	describe("Valid expressions", () => {
		test("should parse a single number", () => {
			const result = parse("42");
			expect(result.type).toBe("expr");
			expect(result.value).toHaveLength(1);
			expect(result.value[0].term.value.type).toBe("number_");
			if (result.value[0].term.value.type === "number_") {
				expect(result.value[0].term.value.value).toBe("42");
			}
		});

		test("should parse a decimal number", () => {
			const result = parse("3.14");
			expect(result.type).toBe("expr");
			expect(result.value[0].term.value.type).toBe("number_");
			if (result.value[0].term.value.type === "number_") {
				expect(result.value[0].term.value.value).toBe("3.14");
			}
		});

		test("should parse simple addition", () => {
			const result = parse("1+2");
			expect(result.type).toBe("expr");
			expect(result.value).toHaveLength(2);
			if (result.value[0].term.value.type === "number_") {
				expect(result.value[0].term.value.value).toBe("1");
			}
			expect(result.value[0].op.value).toBe("+");
			if (result.value[1].term.value.type === "number_") {
				expect(result.value[1].term.value.value).toBe("2");
			}
		});

		test("should parse simple subtraction", () => {
			const result = parse("5-3");
			expect(result.type).toBe("expr");
			expect(result.value[0].op.value).toBe("-");
		});

		test("should parse simple multiplication", () => {
			const result = parse("4*6");
			expect(result.type).toBe("expr");
			expect(result.value[0].op.value).toBe("*");
		});

		test("should parse simple division", () => {
			const result = parse("8/2");
			expect(result.type).toBe("expr");
			expect(result.value[0].op.value).toBe("/");
		});

		test("should parse expression with multiple operations", () => {
			const result = parse("1+2-3");
			expect(result.type).toBe("expr");
			expect(result.value).toHaveLength(3);
			expect(result.value[0].op.value).toBe("+");
			expect(result.value[1].op.value).toBe("-");
		});

		test("should parse parenthesized expression", () => {
			const result = parse("(42)");
			expect(result.type).toBe("expr");
			expect(result.value[0].term.value.type).toBe("paren_expr");
			if (result.value[0].term.value.type === "paren_expr") {
				if (result.value[0].term.value.expr.value[0].term.value.type === "number_") {
					expect(result.value[0].term.value.expr.value[0].term.value.value).toBe("42");
				}
			}
		});

		test("should parse expression with parentheses", () => {
			const result = parse("(1+2)");
			expect(result.type).toBe("expr");
			expect(result.value[0].term.value.type).toBe("paren_expr");
			if (result.value[0].term.value.type === "paren_expr") {
				const innerExpr = result.value[0].term.value.expr;
				if (innerExpr.value[0].term.value.type === "number_") {
					expect(innerExpr.value[0].term.value.value).toBe("1");
				}
				expect(innerExpr.value[0].op.value).toBe("+");
			}
		});

		test("should parse nested parentheses", () => {
			const result = parse("((3))");
			expect(result.type).toBe("expr");
			expect(result.value[0].term.value.type).toBe("paren_expr");
			if (result.value[0].term.value.type === "paren_expr") {
				const innerExpr = result.value[0].term.value.expr;
				expect(innerExpr.value[0].term.value.type).toBe("paren_expr");
				if (innerExpr.value[0].term.value.type === "paren_expr") {
					if (innerExpr.value[0].term.value.expr.value[0].term.value.type === "number_") {
						expect(innerExpr.value[0].term.value.expr.value[0].term.value.value).toBe("3");
					}
				}
			}
		});

		test("should parse complex expression with parentheses and operations", () => {
			const result = parse("(1+2)*3");
			expect(result.type).toBe("expr");
			expect(result.value).toHaveLength(2);
			expect(result.value[0].term.value.type).toBe("paren_expr");
			expect(result.value[0].op.value).toBe("*");
			expect(result.value[1].term.value.type).toBe("number_");
			if (result.value[1].term.value.type === "number_") {
				expect(result.value[1].term.value.value).toBe("3");
			}
		});

		test("should parse expression with decimal numbers", () => {
			const result = parse("1.5+2.3");
			expect(result.type).toBe("expr");
			if (result.value[0].term.value.type === "number_") {
				expect(result.value[0].term.value.value).toBe("1.5");
			}
			expect(result.value[0].op.value).toBe("+");
		});

		test("should parse expression with whitespace (loose spacing)", () => {
			const result = parse("  1  +  2  ");
			expect(result.type).toBe("expr");
			if (result.value[0].term.value.type === "number_") {
				expect(result.value[0].term.value.value).toBe("1");
			}
			expect(result.value[0].op.value).toBe("+");
		});
	});

	describe("Invalid expressions", () => {
		test("should throw error for invalid characters", () => {
			expect(() => parse("abc")).toThrow();
		});

		test("should throw error for unmatched opening parenthesis", () => {
			expect(() => parse("(1+2")).toThrow();
		});

		test("should throw error for unmatched closing parenthesis", () => {
			expect(() => parse("1+2)")).toThrow();
		});

		test("should throw error for expression starting with operator", () => {
			expect(() => parse("+1")).toThrow();
		});

		test("should throw error for expression ending with operator", () => {
			expect(() => parse("1+")).toThrow();
		});

		test("should throw error for consecutive operators", () => {
			expect(() => parse("1++2")).toThrow();
		});

		test("should throw error for invalid number format", () => {
			expect(() => parse("1.2.3")).toThrow();
		});

		test("should throw error for text not fully parsed", () => {
			expect(() => parse("1+2abc")).toThrow();
		});
	});

	describe("Edge cases", () => {
		test("should parse zero", () => {
			const result = parse("0");
			if (result.value[0].term.value.type === "number_") {
				expect(result.value[0].term.value.value).toBe("0");
			}
		});

		test("should parse large numbers", () => {
			const result = parse("123456789");
			if (result.value[0].term.value.type === "number_") {
				expect(result.value[0].term.value.value).toBe("123456789");
			}
		});

		test("should parse decimal starting with zero", () => {
			const result = parse("0.5");
			if (result.value[0].term.value.type === "number_") {
				expect(result.value[0].term.value.value).toBe("0.5");
			}
		});
	});
});
