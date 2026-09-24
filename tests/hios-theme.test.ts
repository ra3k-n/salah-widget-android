import { describe, expect, it } from "vitest";

import { getHiOSTheme } from "../lib/hios-theme";

describe("HiOS theme palette", () => {
  it("returns a readable dark palette", () => {
    const theme = getHiOSTheme("dark");
    expect(theme.isDark).toBe(true);
    expect(theme.background).toBe("#211c23");
    expect(theme.foreground).toBe("#fffaf4");
  });

  it("returns a readable light palette", () => {
    const theme = getHiOSTheme("light");
    expect(theme.isDark).toBe(false);
    expect(theme.background).toBe("#f4eee8");
    expect(theme.foreground).toBe("#2c2529");
  });
});
