const BioGraphNode = require("./biograph-node");

class ImportNode extends BioGraphNode{
    constructor(importId) {
        const data = { importId };
        super('Import', [importId], data);
    }
}

module.exports = ImportNode;