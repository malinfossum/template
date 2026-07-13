Storyboard.addScreen({
  id: "settings",
  label: "Settings",
  note: "App preferences — mock toggles.",
  render() {
    return `
      <div class="stack">
        <button class="btn btn-ghost" data-goto="plants" type="button">Back to plants</button>
        <div class="card stack stack-sm">
          <strong>Reminders</strong>
          <p class="text-muted">Notify me when a plant is thirsty.</p>
          <button class="btn btn-secondary" type="button" aria-pressed="true">On</button>
        </div>
        <div class="card stack stack-sm">
          <strong>Units</strong>
          <p class="text-muted">Water amounts in millilitres.</p>
          <button class="btn btn-secondary" type="button" aria-pressed="true">Metric</button>
        </div>
      </div>`;
  },
});
