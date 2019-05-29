/* eslint-env browser */
/* global d3 */
import renderGraph from "./graph.js";

class PlacementGraph extends HTMLElement {
	connectedCallback() {
		this.update();
		this.addEventListener("change", this.update);
	}

	update() {
		let headers = {
			Accept: "application/json"
		};
		let { auth } = this;
		if(auth) {
			headers["OpenStack-API-Version"] = "placement latest";
			headers["X-Auth-Token"] = auth;
		}

		this.setAttribute("aria-busy", "true");
		let reset = () => this.removeAttribute("aria-busy");
		d3.json(this.uri, { headers }).
			then(({ provider_summaries }) => { // eslint-disable-line camelcase
				reset();
				let data = transform(provider_summaries);
				this.render(data);
			}, err => { // eslint-disable-line handle-callback-err
				reset();
			});
	}

	render({ nodes, links }) {
		let { _graph } = this;
		if(_graph) {
			_graph.remove();
		}

		let width = this.getAttribute("width");
		let height = this.getAttribute("height");
		this._graph = renderGraph({ nodes, links }, this, width, height);
	}

	get uri() {
		return this.querySelector("input[name=uri]").value;
	}

	get auth() {
		return this.querySelector("input[name=auth]").value;
	}
}

customElements.define("placement-graph", PlacementGraph);

function transform(data) {
	let nodes = [];
	let links = [];
	Object.entries(data).forEach(([id, // eslint-disable-next-line indent
			{ parent_provider_uuid: parentID, traits, resources }]) => {
		let node = { id, resources, traits };
		if(parentID) {
			links.push({ source: parentID, target: id });
		} else {
			node.root = true;
		}
		nodes.push(node);
	});
	return { nodes, links };
}
