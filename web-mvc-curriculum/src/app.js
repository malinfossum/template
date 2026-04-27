/*
Render flow:
1. Controller changes model
2. updateView() runs
3. Correct view is rendered
*/

function createPage(page) {
	if (page === "home") return homeView();

	return notFoundView();
}

function updateView() {
	model.app.innerHTML = /* HTML */ `
    <div class="app-shell">
      ${header()}
      <main id="main" class="main-shell">
        <section class="container section">
          ${createPage(model.currentPage)}
        </section>
      </main>
    </div>
  `;
}

updateView();
