export const SUSPENDED_HTML_FIXTURE = `
<main class="suspended-page" id="suspendedPage" tabindex="0">
  <div class="background-preview" id="backgroundPreview" aria-hidden="true"></div>
  <section class="suspended-panel" aria-live="polite">
    <div class="site-row">
      <img class="site-icon" id="siteIcon" alt="" />
      <div class="site-copy">
        <p class="state-label" data-role="state-label"></p>
        <h1 id="pageTitle"></h1>
      </div>
    </div>
    <p class="page-url" id="pageUrl"></p>
    <p class="suspended-at" id="suspendedAt"></p>
    <button class="restore-button" id="restoreButton" type="button"></button>
  </section>
</main>
`;