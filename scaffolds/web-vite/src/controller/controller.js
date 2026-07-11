/* ======================================================================
   src/controller/controller.js — CONTROLLER
   Behavior: handles view actions, updates the model, owns any timers.
   Never writes HTML — that's the view's job.
   ====================================================================== */

export function createController({ model, view }) {
	function init() {
		model.subscribe((state) => view.render(state))

		view.bindActions({
			// actionName: (event, target) => { update model state, then model.notify() }
		})

		model.notify() // first render
	}

	return { init }
}
