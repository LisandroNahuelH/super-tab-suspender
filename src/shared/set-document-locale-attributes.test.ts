import { describe, expect, it } from "vitest";
import { setDocumentLocaleAttributes } from "./set-document-locale-attributes";

describe("setDocumentLocaleAttributes", () => {
  it("applies ltr metadata for English", () => {
    const result = setDocumentLocaleAttributes(document, "en");

    expect(result).toEqual({ lang: "en", dir: "ltr" });
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("applies rtl metadata for Arabic", () => {
    const result = setDocumentLocaleAttributes(document, "ar");

    expect(result).toEqual({ lang: "ar", dir: "rtl" });
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("applies rtl metadata for Hebrew", () => {
    setDocumentLocaleAttributes(document, "he");

    expect(document.documentElement.dir).toBe("rtl");
  });
});