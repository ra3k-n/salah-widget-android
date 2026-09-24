import { describe, expect, it } from "vitest";

import { copy, LANGUAGE_OPTIONS } from "../lib/i18n";

describe("app language support", () => {
  it("provides Arabic and English interface copy", () => {
    expect(copy.ar.settingsTitle).toBe("إعدادات المواقيت");
    expect(copy.en.settingsTitle).toBe("Prayer settings");
    expect(LANGUAGE_OPTIONS.map((item) => item.key)).toEqual(["ar", "en"]);
  });

  it("describes the battery saver behavior in both languages", () => {
    expect(copy.ar.energyOn).toContain("30 ثانية");
    expect(copy.en.energyOn).toContain("30 seconds");
  });
});
