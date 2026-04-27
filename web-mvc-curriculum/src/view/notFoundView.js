function notFoundView() {
	return /* HTML */ `
    <section class="empty-state center stack">
      <div class="card stack empty-state-card">
        <span class="badge">404</span>
        <h2>Page not found</h2>
        <p>The requested page does not exist in the current starter setup.</p>
        <div class="cluster cluster-center">
          <button class="btn btn-primary" type="button" onclick="changePage('home')">
            Back home
          </button>
        </div>
      </div>
    </section>
  `;
}
