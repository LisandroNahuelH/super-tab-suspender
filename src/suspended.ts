import "./suspended.css";
import { getMessage } from "./shared/getMessage";
import { getUiLanguage } from "./shared/get-ui-language";
import { setDocumentLocaleAttributes } from "./shared/set-document-locale-attributes";

const STORAGE_KEY_PREFIX = "suspended-tab:";

interface SuspendedTabRecord {
  originalUrl: string;
  title: string;
  faviconHost: string;
  suspendedAt: string;
  screenshotDataUrl?: string;
}

const page = getRequiredElement<HTMLElement>("suspendedPage");
const backgroundPreview =
  getRequiredElement<HTMLDivElement>("backgroundPreview");
const siteIcon = getRequiredElement<HTMLImageElement>("siteIcon");
const pageTitle = getRequiredElement<HTMLHeadingElement>("pageTitle");
const pageUrl = getRequiredElement<HTMLParagraphElement>("pageUrl");
const suspendedAt = getRequiredElement<HTMLParagraphElement>("suspendedAt");
const restoreButton = getRequiredElement<HTMLButtonElement>("restoreButton");
let isRestoring = false;

void initializeSuspendedPage();

export function applySuspendedCopy(): void {
  document.title = getMessage("suspendedPageTitle");
  const stateLabel = document.querySelector<HTMLElement>('[data-role="state-label"]');
  stateLabel && (stateLabel.textContent = getMessage("suspendedStateLabel"));
  restoreButton.textContent = getMessage("restoreButton");
  pageTitle.textContent = getMessage("currentTabLoading");
}

async function initializeSuspendedPage(): Promise<void> {
  setDocumentLocaleAttributes();
  applySuspendedCopy();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const record = id ? await readStoredRecord(id) : readFallbackRecord(params);

  if (!record) {
    renderMissingRecord();
    return;
  }

  renderSuspendedRecord(record);
  const restore = () => {
    void restoreTab(record.originalUrl, id);
  };

  page.addEventListener("click", restore);
  restoreButton.addEventListener("click", (event) => {
    event.stopPropagation();
    restore();
  });
  page.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      restore();
    }
  });
  page.focus();
}

async function readStoredRecord(
  id: string
): Promise<SuspendedTabRecord | undefined> {
  const key = `${STORAGE_KEY_PREFIX}${id}`;
  const storedItems = await chrome.storage.local.get(key);
  return storedItems[key] as SuspendedTabRecord | undefined;
}

function readFallbackRecord(
  params: URLSearchParams
): SuspendedTabRecord | undefined {
  const originalUrl = params.get("url");
  const title = params.get("title");
  const faviconHost = params.get("faviconHost");
  const suspendedAtValue = params.get("suspendedAt");

  if (!originalUrl || !title || !suspendedAtValue) {
    return undefined;
  }

  return {
    originalUrl,
    title,
    faviconHost: faviconHost ?? "",
    suspendedAt: suspendedAtValue
  };
}

function renderSuspendedRecord(record: SuspendedTabRecord): void {
  document.title = getMessage("suspendedPageTitleWithName", record.title);
  page.classList.toggle("has-screenshot", Boolean(record.screenshotDataUrl));
  page.classList.toggle("no-screenshot", !record.screenshotDataUrl);
  pageTitle.textContent = record.title;
  pageUrl.textContent = record.originalUrl;
  suspendedAt.textContent = formatSuspendedAt(record.suspendedAt);

  if (record.faviconHost) {
    siteIcon.src = `https://icons.duckduckgo.com/ip3/${record.faviconHost}.ico`;
    siteIcon.hidden = false;
  } else {
    siteIcon.hidden = true;
  }

  if (record.screenshotDataUrl) {
    backgroundPreview.style.backgroundImage = `url("${record.screenshotDataUrl}")`;
    backgroundPreview.classList.add("has-preview");
  }
}

function renderMissingRecord(): void {
  document.title = getMessage("suspendedPageTitle");
  page.classList.add("is-missing");
  siteIcon.hidden = true;
  pageTitle.textContent = getMessage("suspendedMissingRecord");
  pageUrl.textContent = "";
  suspendedAt.textContent = "";
}

async function restoreTab(originalUrl: string, id: string | null): Promise<void> {
  if (isRestoring) {
    return;
  }

  if (!isSuspendableUrl(originalUrl)) {
    return;
  }

  isRestoring = true;
  page.classList.add("is-restoring");
  restoreButton.disabled = true;

  if (id) {
    try {
      await chrome.storage.local.remove(`${STORAGE_KEY_PREFIX}${id}`);
    } catch (error) {
      console.warn("Could not clear the suspended tab.", error);
    }
  }

  window.location.assign(originalUrl);
}

function formatSuspendedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${getMessage("suspendedOnPrefix")} ${new Intl.DateTimeFormat(getUiLanguage(), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date)}`;
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