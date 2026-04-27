/*
Malin Pro MVC Starter Template
- model = state only
- no DOM rendering here
- no timers here
*/

const model = {
	app: document.getElementById("app"),
	currentPage: "home",

	ui: {
		projectTitle: "Project",
		projectTagline:
			"A calm, reusable MVC starter with your design system built in.",
		themeLabel: "Toggle theme",
	},

	input: {},

	data: {
		sections: [
			{
				title: "MVC first",
				description:
					"Model holds state, view returns markup, controller handles behavior.",
			},
			{
				title: "Design system built in",
				description:
					"Tokens, primitives, components, and compositions are ready from day one.",
			},
			{
				title: "Project ready",
				description:
					"Replace starter content and keep the structure as your default baseline.",
			},
		],
	},
};
