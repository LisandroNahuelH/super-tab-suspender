import { afterEach, describe, expect, it, vi } from "vitest";
import arCatalog from "../public/_locales/ar/messages.json";
import deCatalog from "../public/_locales/de/messages.json";
import enCatalog from "../public/_locales/en/messages.json";
import esCatalog from "../public/_locales/es/messages.json";
import jaCatalog from "../public/_locales/ja/messages.json";
import { createChromeI18nMock } from "./test-support/create-chrome-i18n-mock";
import { POPUP_HTML_FIXTURE } from "./test-support/popup-html-fixture";

const POPUP_LOCALE_CASES = [
  {
    locale: "en",
    catalog: enCatalog,
    dir: "ltr",
    eyebrow: "Extension controls",
    suspendButton: "Suspend this tab"
  },
  {
    locale: "es",
    catalog: esCatalog,
    dir: "ltr",
    eyebrow: "Controles de la extensión",
    suspendButton: "Suspender esta pestaña"
  },
  {
    locale: "de",
    catalog: deCatalog,
    dir: "ltr",
    eyebrow: "Erweiterungssteuerung",
    suspendButton: "Diesen Tab pausieren"
  },
  {
    locale: "ja",
    catalog: jaCatalog,
    dir: "ltr",
    eyebrow: "拡張機能の操作",
    suspendButton: "このタブを一時停止"
  },
  {
    locale: "ar",
    catalog: arCatalog,
    dir: "rtl",
    eyebrow: "عناصر تحكم الإضافة",
    suspendButton: "تعليق علامة التبويب هذه"
  }
] as const;

describe("popup i18n locales", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  for (const localeCase of POPUP_LOCALE_CASES) {
    it(`applies locale metadata and popup copy for ${localeCase.locale}`, async () => {
      document.body.innerHTML = POPUP_HTML_FIXTURE;

      vi.stubGlobal("chrome", {
        ...createChromeI18nMock(localeCase.catalog, localeCase.locale),
        tabs: {
          query: vi.fn(async () => [
            { url: "https://example.com", title: "Example page" }
          ])
        },
        storage: {
          local: {
            get: vi.fn(async () => ({})),
            set: vi.fn(async () => ({}))
          }
        },
        runtime: {
          sendMessage: vi.fn()
        }
      });

      await import("./popup");
      await Promise.resolve();

      expect(document.documentElement.lang).toBe(localeCase.locale);
      expect(document.documentElement.dir).toBe(localeCase.dir);
      expect(document.getElementById("suspendButton")?.textContent).toBe(
        localeCase.suspendButton
      );

      if (localeCase.locale !== "en") {
        expect(document.body.textContent).not.toContain("Extension controls");
        expect(document.body.textContent).not.toContain("Suspend this tab");
      }
    });
  }
});