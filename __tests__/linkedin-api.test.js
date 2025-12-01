import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { getLinkedinId, postShare, _request } from "../src/index.js";
import {
  mockLinkedInUserInfoResponse,
  mockLinkedInMeResponse,
  mockLinkedInPostSuccess,
} from "./fixtures/mock-responses.js";

describe("LinkedIn API", () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe("Get LinkedIn User ID", () => {
    it("should get user ID from /v2/userinfo with sub field", async () => {
      nock("https://api.linkedin.com")
        .get("/v2/userinfo")
        .reply(200, mockLinkedInUserInfoResponse);

      const userId = await getLinkedinId("test-token");

      expect(userId).toBe("2KIe48vP5c");
    });

    it("should fallback to /v2/me when userinfo has no sub", async () => {
      nock("https://api.linkedin.com").get("/v2/userinfo").reply(200, {});

      nock("https://api.linkedin.com")
        .get("/v2/me")
        .reply(200, mockLinkedInMeResponse);

      const userId = await getLinkedinId("test-token");

      expect(userId).toBe("2KIe48vP5c");
    });

    it("should handle 401 unauthorized", async () => {
      nock("https://api.linkedin.com")
        .get("/v2/userinfo")
        .reply(401, { message: "Unauthorized" });

      await expect(getLinkedinId("invalid-token")).rejects.toThrow();
    });

    it("should handle network errors", async () => {
      nock("https://api.linkedin.com")
        .get("/v2/userinfo")
        .replyWithError("Network error");

      await expect(getLinkedinId("test-token")).rejects.toThrow();
    });

    it("should handle malformed JSON response", async () => {
      nock("https://api.linkedin.com")
        .get("/v2/userinfo")
        .reply(200, "not json");

      await expect(getLinkedinId("test-token")).rejects.toThrow();
    });
  });

  describe("Post to LinkedIn", () => {
    it("should successfully post with status 201", async () => {
      nock("https://api.linkedin.com")
        .post("/v2/shares")
        .reply(201, mockLinkedInPostSuccess);

      const result = await postShare(
        "test-token",
        "2KIe48vP5c",
        "Test Title",
        "Test post content",
        "https://example.com/post",
        "https://example.com/image.jpg",
      );

      expect(result.status).toBe(201);
      const data = JSON.parse(result.body);
      expect(data.id).toBe("7400775769544912896");
    });

    it("should handle 401 for invalid token", async () => {
      nock("https://api.linkedin.com")
        .post("/v2/shares")
        .reply(401, { message: "Invalid access token" });

      const result = await postShare(
        "invalid-token",
        "2KIe48vP5c",
        "Test",
        "Test",
        "https://example.com",
        "https://example.com/img.jpg",
      );

      expect(result.status).toBe(401);
    });

    it("should handle 500 server error", async () => {
      nock("https://api.linkedin.com")
        .post("/v2/shares")
        .reply(500, { message: "Internal Server Error" });

      const result = await postShare(
        "test-token",
        "2KIe48vP5c",
        "Test",
        "Test",
        "https://example.com",
        "https://example.com/img.jpg",
      );

      expect(result.status).toBe(500);
    });

    it("should include correct headers in post request", async () => {
      let capturedHeaders;

      nock("https://api.linkedin.com")
        .post("/v2/shares")
        .reply(function () {
          capturedHeaders = this.req.headers;
          return [201, mockLinkedInPostSuccess];
        });

      await postShare(
        "test-token",
        "2KIe48vP5c",
        "Test Title",
        "Test Content",
        "https://example.com/post",
        "https://example.com/image.jpg",
      );

      expect(capturedHeaders["authorization"]).toBe("Bearer test-token");
      expect(capturedHeaders["content-type"]).toBe("application/json");
      expect(capturedHeaders["x-restli-protocol-version"]).toBe("2.0.0");
    });
  });

  describe("HTTP Request Helper", () => {
    it("should make GET request successfully", async () => {
      nock("https://api.linkedin.com")
        .get("/test")
        .reply(200, { success: true });

      const response = await _request(
        "GET",
        "api.linkedin.com",
        "/test",
        {},
        "",
      );

      expect(response.status).toBe(200);
      expect(JSON.parse(response.body).success).toBe(true);
    });

    it("should make POST request successfully", async () => {
      nock("https://api.linkedin.com")
        .post("/test")
        .reply(201, { created: true });

      const response = await _request(
        "POST",
        "api.linkedin.com",
        "/test",
        { "Content-Type": "application/json" },
        JSON.stringify({ data: "test" }),
      );

      expect(response.status).toBe(201);
    });
  });
});
