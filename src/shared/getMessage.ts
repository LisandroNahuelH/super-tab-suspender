import enMessages from "../../public/_locales/en/messages.json";

type MessageCatalog = Record<string, { message: string }>;

const FALLBACK_MESSAGES: Record<string, string> = Object.fromEntries(
  Object.entries(enMessages as MessageCatalog).map(([key, entry]) => [key, entry.message])
);

export function getMessage(key: string, substitutions?: string | string[]): string {
  try {
    const translated = globalThis.chrome?.i18n?.getMessage(key, substitutions);

    if (translated) {
      return translated;
    }
  } catch {
    return applyFallbackSubstitutions(FALLBACK_MESSAGES[key] ?? key, substitutions);
  }

  return applyFallbackSubstitutions(FALLBACK_MESSAGES[key] ?? key, substitutions);
}

function applyFallbackSubstitutions(
  message: string,
  substitutions?: string | string[]
): string {
  if (!substitutions) {
    return message;
  }

  const values = Array.isArray(substitutions) ? substitutions : [substitutions];

  return values.reduce<string>(
    (result, value, index) => result.replaceAll(`$${index + 1}`, value),
    message.replaceAll("$MINUTES$", values[0] ?? "").replaceAll("$TITLE$", values[0] ?? "")
  );
}