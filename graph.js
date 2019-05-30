/* global d3 */
import { dispatchEvent } from "./util.js";

let NODE_COLOR = d => d.root ? "blue" : "red";
let RADIUS = 10; // TODO: make this dependent on the number of nodes?
let STRENGTH = -30; // TODO: this ought to be dependent on the provider
let COLLIDE = 20;

export default function renderGraph({ nodes, links }, root, width, height) {
	let svg = d3.select(root).append("svg").
		attr("viewBox", `0, 0, ${width}, ${height}`);

	let simulation = d3.forceSimulation(nodes).
		force("link", d3.forceLink(links).id(d => d.id)).
		force("charge", d3.forceManyBody().strength(STRENGTH)).
		force("center", d3.forceCenter(width / 2, height / 2)).
		force("collide", d3.forceCollide(COLLIDE));

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
		attr("r", RADIUS).
		attr("fill", NODE_COLOR).
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

	let el = svg.node();

	node.on("click", d => {
		dispatchEvent(el, "graph:selection", d, { bubbles: true });
	});

	return el;
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
