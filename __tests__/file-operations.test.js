import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { wasPostPublished } from "../src/index.js";
import { mockRssFeed } from "./fixtures/mock-responses.js";

describe("File Operations", () => {
  const testDir = path.join(process.cwd(), "__tests__", "temp");
  const testFile = path.join(testDir, ".lastPost.test.txt");

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Mock GITHUB_WORKSPACE
    process.env.GITHUB_WORKSPACE = process.cwd();
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  it("should create file if it does not exist", () => {
    expect(fs.existsSync(testFile)).toBe(false);

    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, "");

    expect(fs.existsSync(testFile)).toBe(true);
  });

  it("should write and read post URL", () => {
    const postUrl = "https://mrmcmuffinz.github.io/posts/test-post/";

    fs.writeFileSync(testFile, postUrl);
    const content = fs.readFileSync(testFile, "utf8");

    expect(content).toBe(postUrl);
  });

  it("should detect when post was already published", () => {
    const testPath = path.join(testDir, ".lastPost.test2.txt");
    fs.writeFileSync(testPath, mockRssFeed.items[0].link);

    const result = wasPostPublished(mockRssFeed, testPath);

    expect(result).toBe(true);

    // Cleanup
    fs.unlinkSync(testPath);
  });

  it("should detect new post", () => {
    const testPath = path.join(testDir, ".lastPost.test3.txt");
    fs.writeFileSync(testPath, "https://mrmcmuffinz.github.io/posts/old-post/");

    const result = wasPostPublished(mockRssFeed, testPath);

    expect(result).toBe(false);

    // Cleanup
    fs.unlinkSync(testPath);
  });

  it("should handle missing file gracefully", () => {
    const nonExistentFile = path.join(testDir, "does-not-exist.txt");

    expect(() => {
      try {
        fs.readFileSync(nonExistentFile, "utf8");
      } catch (error) {
        expect(error.code).toBe("ENOENT");
        throw error;
      }
    }).toThrow();
  });

  it("should create nested directories", () => {
    const nestedFile = path.join(testDir, "nested", "deep", ".lastPost.txt");

    fs.mkdirSync(path.dirname(nestedFile), { recursive: true });
    fs.writeFileSync(nestedFile, "test");

    expect(fs.existsSync(nestedFile)).toBe(true);

    // Cleanup
    fs.unlinkSync(nestedFile);
    fs.rmdirSync(path.join(testDir, "nested", "deep"));
    fs.rmdirSync(path.join(testDir, "nested"));
  });
});
