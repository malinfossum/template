/*
Reusable header/topbar for the starter template.
Keep markup helpers here, not business logic.
*/

function header() {
	return /* HTML */ `
    <header class="topbar">
      <div class="container cluster-between">
        <button
          class="brand brand-button"
          type="button"
          onclick="changePage('home')"
          aria-label="Go to home page"
        >
          ${model.ui.projectTitle}
        </button>

        <div class="cluster">
          <button class="btn btn-ghost" type="button" data-theme-toggle>
            ${model.ui.themeLabel}
          </button>
        </div>
      </div>
    </header>
  `;
}
