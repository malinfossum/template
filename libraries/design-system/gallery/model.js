function createGalleryModel(sections) {
  let activeId = sections[0].id;
  const subscribers = [];
  return {
    getSections() {
      return sections;
    },
    getActive() {
      return sections.find((s) => s.id === activeId);
    },
    setActive(id) {
      if (!sections.some((s) => s.id === id)) return;
      activeId = id;
      subscribers.forEach((fn) => fn());
    },
    subscribe(fn) {
      subscribers.push(fn);
    },
  };
}
