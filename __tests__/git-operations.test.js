import { describe, it, expect, beforeEach, vi } from "vitest";
import { pushPastFile } from "../src/index.js";
import * as exec from "@actions/exec";

vi.mock("@actions/exec");

describe("Git Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should configure git and push changes", async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      stdout: "M .lastPost.txt\n",
      stderr: "",
      exitCode: 0,
    });

    vi.mocked(exec.exec).mockResolvedValue(0);

    await pushPastFile(
      "/path/to/.lastPost.txt",
      "test@example.com",
      "Test User",
      "Update last post",
    );

    expect(exec.exec).toHaveBeenCalledWith("git", [
      "config",
      "user.email",
      "test@example.com",
    ]);
    expect(exec.exec).toHaveBeenCalledWith("git", [
      "config",
      "user.name",
      "Test User",
    ]);
    expect(exec.exec).toHaveBeenCalledWith("git", [
      "add",
      "/path/to/.lastPost.txt",
    ]);
    expect(exec.exec).toHaveBeenCalledWith("git", [
      "commit",
      "-m",
      "Update last post",
    ]);
    expect(exec.exec).toHaveBeenCalledWith("git", ["push"]);
  });

  it("should not commit when there are no changes", async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    await pushPastFile(
      "/path/to/.lastPost.txt",
      "test@example.com",
      "Test User",
      "Update last post",
    );

    expect(exec.exec).toHaveBeenCalledWith("git", [
      "config",
      "user.email",
      "test@example.com",
    ]);
    expect(exec.exec).toHaveBeenCalledWith("git", [
      "config",
      "user.name",
      "Test User",
    ]);
    expect(exec.exec).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining(["commit"]),
    );
  });

  it("should handle git push errors", async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      stdout: "M .lastPost.txt\n",
      stderr: "",
      exitCode: 0,
    });

    vi.mocked(exec.exec)
      .mockResolvedValueOnce(0) // config email
      .mockResolvedValueOnce(0) // config name
      .mockResolvedValueOnce(0) // add
      .mockResolvedValueOnce(0) // commit
      .mockRejectedValueOnce(new Error("Push failed")); // push fails

    await expect(
      pushPastFile(
        "/path/to/.lastPost.txt",
        "test@example.com",
        "Test User",
        "Update last post",
      ),
    ).rejects.toThrow("Push failed");
  });
});
