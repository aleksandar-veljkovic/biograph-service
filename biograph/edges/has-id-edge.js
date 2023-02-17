const CustomEdge = require("./custom-edge");

class HasIdEdge extends CustomEdge{
    constructor(entityId, identifierId) {
        super('HAS_ID', entityId, identifierId, 'Entity', 'Identifier', {});
    }
}

module.exports = HasIdEdge;