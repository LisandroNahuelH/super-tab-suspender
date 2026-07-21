import { afterEach, describe, expect, it, vi } from "vitest";
import arCatalog from "../public/_locales/ar/messages.json";
import enCatalog from "../public/_locales/en/messages.json";
import esCatalog from "../public/_locales/es/messages.json";
import { createChromeI18nMock } from "./test-support/create-chrome-i18n-mock";
import { SUSPENDED_HTML_FIXTURE } from "./test-support/suspended-html-fixture";

const SUSPENDED_LOCALE_CASES = [
  {
    locale: "en",
    catalog: enCatalog,
    dir: "ltr",
    restoreButton: "Restore tab",
    missingRecord: "Could not find the information for this suspended tab"
  },
  {
    locale: "es",
    catalog: esCatalog,
    dir: "ltr",
    restoreButton: "Restaurar pestaña",
    missingRecord: "No se pudo encontrar la información de esta pestaña suspendida"
  },
  {
    locale: "ar",
    catalog: arCatalog,
    dir: "rtl",
    restoreButton: "استعادة علامة التبويب",
    missingRecord: "تعذّر العثور على معلومات علامة التبويب المعلّقة"
  }
] as const;

describe("suspended i18n locales", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
  });

  for (const localeCase of SUSPENDED_LOCALE_CASES) {
    it(`applies locale metadata and suspended copy for ${localeCase.locale}`, async () => {
      document.body.innerHTML = SUSPENDED_HTML_FIXTURE;

      vi.stubGlobal("chrome", {
        ...createChromeI18nMock(localeCase.catalog, localeCase.locale),
        storage: {
          local: {
            get: vi.fn(async () => ({})),
            remove: vi.fn(async () => ({}))
          }
        }
      });

      await import("./suspended");
      await Promise.resolve();

      expect(document.documentElement.lang).toBe(localeCase.locale);
      expect(document.documentElement.dir).toBe(localeCase.dir);
      expect(document.getElementById("restoreButton")?.textContent).toBe(
        localeCase.restoreButton
      );
      expect(document.getElementById("pageTitle")?.textContent).toBe(localeCase.missingRecord);
      expect(document.title).toBe(localeCase.catalog.suspendedPageTitle.message);
    });
  }
});