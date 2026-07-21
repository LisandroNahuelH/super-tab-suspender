import {
  AUTO_SUSPEND_SETTINGS_KEYS,
  type AutoSuspendSettings,
  readAutoSuspendSettings
} from "./autoSuspendSettings";
import { getMessage } from "./shared/getMessage";

const SUSPEND_TAB_MENU_ID = "suspend-current-tab";
const SUSPENDABLE_URL_PATTERNS = ["http://*/*", "https://*/*"];
const STORAGE_KEY_PREFIX = "suspended-tab:";
const SUSPEND_ACTIVE_TAB_MESSAGE = "suspend-active-tab";
const PAGE_PROTECTION_STATE_MESSAGE = "page-protection-state";
const GET_PAGE_PROTECTION_STATE_MESSAGE = "get-page-protection-state";
const AUTO_SUSPEND_ALARM_NAME = "auto-suspend-check";
const AUTO_SUSPEND_ALARM_PERIOD_MINUTES = 1;
const TAB_ACTIVITY_STORAGE_KEY = "autoSuspend:lastActiveAtByTab";
const PAGE_STATE_STORAGE_KEY = "autoSuspend:pageProtectionStateByTab";

interface SuspendedTabRecord {
  originalUrl: string;
  title: string;
  faviconHost: string;
  suspendedAt: string;
  screenshotDataUrl?: string;
}

interface SuspendActiveTabMessage {
  type: typeof SUSPEND_ACTIVE_TAB_MESSAGE;
}

interface PageProtectionState {
  hasPlayingVideo: boolean;
  hasFilledForm: boolean;
}

interface StoredPageProtectionState extends PageProtectionState {
  updatedAt: number;
}

interface PageProtectionStateMessage extends PageProtectionState {
  type: typeof PAGE_PROTECTION_STATE_MESSAGE;
}

interface GetPageProtectionStateMessage {
  type: typeof GET_PAGE_PROTECTION_STATE_MESSAGE;
}

type RuntimeMessage = SuspendActiveTabMessage | PageProtectionStateMessage;
type TabActivityById = Record<string, number>;
type PageProtectionStateById = Record<string, StoredPageProtectionState>;

void initializeAutoSuspendRuntime();

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: SUSPEND_TAB_MENU_ID,
    title: getMessage("contextMenuSuspendTab"),
    contexts: ["page"],
    documentUrlPatterns: SUSPENDABLE_URL_PATTERNS
  });

  void initializeAutoSuspendRuntime();
});

chrome.runtime.onStartup.addListener(() => {
  void initializeAutoSuspendRuntime();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== SUSPEND_TAB_MENU_ID) {
    return;
  }

  void suspendTab(tab).catch((error: unknown) => {
    console.warn("Could not suspend the tab.", error);
  });
});

chrome.runtime.onMessage.addListener(
  (
    message: RuntimeMessage,
    sender,
    sendResponse: (response: { ok: boolean; error?: string }) => void
  ) => {
    if (message?.type === PAGE_PROTECTION_STATE_MESSAGE) {
      if (sender.tab?.id !== undefined) {
        void savePageProtectionState(sender.tab.id, message);
      }

      return false;
    }

    if (message?.type !== SUSPEND_ACTIVE_TAB_MESSAGE) {
      return false;
    }

    void suspendActiveTab()
      .then(() => {
        sendResponse({ ok: true });
      })
      .catch((error: unknown) => {
        console.warn("Could not suspend the active tab.", error);
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      });

    return true;
  }
);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== AUTO_SUSPEND_ALARM_NAME) {
    return;
  }

  void runAutoSuspendCheck().catch((error: unknown) => {
    console.warn("Could not run the auto-suspend check.", error);
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  if (AUTO_SUSPEND_SETTINGS_KEYS.some((key) => key in changes)) {
    void configureAutoSuspendAlarm();
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  void rememberTabActiveAt(activeInfo.tabId);
});

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id !== undefined) {
    void rememberTabActiveAt(tab.id, getTabActivityTimestamp(tab));
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void removeTabRuntimeState(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    void removePageProtectionState(tabId);
  }

  if (changeInfo.url || changeInfo.status === "loading" || changeInfo.status === "complete") {
    void rememberTabActiveAt(tabId, getTabActivityTimestamp(tab));
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }

  void rememberFocusedWindowActiveTab(windowId);
});

async function suspendActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  await suspendTab(tab);
}

async function suspendTab(
  tab?: chrome.tabs.Tab,
  options: { captureScreenshot: boolean } = { captureScreenshot: true }
): Promise<void> {
  if (!tab?.id || tab.windowId === undefined || !isSuspendableUrl(tab.url)) {
    return;
  }

  const record = await createSuspendedTabRecord(tab, options.captureScreenshot);
  const id = crypto.randomUUID();
  const stored = await saveSuspendedTabRecord(id, record);
  const suspendedUrl = stored
    ? chrome.runtime.getURL(`suspended.html?id=${encodeURIComponent(id)}`)
    : createFallbackSuspendedUrl(record);

  await chrome.tabs.update(tab.id, { url: suspendedUrl });
}

async function createSuspendedTabRecord(
  tab: chrome.tabs.Tab,
  captureScreenshot: boolean
): Promise<SuspendedTabRecord> {
  const originalUrl = tab.url ?? "";
  const faviconHost = getHostname(originalUrl);
  const screenshotDataUrl = captureScreenshot
    ? await captureVisibleTab(tab.windowId)
    : undefined;

  if (screenshotDataUrl) {
    console.info("Screenshot generated for the suspended tab.", {
      bytes: screenshotDataUrl.length
    });
  }

  return {
    originalUrl,
    title: tab.title?.trim() || originalUrl,
    faviconHost,
    suspendedAt: new Date().toISOString(),
    screenshotDataUrl
  };
}

async function captureVisibleTab(
  windowId: number
): Promise<string | undefined> {
  try {
    const screenshotDataUrl = await chrome.tabs.captureVisibleTab(windowId, {
      format: "jpeg",
      quality: 45
    });

    if (!screenshotDataUrl) {
      console.warn("The tab screenshot did not return data.");
      return undefined;
    }

    return screenshotDataUrl;
  } catch (error) {
    console.warn("Could not capture the tab before suspending it.", error);
    return undefined;
  }
}

async function saveSuspendedTabRecord(
  id: string,
  record: SuspendedTabRecord
): Promise<boolean> {
  const key = `${STORAGE_KEY_PREFIX}${id}`;

  try {
    await chrome.storage.local.set({ [key]: record });
    console.info(
      record.screenshotDataUrl
        ? "Suspended tab saved with a screenshot."
        : "Suspended tab saved without a screenshot."
    );
    return true;
  } catch (error) {
    console.warn("Could not save the screenshot. Retrying without the image.", error);
  }

  try {
    const { screenshotDataUrl: _screenshotDataUrl, ...recordWithoutScreenshot } =
      record;
    await chrome.storage.local.set({ [key]: recordWithoutScreenshot });
    console.info("Suspended tab saved without a screenshot after fallback.");
    return true;
  } catch (error) {
    console.warn("Could not save the suspended tab in storage.", error);
    return false;
  }
}

async function initializeAutoSuspendRuntime(): Promise<void> {
  await seedTabActivity();
  await configureAutoSuspendAlarm();
}

async function configureAutoSuspendAlarm(): Promise<void> {
  const settings = await readAutoSuspendSettings();

  if (!settings.autoSuspendEnabled) {
    await chrome.alarms.clear(AUTO_SUSPEND_ALARM_NAME);
    return;
  }

  await chrome.alarms.create(AUTO_SUSPEND_ALARM_NAME, {
    periodInMinutes: AUTO_SUSPEND_ALARM_PERIOD_MINUTES
  });
}

async function seedTabActivity(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  const activity = await readTabActivity();

  for (const tab of tabs) {
    if (tab.id === undefined) {
      continue;
    }

    activity[String(tab.id)] = tab.active ? now : getTabActivityTimestamp(tab);
  }

  await writeTabActivity(activity);
}

async function rememberFocusedWindowActiveTab(windowId: number): Promise<void> {
  const [tab] = await chrome.tabs.query({
    active: true,
    windowId
  });

  if (tab?.id !== undefined) {
    await rememberTabActiveAt(tab.id);
  }
}

async function rememberTabActiveAt(
  tabId: number,
  timestamp = Date.now()
): Promise<void> {
  const activity = await readTabActivity();
  activity[String(tabId)] = timestamp;
  await writeTabActivity(activity);
}

async function runAutoSuspendCheck(): Promise<void> {
  const settings = await readAutoSuspendSettings();

  if (!settings.autoSuspendEnabled) {
    await chrome.alarms.clear(AUTO_SUSPEND_ALARM_NAME);
    return;
  }

  const tabs = await chrome.tabs.query({});
  const activity = await readTabActivity();
  const now = Date.now();
  const idleThresholdMs = settings.autoSuspendMinutes * 60 * 1000;

  for (const tab of tabs) {
    if (!shouldConsiderTabForAutoSuspend(tab, settings)) {
      continue;
    }

    const tabId = tab.id;

    if (tabId === undefined) {
      continue;
    }

    const lastActiveAt = activity[String(tabId)] ?? getTabActivityTimestamp(tab);

    if (lastActiveAt === undefined) {
      await rememberTabActiveAt(tabId, now);
      continue;
    }

    if (now - lastActiveAt < idleThresholdMs) {
      continue;
    }

    if (await isProtectedByPageState(tabId, settings)) {
      continue;
    }

    await suspendTab(tab, { captureScreenshot: false });
    await removeTabRuntimeState(tabId);
  }
}

function shouldConsiderTabForAutoSuspend(
  tab: chrome.tabs.Tab,
  settings: AutoSuspendSettings
): boolean {
  if (tab.active || !isSuspendableUrl(tab.url)) {
    return false;
  }

  if (settings.protectedPinned && tab.pinned) {
    return false;
  }

  if (settings.protectedAudio && tab.audible) {
    return false;
  }

  return true;
}

async function isProtectedByPageState(
  tabId: number,
  settings: AutoSuspendSettings
): Promise<boolean> {
  if (!settings.protectedVideo && !settings.protectedForms) {
    return false;
  }

  const state =
    (await requestPageProtectionState(tabId)) ??
    (await readCachedPageProtectionState(tabId));

  if (!state) {
    return false;
  }

  return (
    (settings.protectedVideo && state.hasPlayingVideo) ||
    (settings.protectedForms && state.hasFilledForm)
  );
}

async function requestPageProtectionState(
  tabId: number
): Promise<PageProtectionState | undefined> {
  try {
    const response = (await chrome.tabs.sendMessage(tabId, {
      type: GET_PAGE_PROTECTION_STATE_MESSAGE
    } satisfies GetPageProtectionStateMessage)) as PageProtectionState | undefined;

    if (response) {
      await savePageProtectionState(tabId, response);
    }

    return response;
  } catch {
    return undefined;
  }
}

async function savePageProtectionState(
  tabId: number,
  state: PageProtectionState
): Promise<void> {
  const states = await readPageProtectionStates();
  states[String(tabId)] = {
    hasPlayingVideo: state.hasPlayingVideo,
    hasFilledForm: state.hasFilledForm,
    updatedAt: Date.now()
  };
  await writePageProtectionStates(states);
}

async function readCachedPageProtectionState(
  tabId: number
): Promise<PageProtectionState | undefined> {
  const states = await readPageProtectionStates();
  return states[String(tabId)];
}

async function removeTabRuntimeState(tabId: number): Promise<void> {
  const activity = await readTabActivity();
  delete activity[String(tabId)];
  await writeTabActivity(activity);
  await removePageProtectionState(tabId);
}

async function removePageProtectionState(tabId: number): Promise<void> {
  const states = await readPageProtectionStates();
  delete states[String(tabId)];
  await writePageProtectionStates(states);
}

async function readTabActivity(): Promise<TabActivityById> {
  return (await readSessionValue<TabActivityById>(TAB_ACTIVITY_STORAGE_KEY)) ?? {};
}

async function writeTabActivity(activity: TabActivityById): Promise<void> {
  await getSessionStorage().set({ [TAB_ACTIVITY_STORAGE_KEY]: activity });
}

async function readPageProtectionStates(): Promise<PageProtectionStateById> {
  return (
    (await readSessionValue<PageProtectionStateById>(PAGE_STATE_STORAGE_KEY)) ?? {}
  );
}

async function writePageProtectionStates(
  states: PageProtectionStateById
): Promise<void> {
  await getSessionStorage().set({ [PAGE_STATE_STORAGE_KEY]: states });
}

async function readSessionValue<TValue>(key: string): Promise<TValue | undefined> {
  const items = await getSessionStorage().get(key);
  return items[key] as TValue | undefined;
}

function getSessionStorage(): chrome.storage.StorageArea {
  return chrome.storage.session || chrome.storage.local;
}

function getTabActivityTimestamp(tab: chrome.tabs.Tab): number {
  return typeof tab.lastAccessed === "number" ? tab.lastAccessed : Date.now();
}

function createFallbackSuspendedUrl(record: SuspendedTabRecord): string {
  const params = new URLSearchParams({
    url: record.originalUrl,
    title: record.title,
    faviconHost: record.faviconHost,
    suspendedAt: record.suspendedAt
  });

  return chrome.runtime.getURL(`suspended.html?${params.toString()}`);
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function isSuspendableUrl(url?: string): boolean {
  return url?.startsWith("http://") === true || url?.startsWith("https://") === true;
}
