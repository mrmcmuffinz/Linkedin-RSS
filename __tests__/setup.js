import { vi } from "vitest";

// Mock @actions/core
vi.mock("@actions/core", () => ({
  getInput: vi.fn(() => ""),
  setFailed: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));

// Mock @actions/exec
vi.mock("@actions/exec", () => ({
  exec: vi.fn(),
  getExecOutput: vi.fn(() =>
    Promise.resolve({ stdout: "", stderr: "", exitCode: 0 }),
  ),
}));

// Set GITHUB_WORKSPACE for tests
process.env.GITHUB_WORKSPACE = process.cwd();
