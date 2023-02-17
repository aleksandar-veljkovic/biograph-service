const CustomEdge = require("./custom-edge");

class HasDataEdge extends CustomEdge{
    constructor(entityId, dataNodeId) {
        super('HAS_DATA', entityId, dataNodeId, 'Entity', 'Data', {});
    }
}

module.exports = HasDataEdge;