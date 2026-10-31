import { describe, expect, it } from "vitest";
import { appResourceUrl } from "@/lib/app-resource-url";

describe("same-origin application resources", () => {
  it("keeps root hosting unchanged", () => {
    expect(appResourceUrl("/cpp/worker.js", "")).toBe("/cpp/worker.js");
  });
  it("prefixes public resources once for a configured deployment", () => {
    const base = "/school/learn";
    expect(appResourceUrl("/python-worker.js", base)).toBe(
      `${base}/python-worker.js`,
    );
    expect(appResourceUrl("/python/0.29.3/", base)).toBe(
      `${base}/python/0.29.3/`,
    );
    expect(appResourceUrl(`${base}/cpp/worker.js`, base)).toBe(
      `${base}/cpp/worker.js`,
    );
    expect(appResourceUrl("/school/learning.js", base)).toBe(
      `${base}/school/learning.js`,
    );
  });
  it("rejects protocol-relative URLs", () => {
    expect(() => appResourceUrl("//elsewhere/worker.js", "/learn")).toThrow();
  });
});
