Storyboard.addScreen({
  id: "plant-detail",
  label: "Plant detail",
  states: ["default", "error"],
  note: "One plant's care view. Error state: the watering log failed to load.",
  render(state) {
    const back = `<button class="btn btn-ghost" data-goto="plants" type="button">Back to plants</button>`;
    const plant = DEMO_DATA.plants[1];
    const header = `
      <div class="stack stack-sm">
        <h2>${escapeHtml(plant.name)}</h2>
        <p class="text-muted">${escapeHtml(plant.species)} — watered ${escapeHtml(plant.lastWatered)}</p>
        <span class="badge badge-warning">Thirsty</span>
      </div>`;
    if (state === "error") {
      return `
        <div class="stack">
          ${back}
          ${header}
          <div class="alert alert-danger stack stack-sm">
            <strong>Couldn't load the watering log.</strong>
            <button class="btn btn-secondary" data-goto="plant-detail@default" type="button">Retry</button>
          </div>
        </div>`;
    }
    const log = DEMO_DATA.log
      .map((entry) => `<li><strong>${escapeHtml(entry.date)}</strong> — ${escapeHtml(entry.note)}</li>`)
      .join("");
    return `
      <div class="stack">
        ${back}
        ${header}
        <div class="card stack stack-sm">
          <strong>Watering log</strong>
          <ul class="stack stack-sm">${log}</ul>
          <button class="btn btn-primary" data-goto="plant-detail" type="button">Water now</button>
        </div>
      </div>`;
  },
});
