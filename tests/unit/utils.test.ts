import { describe, it, expect } from "vitest";
import {
  buildFrontmatter,
  extractFrontmatterFields,
  countWords,
  slugifyDraftName,
  FRONTMATTER_REGEX,
  SLUG_STYLE,
} from "@/core/utils";

describe("utils.ts", () => {
  describe("buildFrontmatter", () => {
    it("should build frontmatter with simple key-value pairs", () => {
      const fields = { project_id: "123", draft_name: "Draft 1", word_count: 1000 };
      const result = buildFrontmatter(fields);

      expect(result).toContain("---");
      expect(result).toContain("project_id: 123");
      expect(result).toContain("draft_name: Draft 1");
      expect(result).toContain("word_count: 1000");
      expect(result.startsWith("---\n")).toBe(true);
      expect(result.endsWith("---")).toBe(true);
    });

    it("should quote strings with colons", () => {
      const fields = { description: "This is: a test" };
      const result = buildFrontmatter(fields);

      expect(result).toContain('description: "This is: a test"');
    });

    it("should quote strings with newlines", () => {
      const fields = { description: "Line 1\nLine 2" };
      const result = buildFrontmatter(fields);

      expect(result).toContain('description: "Line 1\\nLine 2"');
    });

    it("should handle numeric values without quotes", () => {
      const fields = { count: 42, percentage: 75.5 };
      const result = buildFrontmatter(fields);

      expect(result).toContain("count: 42");
      expect(result).toContain("percentage: 75.5");
      expect(result).not.toContain('"42"');
    });
  });

  describe("extractFrontmatterFields", () => {
    it("should extract simple key-value pairs", () => {
      const content = "project_id: 123\ndraft_name: Draft 1\nword_count: 1000";
      const fields = extractFrontmatterFields(content);

      // Note: 123 is parsed as a number since it's numeric
      expect(fields.project_id).toBe(123);
      expect(fields.draft_name).toBe("Draft 1");
      expect(fields.word_count).toBe(1000);
    });

    it("should parse numeric values correctly", () => {
      const content = "integer: 42\nfloat: 3.14\nnegative: -10";
      const fields = extractFrontmatterFields(content);

      expect(fields.integer).toBe(42);
      expect(fields.float).toBe(3.14);
      expect(fields.negative).toBe(-10);
    });

    it("should handle quoted strings", () => {
      const content = 'description: "This is: a test"\ntitle: "Line 1\\nLine 2"';
      const fields = extractFrontmatterFields(content);

      expect(fields.description).toBe("This is: a test");
      expect(fields.title).toBe("Line 1\nLine 2");
    });

    it("should skip empty lines", () => {
      const content = "key1: value1\n\nkey2: value2\n\n";
      const fields = extractFrontmatterFields(content);

      expect(fields.key1).toBe("value1");
      expect(fields.key2).toBe("value2");
      expect(Object.keys(fields).length).toBe(2);
    });

    it("should return empty object for invalid content", () => {
      const content = "not a valid frontmatter line";
      const fields = extractFrontmatterFields(content);

      expect(Object.keys(fields).length).toBe(0);
    });
  });

  describe("FRONTMATTER_REGEX", () => {
    it("should match valid frontmatter block", () => {
      const content = "---\nkey: value\nother: data\n---\nBody content";
      const match = content.match(FRONTMATTER_REGEX);

      expect(match).not.toBeNull();
      expect(match![1]).toContain("key: value");
      expect(match![1]).toContain("other: data");
    });

    it("should not match if missing opening delimiter", () => {
      const content = "key: value\nother: data\n---\nBody content";
      const match = content.match(FRONTMATTER_REGEX);

      expect(match).toBeNull();
    });

    it("should not match if missing closing delimiter", () => {
      const content = "---\nkey: value\nother: data\nBody content";
      const match = content.match(FRONTMATTER_REGEX);

      expect(match).toBeNull();
    });

    it("should handle empty frontmatter", () => {
      const content = "---\n\n---\nBody content";
      const match = content.match(FRONTMATTER_REGEX);

      expect(match).not.toBeNull();
      expect(match![1].trim()).toBe("");
    });
  });

  describe("countWords", () => {
    it("should count words in simple text", () => {
      expect(countWords("one two three")).toBe(3);
      expect(countWords("hello world")).toBe(2);
    });

    it("should return 0 for empty string", () => {
      expect(countWords("")).toBe(0);
    });

    it("should return 0 for whitespace-only string", () => {
      expect(countWords("   \n\t  ")).toBe(0);
    });

    it("should handle punctuation-heavy text", () => {
      expect(countWords("Hello, world! How are you?")).toBe(5);
      // "test—really!" is treated as one word because em-dash connects them
      expect(countWords("It's a test—really!")).toBe(3);
    });

    it("should handle multiple spaces between words", () => {
      expect(countWords("word1    word2     word3")).toBe(3);
    });

    it("should handle newlines and tabs", () => {
      expect(countWords("line1\nline2\tline3")).toBe(3);
    });
  });

  describe("slugifyDraftName", () => {
    it("should slugify with compact style (default)", () => {
      expect(slugifyDraftName("Draft 1")).toBe("draft1");
      expect(slugifyDraftName("My New Draft")).toBe("mynewdraft");
      expect(slugifyDraftName("UPPERCASE")).toBe("uppercase");
    });

    it("should slugify with kebab style", () => {
      expect(slugifyDraftName("Draft 1", SLUG_STYLE.KEBAB)).toBe("draft-1");
      expect(slugifyDraftName("My New Draft", SLUG_STYLE.KEBAB)).toBe("my-new-draft");
      expect(slugifyDraftName("UPPERCASE", SLUG_STYLE.KEBAB)).toBe("uppercase");
    });

    it("should handle empty string", () => {
      expect(slugifyDraftName("")).toBe("");
      expect(slugifyDraftName("", SLUG_STYLE.KEBAB)).toBe("");
    });

    it("should trim whitespace", () => {
      expect(slugifyDraftName("  Draft 1  ")).toBe("draft1");
      expect(slugifyDraftName("  Draft 1  ", SLUG_STYLE.KEBAB)).toBe("draft-1");
    });

    it("should handle multiple spaces", () => {
      expect(slugifyDraftName("Draft   1")).toBe("draft1");
      expect(slugifyDraftName("Draft   1", SLUG_STYLE.KEBAB)).toBe("draft-1");
    });
  });
});
