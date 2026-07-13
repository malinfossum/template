Storyboard.addScreen({
  id: "plants",
  label: "Plants",
  states: ["default", "empty"],
  note: "Home screen. Empty state is the first-run experience.",
  render(state) {
    const toolbar = `
      <div class="cluster cluster-between">
        <button class="btn btn-primary" data-goto="add-plant" type="button">Add plant</button>
        <button class="btn btn-ghost" data-goto="settings" type="button">Settings</button>
      </div>`;
    if (state === "empty") {
      return `
        <div class="stack">
          ${toolbar}
          <div class="empty-state stack stack-sm">
            <strong>No plants yet.</strong>
            <p class="text-muted">Add your first plant and Frond will remind you when it's thirsty.</p>
            <button class="btn btn-primary" data-goto="add-plant" type="button">Add your first plant</button>
          </div>
        </div>`;
    }
    const cards = DEMO_DATA.plants
      .map(
        (p) => `
        <button class="card card-hover stack stack-sm" data-goto="plant-detail" type="button">
          <strong>${escapeHtml(p.name)}</strong>
          <span class="text-muted">${escapeHtml(p.species)}</span>
          <span class="cluster cluster-sm">
            <span class="badge ${p.thirsty ? "badge-warning" : "badge-success"}">${p.thirsty ? "Thirsty" : "Happy"}</span>
            <span class="text-muted">Watered ${escapeHtml(p.lastWatered)}</span>
          </span>
        </button>`,
      )
      .join("");
    return `<div class="stack">${toolbar}<div class="grid grid-2">${cards}</div></div>`;
  },
});
