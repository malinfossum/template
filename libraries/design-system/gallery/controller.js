function createGalleryController(model, view) {
  view.bindNav((id) => model.setActive(id));
  model.subscribe(() => view.renderPanel(model));
  view.renderNav(model);
  view.renderPanel(model);
}
