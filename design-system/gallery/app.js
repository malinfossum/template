const galleryModel = createGalleryModel(GALLERY_SECTIONS);
const galleryView = createGalleryView(document);
createGalleryController(galleryModel, galleryView);

// Reusable tabs behavior: click a [role="tab"] to select it and show its panel.
document.addEventListener("click", (e) => {
  const tab = e.target.closest('[role="tab"]');
  if (!tab) return;
  const list = tab.closest('[role="tablist"]');
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const panels = [...list.parentElement.querySelectorAll('[role="tabpanel"]')];
  tabs.forEach((t, i) => {
    const selected = t === tab;
    t.setAttribute("aria-selected", String(selected));
    if (panels[i]) panels[i].hidden = !selected;
  });
});

// Demo nav-links: clicking moves the active state (a real app would navigate).
document.addEventListener("click", (e) => {
  const link = e.target.closest(".nav-link");
  if (!link) return;
  e.preventDefault();
  const list = link.closest(".nav-list");
  if (!list) return;
  list.querySelectorAll(".nav-link").forEach((l) => l.removeAttribute("aria-current"));
  link.setAttribute("aria-current", "page");
});
