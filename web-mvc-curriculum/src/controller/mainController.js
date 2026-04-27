/*
Controller:
- handles behavior
- updates model
- calls updateView()
- no HTML here
*/

function changePage(newPage) {
	model.currentPage = newPage;
	updateView();
}

function setProjectDemoContent() {
	model.ui.projectTitle = "Project Demo";
	model.ui.projectTagline =
		"This is where you start shaping the real project content.";

	model.data.sections = [
		{
			title: "Update the model",
			description: "Add only the state the assignment actually needs.",
		},
		{
			title: "Replace the view",
			description:
				"Return semantic markup using primitives and components first.",
		},
		{
			title: "Keep controller clean",
			description:
				"Let controller coordinate user actions and state updates only.",
		},
	];

	updateView();
}

function resetStarterContent() {
	model.ui.projectTitle = "Project";
	model.ui.projectTagline =
		"A calm, reusable MVC starter with your design system built in.";

	model.data.sections = [
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
	];

	updateView();
}
