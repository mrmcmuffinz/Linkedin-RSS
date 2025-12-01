import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import RSSParser from "rss-parser";
import { getLinkedinId, postShare } from "../src/index.js";
import {
  mockRssXml,
  mockLinkedInUserInfoResponse,
  mockLinkedInPostSuccess,
} from "./fixtures/mock-responses.js";

describe("Integration Tests", () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it("should complete full workflow: RSS → LinkedIn", async () => {
    // Mock RSS feed
    nock("https://mrmcmuffinz.github.io")
      .get("/posts/index.xml")
      .reply(200, mockRssXml, { "Content-Type": "application/xml" });

    // Mock LinkedIn userinfo
    nock("https://api.linkedin.com")
      .get("/v2/userinfo")
      .reply(200, mockLinkedInUserInfoResponse);

    // Mock LinkedIn post
    nock("https://api.linkedin.com")
      .post("/v2/shares")
      .reply(201, mockLinkedInPostSuccess);

    // Parse RSS
    const parser = new RSSParser();
    const feed = await parser.parseURL(
      "https://mrmcmuffinz.github.io/posts/index.xml",
    );

    expect(feed.items.length).toBeGreaterThan(0);
    expect(feed.items[0].title).toBeDefined();
    expect(feed.items[0].link).toBeDefined();

    // Get LinkedIn ID
    const userId = await getLinkedinId("test-token");
    expect(userId).toBe("2KIe48vP5c");

    // Post to LinkedIn
    const result = await postShare(
      "test-token",
      userId,
      feed.title,
      feed.items[0].title,
      feed.items[0].link,
      "https://example.com/image.jpg",
    );

    expect(result.status).toBe(201);
    expect(feed.title).toBe("Posts on Home");
  });

  it("should handle rate limiting", async () => {
    nock("https://api.linkedin.com").post("/v2/shares").reply(
      429,
      { message: "Rate limit exceeded" },
      {
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "1234567890",
      },
    );

    const result = await postShare(
      "test-token",
      "2KIe48vP5c",
      "Test",
      "Test",
      "https://example.com",
      "https://example.com/img.jpg",
    );

    expect(result.status).toBe(429);
  });
});
