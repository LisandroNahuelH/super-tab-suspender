export const POPUP_HTML_FIXTURE = `
<main class="popup-shell">
  <a class="p11-brand" data-role="p11-brand" href="https://www.premium11.com/" target="_blank" rel="noopener noreferrer">
    <img class="p11-brand__mark" src="/brand/premium11-mark.svg" alt="" width="28" height="28" />
    <span class="p11-brand__name"></span>
  </a>
  <section class="current-tab-card" data-role="current-tab">
    <div class="current-tab-row">
      <img class="current-tab-icon" id="currentTabIcon" alt="" />
      <h2 class="current-tab-title" id="currentTabTitle"></h2>
    </div>
    <p class="current-tab-url" id="currentTabUrl"></p>
  </section>
  <button class="suspend-button" id="suspendButton" type="button"></button>
  <p class="status-text" id="statusText" role="status"></p>
  <section class="auto-suspend-panel" data-role="auto-suspend">
    <div class="auto-suspend-row">
      <div>
        <h2 class="section-title" data-role="section-auto-suspend-title"></h2>
        <p class="section-copy" data-role="section-auto-suspend-copy"></p>
      </div>
      <label class="switch">
        <input id="autoSuspendToggle" type="checkbox" />
        <span class="sr-only" data-role="auto-suspend-toggle-label"></span>
      </label>
    </div>
    <label class="minutes-field" for="autoSuspendMinutes">
      <span data-role="minutes-after"></span>
      <input id="autoSuspendMinutes" type="number" min="1" max="1440" step="1" />
      <span data-role="minutes-unit"></span>
    </label>
    <div class="protection-group" data-role="protection-group">
      <p class="protection-label" data-role="protection-label"></p>
      <div class="protection-buttons">
        <button class="protection-button" id="protectPinnedButton" type="button" aria-pressed="true">
          <span data-role="protection-text"></span>
        </button>
        <button class="protection-button" id="protectAudioButton" type="button" aria-pressed="true">
          <span data-role="protection-text"></span>
        </button>
        <button class="protection-button" id="protectVideoButton" type="button" aria-pressed="true">
          <span data-role="protection-text"></span>
        </button>
        <button class="protection-button" id="protectFormsButton" type="button" aria-pressed="true">
          <span data-role="protection-text"></span>
        </button>
      </div>
    </div>
    <p class="auto-status-text" id="autoStatusText" role="status"></p>
  </section>
</main>
`;