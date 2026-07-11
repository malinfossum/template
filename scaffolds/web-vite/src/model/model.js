/* ======================================================================
   src/model/model.js — MODEL
   State and data only. No DOM. No timers.
   Change state through methods here, then call notify() so the view
   re-renders.
   ====================================================================== */

export function createModel() {
	const subscribers = []

	const state = {
		// project state goes here
	}

	function subscribe(fn) {
		subscribers.push(fn)
	}

	function notify() {
		for (const fn of subscribers) fn(state)
	}

	return { subscribe, notify, state }
}
