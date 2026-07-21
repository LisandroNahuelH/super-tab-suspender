export const AUTO_SUSPEND_SETTINGS_KEYS = [
  "autoSuspendEnabled",
  "autoSuspendMinutes",
  "protectedPinned",
  "protectedAudio",
  "protectedVideo",
  "protectedForms"
] as const;

export type AutoSuspendSettingsKey =
  (typeof AUTO_SUSPEND_SETTINGS_KEYS)[number];

export interface AutoSuspendSettings {
  autoSuspendEnabled: boolean;
  autoSuspendMinutes: number;
  protectedPinned: boolean;
  protectedAudio: boolean;
  protectedVideo: boolean;
  protectedForms: boolean;
}

export const MIN_AUTO_SUSPEND_MINUTES = 1;
export const MAX_AUTO_SUSPEND_MINUTES = 1440;

export const DEFAULT_AUTO_SUSPEND_SETTINGS: AutoSuspendSettings = {
  autoSuspendEnabled: false,
  autoSuspendMinutes: 30,
  protectedPinned: true,
  protectedAudio: true,
  protectedVideo: true,
  protectedForms: true
};

export async function readAutoSuspendSettings(): Promise<AutoSuspendSettings> {
  const stored = await chrome.storage.local.get([...AUTO_SUSPEND_SETTINGS_KEYS]);
  return normalizeAutoSuspendSettings(stored);
}

export async function saveAutoSuspendSettings(
  update: Partial<AutoSuspendSettings>
): Promise<AutoSuspendSettings> {
  const nextSettings = normalizeAutoSuspendSettings({
    ...(await readAutoSuspendSettings()),
    ...update
  });

  await chrome.storage.local.set(nextSettings);
  return nextSettings;
}

export function normalizeAutoSuspendSettings(
  value: Partial<Record<AutoSuspendSettingsKey, unknown>>
): AutoSuspendSettings {
  return {
    autoSuspendEnabled: normalizeBoolean(
      value.autoSuspendEnabled,
      DEFAULT_AUTO_SUSPEND_SETTINGS.autoSuspendEnabled
    ),
    autoSuspendMinutes: normalizeMinutes(value.autoSuspendMinutes),
    protectedPinned: normalizeBoolean(
      value.protectedPinned,
      DEFAULT_AUTO_SUSPEND_SETTINGS.protectedPinned
    ),
    protectedAudio: normalizeBoolean(
      value.protectedAudio,
      DEFAULT_AUTO_SUSPEND_SETTINGS.protectedAudio
    ),
    protectedVideo: normalizeBoolean(
      value.protectedVideo,
      DEFAULT_AUTO_SUSPEND_SETTINGS.protectedVideo
    ),
    protectedForms: normalizeBoolean(
      value.protectedForms,
      DEFAULT_AUTO_SUSPEND_SETTINGS.protectedForms
    )
  };
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeMinutes(value: unknown): number {
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_AUTO_SUSPEND_SETTINGS.autoSuspendMinutes;
  }

  return Math.min(
    MAX_AUTO_SUSPEND_MINUTES,
    Math.max(MIN_AUTO_SUSPEND_MINUTES, Math.round(numericValue))
  );
}
