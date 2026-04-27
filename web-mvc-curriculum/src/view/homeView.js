/*
Home view = default starter page.
Replace this first when starting a new assignment/project.
*/

function homeView() {
	const sectionCards = model.data.sections
		.map(
			(section) => /* HTML */ `
        <article class="card stack panel-hover card-hover">
          <h3>${section.title}</h3>
          <p>${section.description}</p>
        </article>
      `,
		)
		.join("");

	return /* HTML */ `
    <section class="stack-xl">
      <section class="hero split">
        <div class="hero-copy stack-lg">
          <div class="stack">
            <p class="eyebrow">Malin pro starter</p>
            <h1>${model.ui.projectTitle}</h1>
            <p>${model.ui.projectTagline}</p>
          </div>

          <div class="cluster">
            <button class="btn btn-primary" type="button" onclick="setProjectDemoContent()">
              Load demo content
            </button>
            <button class="btn btn-secondary" type="button" onclick="resetStarterContent()">
              Reset starter
            </button>
          </div>
        </div>

        <aside class="card stack panel-hover">
          <span class="badge badge-accent">Standard ready</span>
          <div class="stat">
            <strong class="stat-value">MVC</strong>
            <span class="stat-label">Non-module curriculum structure with design-system classes</span>
          </div>
          <div class="progress" aria-label="Starter readiness">
            <span style="width: 100%"></span>
          </div>
          <p class="text-faint">Keep HTML in views, behavior in controller, and layout decisions inside the system.</p>
        </aside>
      </section>

      <section class="stack-lg">
        <div class="stack">
          <h2>How to use it</h2>
          <p>Change the title, update the model, replace the home view, and only add custom CSS when the design system is not enough.</p>
        </div>

        <div class="dashboard-grid">
          ${sectionCards}
        </div>
      </section>
    </section>
  `;
}
