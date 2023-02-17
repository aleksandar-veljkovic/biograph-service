const BioGraphEdge = require("./biograph-edge");
const utils = require('../../utils');

class CustomEdge extends BioGraphEdge{
    constructor(edgeType, fromNode, toNode, fromLabel, toLabel, content={}) {
        const data = { ...content };
        const dataHash = utils.sha3(JSON.stringify({ ...data, edgeType, fromNode, toNode }));

        super(edgeType, [dataHash], data, fromNode, toNode, fromLabel, toLabel);
    }
}

module.exports = CustomEdge;