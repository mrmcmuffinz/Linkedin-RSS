import { describe, it, expect, beforeEach, afterEach } from "vitest";
import RSSParser from "rss-parser";
import nock from "nock";
import { mockRssXml } from "./fixtures/mock-responses.js";

describe("RSS Feed Parsing", () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it("should parse mocked RSS feed", async () => {
    nock("https://example.com")
      .get("/feed.xml")
      .reply(200, mockRssXml, { "Content-Type": "application/xml" });

    const parser = new RSSParser();
    const feed = await parser.parseURL("https://example.com/feed.xml");

    expect(feed.title).toBe("Posts on Home");
    expect(feed.items.length).toBe(1);
    expect(feed.items[0].title).toBe("KVM + Libvirt Setup Guide");
    expect(feed.items[0].link).toBe(
      "https://mrmcmuffinz.github.io/posts/kvm_libvirt_setup_guide/",
    );
  });

  it("should handle empty RSS feed", async () => {
    const emptyFeed = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Empty Feed</title>
  </channel>
</rss>`;

    nock("https://example.com")
      .get("/empty.xml")
      .reply(200, emptyFeed, { "Content-Type": "application/xml" });

    const parser = new RSSParser();
    const feed = await parser.parseURL("https://example.com/empty.xml");

    expect(feed.title).toBe("Empty Feed");
    expect(feed.items.length).toBe(0);
  });

  it("should handle malformed XML", async () => {
    nock("https://example.com")
      .get("/bad.xml")
      .reply(200, "Not valid XML", { "Content-Type": "text/plain" });

    const parser = new RSSParser();

    await expect(
      parser.parseURL("https://example.com/bad.xml"),
    ).rejects.toThrow();
  });

  it("should handle feed with multiple items", async () => {
    const multiItemFeed = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Post 1</title>
      <link>https://example.com/post1</link>
    </item>
    <item>
      <title>Post 2</title>
      <link>https://example.com/post2</link>
    </item>
    <item>
      <title>Post 3</title>
      <link>https://example.com/post3</link>
    </item>
  </channel>
</rss>`;

    nock("https://example.com").get("/multi.xml").reply(200, multiItemFeed);

    const parser = new RSSParser();
    const feed = await parser.parseURL("https://example.com/multi.xml");

    expect(feed.items.length).toBe(3);
    expect(feed.items[0].title).toBe("Post 1");
    expect(feed.items[1].title).toBe("Post 2");
    expect(feed.items[2].title).toBe("Post 3");
  });

  it("should parse feed with contentSnippet", async () => {
    nock("https://example.com").get("/feed.xml").reply(200, mockRssXml);

    const parser = new RSSParser();
    const feed = await parser.parseURL("https://example.com/feed.xml");

    expect(feed.items[0]).toHaveProperty("contentSnippet");
  });
});
