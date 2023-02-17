const Utils = require("../../utils");

class BioGraphNode {
	constructor(type, path=[], data) {
		this.data = data;
		this.type = type;
		this.path = path;

		this.generateKey();

		this.representation = {
			path: `${this.type}/${this.path.join('/')}`,
			id: this.getKey(),
			label: this.type,
			data: {
				...this.data,
				id: this.getKey(),
			},
		};
	}

	generateKey() {
		this._key = Utils.sha3(`${this.type}/${this.path.join('/')}`);
	}

	getObj() {
		return this.representation;
	}

	getKey() {
		return this._key;
	}
}
module.exports = BioGraphNode;