/* ======================================================================
   src/app.js — APP WIRING
   Connects model, view, and controller. Rarely edited — day-to-day work
   happens in src/model, src/view, and src/controller.
   ====================================================================== */

import { createController } from "./controller/controller.js"
import { createModel } from "./model/model.js"
import { createView } from "./view/view.js"

export function createApp() {
	// If you rename the root element in index.html, update it here once.
	const root = document.getElementById("main")
	if (!root) throw new Error("Missing #main element in index.html")

	const model = createModel()
	const view = createView(root)
	const controller = createController({ model, view })

	controller.init()
}
