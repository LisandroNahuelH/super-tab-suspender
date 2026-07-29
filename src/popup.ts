import "./brand-fonts.css";
import "./popup.css";
import {
  MAX_AUTO_SUSPEND_MINUTES,
  MIN_AUTO_SUSPEND_MINUTES,
  type AutoSuspendSettings,
  readAutoSuspendSettings,
  saveAutoSuspendSettings
} from "./autoSuspendSettings";
import { getMessage } from "./shared/getMessage";
import { setDocumentLocaleAttributes } from "./shared/set-document-locale-attributes";
import { sendAnonymousHeartbeat } from "./features/heartbeat/send-anonymous-heartbeat";

const SUSPEND_ACTIVE_TAB_MESSAGE = "suspend-active-tab";
const FALLBACK_ICON_URL = "/icons/icon-32.png";

interface SuspendActiveTabResponse {
  ok: boolean;
  error?: string;
}

const suspendButton = getRequiredElement<HTMLButtonElement>("suspendButton");
const statusText = getRequiredElement<HTMLParagraphElement>("statusText");
const currentTabIcon =
  getRequiredElement<HTMLImageElement>("currentTabIcon");
const currentTabTitle =
  getRequiredElement<HTMLHeadingElement>("currentTabTitle");
const currentTabUrl = getRequiredElement<HTMLParagraphElement>("currentTabUrl");
const autoSuspendToggle =
  getRequiredElement<HTMLInputElement>("autoSuspendToggle");
const autoSuspendMinutes =
  getRequiredElement<HTMLInputElement>("autoSuspendMinutes");
const autoStatusText =
  getRequiredElement<HTMLParagraphElement>("autoStatusText");

const protectionControls = [
  {
    key: "protectedPinned",
    element: getRequiredElement<HTMLButtonElement>("protectPinnedButton"),
    labelKey: "protectPinned"
  },
  {
    key: "protectedAudio",
    element: getRequiredElement<HTMLButtonElement>("protectAudioButton"),
    labelKey: "protectAudio"
  },
  {
    key: "protectedVideo",
    element: getRequiredElement<HTMLButtonElement>("protectVideoButton"),
    labelKey: "protectVideo"
  },
  {
    key: "protectedForms",
    element: getRequiredElement<HTMLButtonElement>("protectFormsButton"),
    labelKey: "protectForms"
  }
] as const;

void initializePopup();

export function applyPopupCopy(): void {
  document.title = getMessage("popupPageTitle");

  const popupEyebrow = document.querySelector<HTMLElement>('[data-role="popup-eyebrow"]');
  const popupHeading = document.querySelector<HTMLElement>('[data-role="popup-heading"]');
  const currentTabSection = document.querySelector<HTMLElement>('[data-role="current-tab"]');
  const autoSuspendSection = document.querySelector<HTMLElement>('[data-role="auto-suspend"]');
  const autoSuspendToggleLabel = document.querySelector<HTMLElement>(
    '[data-role="auto-suspend-toggle-label"]'
  );
  const minutesAfterLabel = document.querySelector<HTMLElement>('[data-role="minutes-after"]');
  const minutesUnitLabel = document.querySelector<HTMLElement>('[data-role="minutes-unit"]');
  const protectionGroup = document.querySelector<HTMLElement>('[data-role="protection-group"]');
  const protectionLabel = document.querySelector<HTMLElement>('[data-role="protection-label"]');

  popupEyebrow && (popupEyebrow.textContent = getMessage("popupEyebrow"));
  popupHeading && (popupHeading.textContent = getMessage("extensionName"));
  const p11Brand = document.querySelector<HTMLElement>('[data-role="p11-brand"]');
  if (p11Brand) {
    const brandLabel = getMessage("openPremium11Website");
    p11Brand.setAttribute("aria-label", brandLabel);
    p11Brand.setAttribute("title", brandLabel);
  }
  currentTabSection?.setAttribute("aria-label", getMessage("currentTabAriaLabel"));
  autoSuspendSection?.setAttribute("aria-label", getMessage("automaticSuspensionAriaLabel"));
  autoSuspendToggleLabel &&
    (autoSuspendToggleLabel.textContent = getMessage("autoSuspendToggleSrOnly"));

  const sectionAutoSuspendTitle = document.querySelector<HTMLElement>(
    '[data-role="section-auto-suspend-title"]'
  );
  const sectionAutoSuspendCopy = document.querySelector<HTMLElement>(
    '[data-role="section-auto-suspend-copy"]'
  );
  sectionAutoSuspendTitle &&
    (sectionAutoSuspendTitle.textContent = getMessage("sectionAutoSuspendTitle"));
  sectionAutoSuspendCopy &&
    (sectionAutoSuspendCopy.textContent = getMessage("sectionAutoSuspendCopy"));

  minutesAfterLabel && (minutesAfterLabel.textContent = getMessage("minutesAfterLabel"));
  minutesUnitLabel && (minutesUnitLabel.textContent = getMessage("minutesUnitLabel"));
  protectionGroup?.setAttribute("aria-label", getMessage("protectedTabsAriaLabel"));
  protectionLabel && (protectionLabel.textContent = getMessage("protectionLabel"));

  for (const control of protectionControls) {
    const label = control.element.querySelector<HTMLElement>("[data-role='protection-text']");
    if (label) {
      label.textContent = getMessage(control.labelKey);
    }
  }

  suspendButton.textContent = getMessage("suspendButton");
  currentTabTitle.textContent = getMessage("currentTabLoading");
}

async function initializePopup(): Promise<void> {
  setDocumentLocaleAttributes();
  applyPopupCopy();
  void sendAnonymousHeartbeat("ping");

  const [activeTab] = await Promise.all([
    getActiveTab(),
    initializeAutoSuspendControls()
  ]);

  renderActiveTabInfo(activeTab);

  if (!isSuspendableUrl(activeTab?.url)) {
    suspendButton.disabled = true;
    statusText.textContent = getMessage("statusTabCannotSuspend");
    return;
  }

  statusText.textContent = "";
  suspendButton.disabled = false;
  suspendButton.addEventListener("click", () => {
    void suspendActiveTabFromPopup();
  });
}

async function initializeAutoSuspendControls(): Promise<void> {
  autoSuspendMinutes.min = String(MIN_AUTO_SUSPEND_MINUTES);
  autoSuspendMinutes.max = String(MAX_AUTO_SUSPEND_MINUTES);

  renderAutoSuspendSettings(await readAutoSuspendSettings());

  autoSuspendToggle.addEventListener("change", () => {
    void updateAutoSuspendSettings({
      autoSuspendEnabled: autoSuspendToggle.checked
    });
  });

  autoSuspendMinutes.addEventListener("change", () => {
    void saveMinutesInput();
  });

  autoSuspendMinutes.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      autoSuspendMinutes.blur();
    }
  });

  for (const control of protectionControls) {
    control.element.addEventListener("click", () => {
      const isPressed = control.element.getAttribute("aria-pressed") === "true";
      void updateAutoSuspendSettings({
        [control.key]: !isPressed
      });
    });
  }
}

async function saveMinutesInput(): Promise<void> {
  const value = autoSuspendMinutes.value.trim();

  if (!value) {
    autoStatusText.textContent = getMessage("statusMinutesInvalid");
    return;
  }

  await updateAutoSuspendSettings({
    autoSuspendMinutes: Number.parseFloat(value)
  });
}

async function updateAutoSuspendSettings(
  update: Partial<AutoSuspendSettings>
): Promise<void> {
  try {
    renderAutoSuspendSettings(await saveAutoSuspendSettings(update));
  } catch (error) {
    console.warn("Could not save auto-suspend settings.", error);
    autoStatusText.textContent = getMessage("statusSaveFailed");
  }
}

function renderAutoSuspendSettings(settings: AutoSuspendSettings): void {
  autoSuspendToggle.checked = settings.autoSuspendEnabled;
  autoSuspendMinutes.value = String(settings.autoSuspendMinutes);

  for (const control of protectionControls) {
    control.element.setAttribute("aria-pressed", String(settings[control.key]));
  }

  autoStatusText.textContent = settings.autoSuspendEnabled
    ? getMessage("statusAutoSuspendOn", String(settings.autoSuspendMinutes))
    : getMessage("statusAutoSuspendOff");
}

function renderActiveTabInfo(tab?: chrome.tabs.Tab): void {
  const url = tab?.url ?? "";
  const title = tab?.title?.trim() || url || getMessage("statusCurrentTab");
  const hostname = getHostname(url);

  currentTabTitle.textContent = title;
  currentTabUrl.textContent = url || getMessage("statusUrlUnavailable");
  currentTabUrl.title = url;

  if (hostname) {
    currentTabIcon.src = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } else {
    currentTabIcon.src = FALLBACK_ICON_URL;
  }

  currentTabIcon.addEventListener(
    "error",
    () => {
      currentTabIcon.src = FALLBACK_ICON_URL;
    },
    { once: true }
  );
}

async function suspendActiveTabFromPopup(): Promise<void> {
  suspendButton.disabled = true;
  suspendButton.textContent = getMessage("suspendButtonProgress");
  statusText.textContent = "";

  try {
    const response = await chrome.runtime.sendMessage<
      { type: typeof SUSPEND_ACTIVE_TAB_MESSAGE },
      SuspendActiveTabResponse
    >({
      type: SUSPEND_ACTIVE_TAB_MESSAGE
    });

    if (!response?.ok) {
      throw new Error(response?.error ?? getMessage("statusSuspendFailed"));
    }

    window.close();
  } catch (error) {
    console.warn("Could not suspend the tab from the popup.", error);
    suspendButton.disabled = false;
    suspendButton.textContent = getMessage("suspendButton");
    statusText.textContent = getMessage("statusSuspendFailed");
  }
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab;
}

function getRequiredElement<TElement extends HTMLElement>(id: string): TElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }

  return element as TElement;
}

function isSuspendableUrl(url?: string): boolean {
  return url?.startsWith("http://") === true || url?.startsWith("https://") === true;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}