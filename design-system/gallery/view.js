function createGalleryView(root) {
  const nav = root.querySelector("#gallery-nav");
  const panel = root.querySelector("#panel");

  return {
    renderNav(model) {
      const buttons = model
        .getSections()
        .map(
          (s) =>
            `<button class="nav-item" data-action="nav" data-id="${s.id}" type="button">${s.label}</button>`,
        )
        .join("");
      const links = GALLERY_LINKS.map(
        (l) => `<a class="nav-item" href="${l.href}">${l.label}</a>`,
      ).join("");
      nav.innerHTML = buttons + links;
      this.markActive(model);
    },
    markActive(model) {
      const activeId = model.getActive().id;
      nav.querySelectorAll("[data-action='nav']").forEach((el) => {
        el.setAttribute("aria-current", el.dataset.id === activeId ? "true" : "false");
      });
    },
    renderPanel(model) {
      panel.innerHTML = model.getActive().render();
      this.markActive(model);
    },
    bindNav(handler) {
      nav.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action='nav']");
        if (btn) handler(btn.dataset.id);
      });
    },
  };
}
