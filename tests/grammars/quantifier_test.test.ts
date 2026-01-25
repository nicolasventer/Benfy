import { describe, expect, test } from "bun:test";
import { parse } from "./quantifier_test_parser";

describe("Quantifier Test Parser", () => {
	describe("Valid expressions", () => {
		describe("Zero or more (*) checks", () => {
			test("should parse zero items", () => {
				const result = parse("zero_or_more: ");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test).toHaveLength(1);
				expect(result.quantifier_test[0].value.type).toBe("zero_or_more");
				if (result.quantifier_test[0].value.type === "zero_or_more") {
					expect(result.quantifier_test[0].value.item).toHaveLength(0);
				}
			});

			test("should parse one item", () => {
				const result = parse("zero_or_more: a");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("zero_or_more");
				if (result.quantifier_test[0].value.type === "zero_or_more") {
					expect(result.quantifier_test[0].value.item).toHaveLength(1);
					expect(result.quantifier_test[0].value.item[0].value).toBe("a");
				}
			});

			test("should parse multiple items", () => {
				const result = parse("zero_or_more: abc");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("zero_or_more");
				if (result.quantifier_test[0].value.type === "zero_or_more") {
					expect(result.quantifier_test[0].value.item).toHaveLength(3);
					expect(result.quantifier_test[0].value.item[0].value).toBe("a");
					expect(result.quantifier_test[0].value.item[1].value).toBe("b");
					expect(result.quantifier_test[0].value.item[2].value).toBe("c");
				}
			});
		});

		describe("One or more (+) checks", () => {
			test("should parse one item", () => {
				const result = parse("one_or_more: a");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("one_or_more");
				if (result.quantifier_test[0].value.type === "one_or_more") {
					expect(result.quantifier_test[0].value.item).toHaveLength(1);
					expect(result.quantifier_test[0].value.item[0].value).toBe("a");
				}
			});

			test("should parse multiple items", () => {
				const result = parse("one_or_more: xyz");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("one_or_more");
				if (result.quantifier_test[0].value.type === "one_or_more") {
					expect(result.quantifier_test[0].value.item.length).toBeGreaterThanOrEqual(1);
					expect(result.quantifier_test[0].value.item[0].value).toBe("x");
					expect(result.quantifier_test[0].value.item[1].value).toBe("y");
					expect(result.quantifier_test[0].value.item[2].value).toBe("z");
				}
			});
		});

		describe("Zero or one (?) checks", () => {
			test("should parse without optional", () => {
				const result = parse("zero_or_one: ");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("zero_or_one");
				if (result.quantifier_test[0].value.type === "zero_or_one") {
					expect(result.quantifier_test[0].value.optional).toBeUndefined();
				}
			});

			test("should parse with optional", () => {
				const result = parse("zero_or_one: optional");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("zero_or_one");
				if (result.quantifier_test[0].value.type === "zero_or_one") {
					expect(result.quantifier_test[0].value.optional).toBeDefined();
					if (result.quantifier_test[0].value.optional) {
						expect(result.quantifier_test[0].value.optional.value).toBe("optional");
					}
				}
			});
		});

		describe("Exactly n ({n}) checks", () => {
			test("should parse exactly 3 digits", () => {
				const result = parse("exactly_n: 123");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("exactly_n");
				if (result.quantifier_test[0].value.type === "exactly_n") {
					expect(result.quantifier_test[0].value.digit).toHaveLength(3);
					expect(result.quantifier_test[0].value.digit[0].value).toBe("1");
					expect(result.quantifier_test[0].value.digit[1].value).toBe("2");
					expect(result.quantifier_test[0].value.digit[2].value).toBe("3");
				}
			});

			test("should parse exactly 3 digits - different numbers", () => {
				const result = parse("exactly_n: 456");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("exactly_n");
				if (result.quantifier_test[0].value.type === "exactly_n") {
					expect(result.quantifier_test[0].value.digit).toHaveLength(3);
					expect(result.quantifier_test[0].value.digit[0].value).toBe("4");
					expect(result.quantifier_test[0].value.digit[1].value).toBe("5");
					expect(result.quantifier_test[0].value.digit[2].value).toBe("6");
				}
			});
		});

		describe("Range n to m ({n,m}) checks", () => {
			test("should parse 2 letters (minimum)", () => {
				const result = parse("range_n_m: ab");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("range_n_m");
				if (result.quantifier_test[0].value.type === "range_n_m") {
					expect(result.quantifier_test[0].value.letter).toHaveLength(2);
					expect(result.quantifier_test[0].value.letter[0].value).toBe("a");
					expect(result.quantifier_test[0].value.letter[1].value).toBe("b");
				}
			});

			test("should parse 3 letters (middle)", () => {
				const result = parse("range_n_m: xyz");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("range_n_m");
				if (result.quantifier_test[0].value.type === "range_n_m") {
					expect(result.quantifier_test[0].value.letter).toHaveLength(3);
					expect(result.quantifier_test[0].value.letter[0].value).toBe("x");
					expect(result.quantifier_test[0].value.letter[1].value).toBe("y");
					expect(result.quantifier_test[0].value.letter[2].value).toBe("z");
				}
			});

			test("should parse 4 letters (maximum)", () => {
				const result = parse("range_n_m: abcd");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("range_n_m");
				if (result.quantifier_test[0].value.type === "range_n_m") {
					expect(result.quantifier_test[0].value.letter).toHaveLength(4);
					expect(result.quantifier_test[0].value.letter[0].value).toBe("a");
					expect(result.quantifier_test[0].value.letter[1].value).toBe("b");
					expect(result.quantifier_test[0].value.letter[2].value).toBe("c");
					expect(result.quantifier_test[0].value.letter[3].value).toBe("d");
				}
			});
		});

		describe("Range n to infinity ({n,}) checks", () => {
			test("should parse 2 letters (minimum)", () => {
				const result = parse("range_n_inf: ab");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("range_n_inf");
				if (result.quantifier_test[0].value.type === "range_n_inf") {
					expect(result.quantifier_test[0].value.letter).toHaveLength(2);
					expect(result.quantifier_test[0].value.letter[0].value).toBe("a");
					expect(result.quantifier_test[0].value.letter[1].value).toBe("b");
				}
			});

			test("should parse 3 letters", () => {
				const result = parse("range_n_inf: xyz");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("range_n_inf");
				if (result.quantifier_test[0].value.type === "range_n_inf") {
					expect(result.quantifier_test[0].value.letter).toHaveLength(3);
					expect(result.quantifier_test[0].value.letter[0].value).toBe("x");
					expect(result.quantifier_test[0].value.letter[1].value).toBe("y");
					expect(result.quantifier_test[0].value.letter[2].value).toBe("z");
				}
			});

			test("should parse 5 letters", () => {
				const result = parse("range_n_inf: abcde");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("range_n_inf");
				if (result.quantifier_test[0].value.type === "range_n_inf") {
					expect(result.quantifier_test[0].value.letter).toHaveLength(5);
					expect(result.quantifier_test[0].value.letter[0].value).toBe("a");
					expect(result.quantifier_test[0].value.letter[1].value).toBe("b");
					expect(result.quantifier_test[0].value.letter[2].value).toBe("c");
					expect(result.quantifier_test[0].value.letter[3].value).toBe("d");
					expect(result.quantifier_test[0].value.letter[4].value).toBe("e");
				}
			});

			test("should parse many letters (10+)", () => {
				const result = parse("range_n_inf: abcdefghijklmnop");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test[0].value.type).toBe("range_n_inf");
				if (result.quantifier_test[0].value.type === "range_n_inf") {
					expect(result.quantifier_test[0].value.letter.length).toBeGreaterThanOrEqual(10);
					expect(result.quantifier_test[0].value.letter[0].value).toBe("a");
					expect(result.quantifier_test[0].value.letter[9].value).toBe("j");
				}
			});
		});

		describe("Multiple quantifier tests", () => {
			test("should parse multiple different quantifier tests", () => {
				const result = parse("zero_or_more: abc\none_or_more: xyz\nzero_or_one: optional");
				expect(result.type).toBe("quantifier_expr");
				expect(result.quantifier_test.length).toBeGreaterThanOrEqual(3);
				
				// First test - zero_or_more
				expect(result.quantifier_test[0].value.type).toBe("zero_or_more");
				
				// Newline
				expect(result.quantifier_test[1].value.type).toBe("new_line");
				
				// Second test - one_or_more
				expect(result.quantifier_test[2].value.type).toBe("one_or_more");
				
				// Newline
				expect(result.quantifier_test[3].value.type).toBe("new_line");
				
				// Third test - zero_or_one
				expect(result.quantifier_test[4].value.type).toBe("zero_or_one");
			});
		});
	});

	describe("Invalid expressions", () => {
		test("should throw error for one_or_more with zero items", () => {
			expect(() => parse("one_or_more: ")).toThrow();
		});

		test("should throw error for exactly_n with 2 digits (needs 3)", () => {
			expect(() => parse("exactly_n: 12")).toThrow();
		});

		test("should throw error for exactly_n with 4 digits (needs exactly 3)", () => {
			expect(() => parse("exactly_n: 1234")).toThrow();
		});

		test("should throw error for range_n_m with 1 letter (below minimum)", () => {
			expect(() => parse("range_n_m: a")).toThrow();
		});

		test("should throw error for range_n_m with 5 letters (above maximum)", () => {
			expect(() => parse("range_n_m: abcde")).toThrow();
		});

		test("should throw error for range_n_inf with 1 letter (below minimum)", () => {
			expect(() => parse("range_n_inf: a")).toThrow();
		});
	});
});
