Storyboard.addScreen({
  id: "add-plant",
  label: "Add plant",
  note: "Mock form — fields are visual only; Save jumps to the populated list.",
  render() {
    return `
      <form class="stack" onsubmit="return false">
        <div class="field">
          <label class="label" for="frond-name">Name</label>
          <input class="input" id="frond-name" type="text" placeholder="e.g. Monstera" />
        </div>
        <div class="field">
          <label class="label" for="frond-species">Species</label>
          <input class="input" id="frond-species" type="text" placeholder="e.g. Monstera deliciosa" />
        </div>
        <div class="field">
          <label class="label" for="frond-interval">Watering interval</label>
          <select class="select" id="frond-interval">
            <option>Every 3 days</option>
            <option>Weekly</option>
            <option>Fortnightly</option>
          </select>
        </div>
        <div class="cluster cluster-sm">
          <button class="btn btn-primary" data-goto="plants@default" type="button">Save plant</button>
          <button class="btn btn-ghost" data-goto="plants" type="button">Cancel</button>
        </div>
      </form>`;
  },
});
