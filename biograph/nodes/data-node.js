const BioGraphNode = require("./biograph-node");
const utils = require('../../utils');

class DataNode extends BioGraphNode{
    constructor(source, content) {
        const data = { ...content, source };
        const dataHash = utils.sha3(JSON.stringify(data));

        super('Data', [dataHash], data);
    }
}

module.exports = DataNode;