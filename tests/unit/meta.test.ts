import { describe, it, expect } from "vitest";
import { buildFrontmatter, extractFrontmatterFields } from "@/core/utils";

describe("meta.ts helpers", () => {
  describe("buildFrontmatter and extractFrontmatterFields round-trip", () => {
    it("should round-trip simple metadata", () => {
      const original = {
        project_id: "abc-123",
        project_name: "Test Project",
        total_drafts: 2,
        target_word_count: 50000,
      };

      const frontmatter = buildFrontmatter(original);
      const lines = frontmatter.split("\n");
      const content = lines.slice(1, -1).join("\n"); // Remove --- delimiters
      const extracted = extractFrontmatterFields(content);

      expect(extracted.project_id).toBe(original.project_id);
      expect(extracted.project_name).toBe(original.project_name);
      expect(extracted.total_drafts).toBe(original.total_drafts);
      expect(extracted.target_word_count).toBe(original.target_word_count);
    });

    it("should round-trip metadata with special characters", () => {
      const original = {
        description: "A test: with colons",
        author: "John Doe",
      };

      const frontmatter = buildFrontmatter(original);
      const lines = frontmatter.split("\n");
      const content = lines.slice(1, -1).join("\n");
      const extracted = extractFrontmatterFields(content);

      expect(extracted.description).toBe(original.description);
      expect(extracted.author).toBe(original.author);
    });

    it("should handle ISO date strings", () => {
      const original = {
        date_created: "2024-01-15T10:30:00.000Z",
        date_updated: "2024-01-16T14:45:00.000Z",
      };

      const frontmatter = buildFrontmatter(original);
      const lines = frontmatter.split("\n");
      const content = lines.slice(1, -1).join("\n");
      const extracted = extractFrontmatterFields(content);

      expect(extracted.date_created).toBe(original.date_created);
      expect(extracted.date_updated).toBe(original.date_updated);
    });

    it("should preserve numeric types", () => {
      const original = {
        integer: 42,
        float: 3.14159,
        zero: 0,
        negative: -10,
      };

      const frontmatter = buildFrontmatter(original);
      const lines = frontmatter.split("\n");
      const content = lines.slice(1, -1).join("\n");
      const extracted = extractFrontmatterFields(content);

      expect(extracted.integer).toBe(42);
      expect(extracted.float).toBe(3.14159);
      expect(extracted.zero).toBe(0);
      expect(extracted.negative).toBe(-10);
    });
  });

  describe("frontmatter validation", () => {
    it("should validate basic frontmatter structure", () => {
      const frontmatter = buildFrontmatter({ key: "value" });

      expect(frontmatter.startsWith("---\n")).toBe(true);
      expect(frontmatter.endsWith("---")).toBe(true);
      expect(frontmatter.split("---").length).toBe(3); // start, content, end
    });

    it("should produce valid YAML-like format", () => {
      const fields = {
        version: "1.0.0",
        project_name: "My Project",
        total_drafts: 3,
      };

      const frontmatter = buildFrontmatter(fields);
      const lines = frontmatter.split("\n");

      // Should have opening ---, content lines, and closing ---
      expect(lines[0]).toBe("---");
      expect(lines[lines.length - 1]).toBe("---");

      // Content lines should be in format "key: value"
      const contentLines = lines.slice(1, -1).filter((l) => l.trim());
      for (const line of contentLines) {
        expect(line).toMatch(/^[a-zA-Z_][a-zA-Z0-9_-]*:\s*.+$/);
      }
    });
  });
});
