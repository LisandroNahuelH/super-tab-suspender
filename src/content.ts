const PAGE_PROTECTION_STATE_MESSAGE = "page-protection-state";
const GET_PAGE_PROTECTION_STATE_MESSAGE = "get-page-protection-state";
const REPORT_DEBOUNCE_MS = 250;

interface PageProtectionState {
  hasPlayingVideo: boolean;
  hasFilledForm: boolean;
}

interface PageProtectionStateMessage extends PageProtectionState {
  type: typeof PAGE_PROTECTION_STATE_MESSAGE;
}

interface GetPageProtectionStateMessage {
  type: typeof GET_PAGE_PROTECTION_STATE_MESSAGE;
}

let reportTimer: number | undefined;

chrome.runtime.onMessage.addListener(
  (
    message: GetPageProtectionStateMessage,
    _sender,
    sendResponse: (state: PageProtectionState) => void
  ) => {
    if (message?.type !== GET_PAGE_PROTECTION_STATE_MESSAGE) {
      return false;
    }

    sendResponse(getPageProtectionState());
    return false;
  }
);

queueProtectionStateReport();

document.addEventListener("input", queueProtectionStateReport, true);
document.addEventListener("change", queueProtectionStateReport, true);
document.addEventListener("play", queueProtectionStateReport, true);
document.addEventListener("pause", queueProtectionStateReport, true);
document.addEventListener("ended", queueProtectionStateReport, true);
document.addEventListener("emptied", queueProtectionStateReport, true);

function queueProtectionStateReport(): void {
  if (reportTimer !== undefined) {
    window.clearTimeout(reportTimer);
  }

  reportTimer = window.setTimeout(() => {
    reportTimer = undefined;
    void reportProtectionState();
  }, REPORT_DEBOUNCE_MS);
}

async function reportProtectionState(): Promise<void> {
  const state = getPageProtectionState();

  try {
    await chrome.runtime.sendMessage<PageProtectionStateMessage>({
      type: PAGE_PROTECTION_STATE_MESSAGE,
      ...state
    });
  } catch {
    // The service worker can be asleep or unavailable during page lifecycle edges.
  }
}

function getPageProtectionState(): PageProtectionState {
  return {
    hasPlayingVideo: hasPlayingVideo(),
    hasFilledForm: hasFilledForm()
  };
}

function hasPlayingVideo(): boolean {
  return Array.from(document.querySelectorAll("video")).some(
    (video) =>
      !video.paused &&
      !video.ended &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
  );
}

function hasFilledForm(): boolean {
  return (
    Array.from(document.querySelectorAll("input")).some(hasInputValue) ||
    Array.from(document.querySelectorAll("textarea")).some((textarea) =>
      hasTextValue(textarea.value)
    ) ||
    Array.from(document.querySelectorAll("select")).some((select) =>
      hasTextValue(select.value)
    ) ||
    Array.from(document.querySelectorAll("[contenteditable]")).some((element) =>
      hasTextValue(element.textContent ?? "")
    )
  );
}

function hasInputValue(input: HTMLInputElement): boolean {
  const ignoredTypes = new Set(["button", "hidden", "image", "reset", "submit"]);

  if (ignoredTypes.has(input.type)) {
    return false;
  }

  if (input.type === "checkbox" || input.type === "radio") {
    return input.checked;
  }

  return hasTextValue(input.value);
}

function hasTextValue(value: string): boolean {
  return value.trim().length > 0;
}
