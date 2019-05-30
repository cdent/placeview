/* eslint-env browser */

// adapted from uitil
export function dispatchEvent(emitter, name, payload, { bubbles } = {}) {
	let options = {};
	if(payload) {
		options.detail = payload;
	}
	if(bubbles) {
		options.bubbles = true;
	}
	let ev = new CustomEvent(name, options);
	emitter.dispatchEvent(ev);
}
