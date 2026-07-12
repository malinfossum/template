import { test } from "node:test";
import assert from "node:assert/strict";
import { loadScripts, plain } from "./storyboard-harness.mjs";

function freshRegistry() {
  const { evalIn } = loadScripts(["engine/registry.js"]);
  return {
    Storyboard: evalIn("Storyboard"),
    escapeHtml: evalIn("escapeHtml"),
    parseTarget: evalIn("parseTarget"),
    formatTarget: evalIn("formatTarget"),
  };
}

const SCREEN = (over = {}) => ({ id: "plants", label: "Plants", render: () => "<p>hi</p>", ...over });

test("addScreen registers and defaults states to ['default']", () => {
  const { Storyboard } = freshRegistry();
  Storyboard.addScreen(SCREEN());
  assert.equal(Storyboard.screens.length, 1);
  assert.deepEqual(plain(Storyboard.screens[0].states), ["default"]);
});

test("addScreen throws on duplicate id, bad id charset, empty states, missing render", () => {
  const { Storyboard } = freshRegistry();
  Storyboard.addScreen(SCREEN());
  assert.throws(() => Storyboard.addScreen(SCREEN()), /duplicate/);
  assert.throws(() => Storyboard.addScreen(SCREEN({ id: "Has Spaces" })), /\[a-z0-9-\]/);
  assert.throws(() => Storyboard.addScreen(SCREEN({ id: "a@b" })), /\[a-z0-9-\]/);
  assert.throws(() => Storyboard.addScreen(SCREEN({ id: "ok", states: [] })), /states/);
  assert.throws(() => Storyboard.addScreen(SCREEN({ id: "ok2", states: ["Bad State"] })), /\[a-z0-9-\]/);
  assert.throws(() => Storyboard.addScreen({ id: "ok3", label: "x" }), /render/);
});

test("addFlow validates start resolves against registered screens", () => {
  const { Storyboard } = freshRegistry();
  Storyboard.addScreen(SCREEN({ states: ["default", "empty"] }));
  Storyboard.addFlow({ id: "add-a-plant", label: "Add a plant", start: "plants@empty" });
  assert.equal(Storyboard.flows.length, 1);
  assert.throws(() => Storyboard.addFlow({ id: "bad", label: "x", start: "nope@default" }), /start/);
  assert.throws(() => Storyboard.addFlow({ id: "bad2", label: "x", start: "plants@nope" }), /start/);
  assert.throws(() => Storyboard.addFlow({ id: "add-a-plant", label: "dup", start: "plants" }), /duplicate/);
});

test("escapeHtml escapes the five specials", () => {
  const { escapeHtml } = freshRegistry();
  assert.equal(escapeHtml(`<img src="x" onerror='y'>&`), "&lt;img src=&quot;x&quot; onerror=&#39;y&#39;&gt;&amp;");
});

test("parseTarget / formatTarget round-trip", () => {
  const { parseTarget, formatTarget } = freshRegistry();
  assert.deepEqual(plain(parseTarget("plants@empty")), { screenId: "plants", stateId: "empty" });
  assert.deepEqual(plain(parseTarget("plants")), { screenId: "plants", stateId: null });
  assert.equal(parseTarget(""), null);
  assert.equal(parseTarget("a@b@c"), null);
  assert.equal(formatTarget({ screenId: "plants", stateId: "empty" }), "plants@empty");
});

function freshModel() {
  const { evalIn } = loadScripts(["engine/registry.js", "engine/model.js"]);
  const Storyboard = evalIn("Storyboard");
  Storyboard.addScreen({ id: "plants", label: "Plants", states: ["default", "empty"], render: () => "" });
  Storyboard.addScreen({ id: "settings", label: "Settings", render: () => "" });
  const createStoryboardModel = evalIn("createStoryboardModel");
  return createStoryboardModel(Storyboard.screens);
}

test("model resolves unknown state to the screen's first state, unknown screen to null", () => {
  const model = freshModel();
  assert.deepEqual(plain(model.resolve({ screenId: "plants", stateId: "empty" })), { screenId: "plants", stateId: "empty" });
  assert.deepEqual(plain(model.resolve({ screenId: "plants", stateId: "nope" })), { screenId: "plants", stateId: "default" });
  assert.deepEqual(plain(model.resolve({ screenId: "plants", stateId: null })), { screenId: "plants", stateId: "default" });
  assert.equal(model.resolve({ screenId: "nope", stateId: null }), null);
  assert.deepEqual(plain(model.fallback()), { screenId: "plants", stateId: "default" });
});

test("model setActive notifies subscribers, no-ops on same target, rejects unknown", () => {
  const model = freshModel();
  let calls = 0;
  model.subscribe(() => { calls += 1; });
  assert.equal(model.setActive({ screenId: "plants", stateId: "empty" }), true);
  assert.equal(calls, 1);
  assert.deepEqual(plain(model.getCurrent()), { screenId: "plants", stateId: "empty" });
  assert.equal(model.setActive({ screenId: "plants", stateId: "empty" }), true);
  assert.equal(calls, 1, "same target must not notify");
  assert.equal(model.setActive({ screenId: "nope", stateId: null }), false);
  assert.equal(calls, 1);
  assert.equal(model.getActiveScreen().label, "Plants");
});