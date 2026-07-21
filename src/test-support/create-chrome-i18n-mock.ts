type MessageCatalog = Record<string, { message: string }>;

export function createChromeI18nMock(
  catalog: MessageCatalog,
  locale: string
): typeof chrome {
  return {
    i18n: {
      getMessage: (key: string, substitutions?: string | string[]) => {
        const template = catalog[key]?.message ?? "";
        if (!substitutions) {
          return template;
        }

        const values = Array.isArray(substitutions) ? substitutions : [substitutions];
        return values.reduce<string>(
          (result, value, index) => result.replaceAll(`$${index + 1}`, value),
          template.replaceAll("$MINUTES$", values[0] ?? "").replaceAll("$TITLE$", values[0] ?? "")
        );
      },
      getUILanguage: () => locale
    }
  } as typeof chrome;
}