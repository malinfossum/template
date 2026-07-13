// Pure state — no DOM, no location. The controller owns both of those.

function createStoryboardModel(screens) {
  let current = null;
  const subscribers = [];

  function resolve(target) {
    const screen = screens.find((s) => s.id === target?.screenId);
    if (!screen) return null;
    const stateId = screen.states.includes(target.stateId) ? target.stateId : screen.states[0];
    return { screenId: screen.id, stateId };
  }

  return {
    getScreens() {
      return screens;
    },
    getCurrent() {
      return current;
    },
    getActiveScreen() {
      return screens.find((s) => s.id === current.screenId);
    },
    resolve,
    fallback() {
      return { screenId: screens[0].id, stateId: screens[0].states[0] };
    },
    setActive(target) {
      const next = resolve(target);
      if (!next) return false;
      if (current && current.screenId === next.screenId && current.stateId === next.stateId) return true;
      current = next;
      subscribers.forEach((fn) => fn());
      return true;
    },
    subscribe(fn) {
      subscribers.push(fn);
    },
  };
}
