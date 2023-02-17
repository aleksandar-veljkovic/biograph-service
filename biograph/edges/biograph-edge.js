const Utils = require("../../utils");

class BioGraphEdge {
	constructor(type, path=[], data, fromNode, toNode, fromLabel, toLabel) {
		this.data = data;
		this.type = type;
		this.path = path;
        this.fromNode = fromNode;
		this.fromLabel = fromLabel;
        this.toNode = toNode;
		this.toLabel = toLabel;

		this.generateKey();

		this.representation = {
			path: `${this.type}/${this.path.join('/')}`,
            id: this.getKey(),
			label: this.type,
            fromNode: this.fromNode,
            toNode: this.toNode,
			fromLabel: this.fromLabel,
			toLabel: this.toLabel,
			data: {
                id: this.getKey(),
				...this.data,
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
module.exports = BioGraphEdge;