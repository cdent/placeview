let LIT = "https://unpkg.com/lit-html@1.1.0/lit-html.js?module";
let MAX = 5; // TODO: configurable

export default class NodeDetails {
	constructor(root) {
		this._root = root;
		this._nodes = [];
		this.init();
	}

	async add(node) {
		await this._init;
		let nodes = this._nodes;

		let i = nodes.indexOf(node);
		if(i !== -1) { // avoid dupes
			nodes.splice(i, 1);
		}

		if(nodes.length === MAX) {
			nodes = nodes.slice(0, MAX - 1);
		}
		this._nodes = nodes = [node].concat(nodes);
		this.render(nodes);
	}

	async init() { // required for lazy loading
		this._init = load(LIT);
		let { html, render } = await this._init;

		let template = nodes => html`
<ul>
	${nodes.map(({ id, traits, resources }) => html`
		<li>
			<strong>ID:</strong> ${id}
			<div>
				<strong>Traits:</strong>
				${traits.length ? traits.join(", ") : "N/A"}
			</div>
			${Object.entries(resources).map(([type, { capacity, used }]) => html`
				<div>
					<strong>Resource:</strong> ${type}
					capacity=${capacity}
					used=${used}
				</div>
			`)}
		</li>
	`)}
</ul>
		`;

		this.render = params => render(template(params), this._root);
	}
}

function load(uri) { // workaround for ESLint limitation
	return import(uri);
}
