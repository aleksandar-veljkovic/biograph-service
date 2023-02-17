const CustomEdge = require("./custom-edge");

class FromImportEdge extends CustomEdge{
    constructor(nodeId, importNodeId) {
        super('FROM_IMPORT', nodeId, importNodeId, {});
    }
}

module.exports = FromImportEdge;