import { describe, expect, test } from "bun:test";
import { parse } from "./regex_test_parser";

describe("Regex Test Parser", () => {
	describe("Valid expressions", () => {
		describe("Literal checks", () => {
			test("should parse literal 'a'", () => {
				const result = parse("literal: a");
				expect(result.type).toBe("regex_expr");
				expect(result.pattern_item).toHaveLength(1);
				expect(result.pattern_item[0].value.type).toBe("literal");
				if (result.pattern_item[0].value.type === "literal") {
					expect(result.pattern_item[0].value.value).toBe("literal: a");
				}
			});

			test("should parse literal 'b'", () => {
				const result = parse("literal: b");
				expect(result.type).toBe("regex_expr");
				expect(result.pattern_item[0].value.type).toBe("literal");
				if (result.pattern_item[0].value.type === "literal") {
					expect(result.pattern_item[0].value.value).toBe("literal: b");
				}
			});

			test("should parse literal 'C'", () => {
				const result = parse("literal: C");
				expect(result.type).toBe("regex_expr");
				expect(result.pattern_item[0].value.type).toBe("literal");
				if (result.pattern_item[0].value.type === "literal") {
					expect(result.pattern_item[0].value.value).toBe("literal: C");
				}
			});
		});

		describe("Digit checks", () => {
			test("should parse digit '0'", () => {
				const result = parse("digit: 0");
				expect(result.type).toBe("regex_expr");
				expect(result.pattern_item[0].value.type).toBe("digit");
				if (result.pattern_item[0].value.type === "digit") {
					expect(result.pattern_item[0].value.value).toBe("digit: 0");
				}
			});

			test("should parse digit '1'", () => {
				const result = parse("digit: 1");
				expect(result.type).toBe("regex_expr");
				expect(result.pattern_item[0].value.type).toBe("digit");
				if (result.pattern_item[0].value.type === "digit") {
					expect(result.pattern_item[0].value.value).toBe("digit: 1");
				}
			});
		});

		describe("Quantifier checks", () => {
			test("should parse number_ '1'", () => {
				const result = parse("number_: 1");
				expect(result.type).toBe("regex_expr");
				expect(result.pattern_item[0].value.type).toBe("number_");
				if (result.pattern_item[0].value.type === "number_") {
					expect(result.pattern_item[0].value.value).toBe("number_: 1");
				}
			});

			test("should parse number '23.'", () => {
				const result = parse("number_: 23.");
				expect(result.type).toBe("regex_expr");
				expect(result.pattern_item[0].value.type).toBe("number_");
				if (result.pattern_item[0].value.type === "number_") {
					expect(result.pattern_item[0].value.value).toBe("number_: 23.");
				}
			});

			test("should parse number '45.67'", () => {
				const result = parse("number_: 45.67");
				expect(result.type).toBe("regex_expr");
				expect(result.pattern_item[0].value.type).toBe("number_");
				if (result.pattern_item[0].value.type === "number_") {
					expect(result.pattern_item[0].value.value).toBe("number_: 45.67");
				}
			});
		});

		describe("Ignore case checks", () => {
			test("should parse ignore_case 'a'", () => {
				const result = parse("ignore_case: a");
				expect(result.type).toBe("regex_expr");
				expect(result.pattern_item[0].value.type).toBe("ignore_case");
				if (result.pattern_item[0].value.type === "ignore_case") {
					expect(result.pattern_item[0].value.value).toBe("ignore_case: a");
				}
			});

			test("should parse ignore_case 'B'", () => {
				const result = parse("ignore_case: B");
				expect(result.type).toBe("regex_expr");
				expect(result.pattern_item[0].value.type).toBe("ignore_case");
				if (result.pattern_item[0].value.type === "ignore_case") {
					expect(result.pattern_item[0].value.value).toBe("ignore_case: B");
				}
			});
		});

		describe("Multiline checks", () => {
			test("should parse multiline 'multiline: a\\nmultiline: b'", () => {
				const result = parse("multiline: a\nmultiline: b");
				expect(result.type).toBe("regex_expr");
				expect(result.pattern_item.length).toBeGreaterThanOrEqual(2);
				// First multiline match
				expect(result.pattern_item[0].value.type).toBe("multiline");
				if (result.pattern_item[0].value.type === "multiline") {
					expect(result.pattern_item[0].value.value).toBe("multiline: a");
				}
				// Newline
				expect(result.pattern_item[1].value.type).toBe("new_line");
				// Second multiline match
				expect(result.pattern_item[2].value.type).toBe("multiline");
				if (result.pattern_item[2].value.type === "multiline") {
					expect(result.pattern_item[2].value.value).toBe("multiline: b");
				}
			});
		});
	});

	describe("Invalid expressions", () => {
		test("should throw error for number_ '.12'", () => {
			expect(() => parse("number_: .12")).toThrow();
		});

		test("should throw error for no_ignore_case 'A'", () => {
			expect(() => parse("no_ignore_case: A")).toThrow();
		});

		test("should throw error for no_multiline 'multiline: a\\nmultiline: b'", () => {
			expect(() => parse("no_multiline: a\nno_multiline: b")).toThrow();
		});
	});
});
