export function getUiLanguage(): string {
  try {
    const locale = globalThis.chrome?.i18n?.getUILanguage?.();
    if (locale) {
      return locale;
    }
  } catch {
    /* Chrome i18n is unavailable in local tests. */
  }

  return globalThis.navigator?.language ?? "en";
}