import { describe, expect, it } from "vitest";
import { linkPlatform, normalizeLink } from "./linkPlatform";

describe("linkPlatform", () => {
  it("detects TikTok", () => {
    expect(linkPlatform("https://www.tiktok.com/@user/video/123")).toBe("tiktok");
    expect(linkPlatform("https://vm.tiktok.com/abc123")).toBe("tiktok");
  });

  it("detects YouTube, including the youtu.be short form", () => {
    expect(linkPlatform("https://www.youtube.com/watch?v=abc")).toBe("youtube");
    expect(linkPlatform("https://youtu.be/abc")).toBe("youtube");
    expect(linkPlatform("https://music.youtube.com/watch?v=abc")).toBe("youtube");
  });

  it("falls back to other for anything else, including unparseable input", () => {
    expect(linkPlatform("https://example.com/video")).toBe("other");
    expect(linkPlatform("not a url")).toBe("other");
  });
});

describe("normalizeLink", () => {
  it("adds https:// when the scheme is missing", () => {
    expect(normalizeLink("tiktok.com/@user/video/123")).toBe("https://tiktok.com/@user/video/123");
  });

  it("keeps an existing http(s) scheme as-is", () => {
    expect(normalizeLink("http://youtu.be/abc")).toBe("http://youtu.be/abc");
    expect(normalizeLink("https://youtu.be/abc")).toBe("https://youtu.be/abc");
  });

  it("rejects empty input and non-http(s) schemes", () => {
    expect(normalizeLink("")).toBeNull();
    expect(normalizeLink("   ")).toBeNull();
    expect(normalizeLink("javascript:alert(1)")).toBeNull();
    expect(normalizeLink("ftp://example.com/file")).toBeNull();
  });
});
