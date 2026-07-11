/* ======================================================================
   src/view/view.js — VIEW
   Renders HTML from state and forwards user actions to the controller.
   No state mutation. No timers.
   Interactive elements carry a data-action attribute
   (e.g. <button data-action="add">); bindActions routes them by name.
   ====================================================================== */

export function createView(rootEl) {
	function render(_state) {
		rootEl.innerHTML = ""
		// build the UI from state here (rename _state to state when you use it)
	}

	// One delegated listener; handlers = { actionName: (event, target) => {} }
	function bindActions(handlers) {
		rootEl.addEventListener("click", (event) => {
			const target = event.target.closest("[data-action]")
			if (!target) return
			handlers[target.dataset.action]?.(event, target)
		})
	}

	return { render, bindActions }
}
