const BioGraphNode = require("./biograph-node");

class EntityNode extends BioGraphNode{
    constructor(primaryId, entityType) {
        const data = { primaryId: `${primaryId}`, entityType };
        super('Entity', [entityType, `${primaryId}`], data);
    }
}

module.exports = EntityNode;