const utils = require("../../utils");
const BioGraphNode = require("./biograph-node");


class IdentifierNode extends BioGraphNode{
    constructor(identifierType, identifierTitle, identifierValue) {
        const data = { 
            title: identifierTitle, 
            type: identifierType,
            value: `${identifierValue}`,
            valueHash: utils.sha3(`${identifierValue}`),
        };

        super('Identifier', [identifierType, identifierTitle, identifierValue], data);
    }
}

module.exports = IdentifierNode;