/* eslint-env browser */
/* global d3 */

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

let nodeColor = d => d.root ? "blue" : "red";
let radius = 10; // TODO: make this dependent on the number of nodes?
let strength = -30; // TODO: this ought to be dependent on the provider
let collide = 20;

function renderGraph({ nodes, links }, root, width, height) {
	let svg = d3.select(root).append("svg").
		attr("viewBox", `0, 0, ${width}, ${height}`).
		attr("width", width).
		attr("height", height);

	let simulation = d3.forceSimulation(nodes).
		force("link", d3.forceLink(links).id(d => d.id)).
		force("charge", d3.forceManyBody().strength(strength)).
		force("center", d3.forceCenter(width / 2, height / 2)).
		force("collide", d3.forceCollide(collide));

	let link = svg.append("g").
		attr("stroke", "#999").
		attr("stroke-opacity", 0.6).
		selectAll("line").
		data(links).
		join("line").
		attr("stroke-width", "1");

	let node = svg.append("g").
		attr("stroke", "#fff").
		attr("stroke-width", 1.5).
		selectAll("circle").
		data(nodes).
		join("circle").
		attr("r", radius).
		attr("fill", nodeColor).
		call(drag(simulation));

	node.append("title").
		text(d => d.id);

	simulation.on("tick", () => {
		link.
			attr("x1", d => d.source.x).
			attr("y1", d => d.source.y).
			attr("x2", d => d.target.x).
			attr("y2", d => d.target.y);

		node.
			attr("cx", d => d.x).
			attr("cy", d => d.y);
	});

	let tip;
	node.on("click", d => {
		if(tip) {
			tip.remove();
		}

		tip = svg.append("g").
			attr("transform", `translate(${d.x}, ${d.y})`);

		let rect = tip.append("rect").
			style("fill", "white").
			style("stroke", "steelblue");

		tip.append("text").
			text("Id: " + d.id).
			attr("dy", "1em").
			attr("x", 5);

		tip.append("text").
			text("Traits: " + d.traits).
			attr("dy", "2em").
			attr("x", 5);

		let delta = 3;
		Object.entries(d.resources).forEach(([resourceClass, { capacity, used }]) => {
			tip.append("text").
				text(`Resource: ${resourceClass} capacity: ${capacity} used: ${used}`).
				attr("dy", `${delta}em`).
				attr("x", 5);
			delta += 1;
		});

		let bbox = tip.node().getBBox();
		rect.attr("width", bbox.width + 5).
			attr("height", bbox.height + 5);

		// TODO: when clicking on box, it ought to go away
	});

	return svg.node();
}

function drag(simulation) {
	function dragstarted(d) {
		if(!d3.event.active) {
			simulation.alphaTarget(0.3).restart();
		}
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	function dragended(d) {
		if(!d3.event.active) {
			simulation.alphaTarget(0);
		}
		d.fx = null;
		d.fy = null;
	}

	return d3.drag().
		on("start", dragstarted).
		on("drag", dragged).
		on("end", dragended);
}

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
