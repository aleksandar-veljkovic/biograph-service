const neo4j = require('neo4j-driver');
const { session } = require('neo4j-driver');
const utils = require('../../utils');
const { Parser } = require('@json2csv/plainjs');
const fs = require('fs');
const path = require('path');


class DB {
    constructor(config) {
        console.log(__dirname);
        this.dbConfig = config.db;
        const { host, port, username, password } = this.dbConfig;
        this.driver = neo4j.driver(
            `${host}:${port}`, 
            neo4j.auth.basic(username, password),{encrypted:false});
        this.nodes = [];
        this.nodeFields = {};
        this.edges = [];
        this.edgeFields = {};
    }

    disconnect() {
        this.driver.close();
    }

    connect() {
        return new Promise((resolve, reject) => {
            // resolve();
            this.driver.verifyConnectivity()
                .then(() => {
                    const session = this.createWriteSession();
                    const tx = session.beginTransaction();
                    const labels = ['Entity', 'Identifier', 'Data'];

                    const constraintPromises = labels.map(label => {
                        tx.run(`
                            CREATE CONSTRAINT ${label}_node_id IF NOT EXISTS ON (n:${label}) ASSERT n.id IS UNIQUE
                        `)
                    })

                        Promise.all(constraintPromises).then(() => {
                            tx.commit().then(() => {
                                session.close();
                                resolve();
                            }).catch(err => {console.log(err); reject(err)})
                    })
                })
                .catch((err) => reject(err))
        })
    }

    createWriteSession() {
        return this.driver.session({
            defaultAccessMode: session.WRITE,
            database: this.dbConfig.database,
        })
    }

    createReadSession() {
        return this.driver.session({
            defaultAccessMode: session.READ,
            database: this.dbConfig.database,
        })
    }

    async createNode(tx, { label, data }) {
        // const query = `CREATE (n:${label}${data.entityType ? `:${data.entityType}` : ''} { ${utils.prepareFields(data)} }) RETURN 0`
        // const params = { ...data};
        // await tx.run(query, params);
        this.nodes.push({ label, ...data});
        const newFields = ['label', ...Object.keys(data)];

        let nodeLabel = label;
        if (nodeLabel == 'Entity') {
            nodeLabel = data.entityType;
        }

        if (this.nodeFields[nodeLabel] == null) {
            this.nodeFields[nodeLabel] = new Set();
        }
        for(const field of newFields) {
            this.nodeFields[nodeLabel].add(field);
        }
        // return res.records[0].get('id').toNumber();
    }

    async createEdge(tx, { label, fromNode, fromLabel, toNode, toLabel, data }) {
        // const query = `
        //     MATCH (a:${fromLabel}), (b:${toLabel}) 
        //     WHERE a.id = $fromNode AND b.id = $toNode 
        //     CREATE (a)-[r:${label} { ${utils.prepareFields(data)} }]->(b) RETURN 0`;
        // const params = { fromNode, toNode, ...data};
        // await tx.run(query, params);
        this.edges.push({ label, fromNode, fromLabel, toNode, toLabel, ...data })
        const newFields = ['label', 'fromNode', 'fromLabel', 'toNode', 'toLabel', ...Object.keys(data)];


        if (this.edgeFields[label] == null) {
            this.edgeFields[label] = new Set();
        }
        for(const field of newFields) {
            this.edgeFields[label].add(field);
        }
        // return res.records[0].get('id').toNumber();
    }

    async write(tx) {
        const dir = this.dbConfig.homePath + '/import';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        const nodesOutput = (dir + '/nodes.tmp.csv').split('\\').join('/');
        const edgesOutput = (dir + '/edges.tmp.csv').split('\\').join('/');
        
        console.log(Object.keys(this.nodeFields));

        for (const nodeLabel of Object.keys(this.nodeFields)) {
            const parser = new Parser({ fields: [...this.nodeFields[nodeLabel]]});
            const filteredNodes = this.nodes.filter(node => node.label == nodeLabel || node.entityType == nodeLabel);
            if (filteredNodes.length == 0) { continue; }
            const csv = parser.parse(filteredNodes);
            
            fs.writeFileSync(nodesOutput, csv);

            const insertNodesQuery = `
            LOAD CSV WITH HEADERS FROM 'file:///nodes.tmp.csv' AS row
            MERGE  (n:${nodeLabel}${nodeLabel != 'Data' && nodeLabel != 'Identifier' ? ':Entity' : ''} { id: row.id })
            ${[...this.nodeFields[nodeLabel]].filter(field => !(['label', 'id'].includes(field))).map(field => `ON CREATE SET n.${field} = row.${field}`).join('\n')}
            `;
            // console.log(insertNodesQuery);
            await tx.run(insertNodesQuery);
        }

        for (const edgeLabel of Object.keys(this.edgeFields)) {
            const parser = new Parser({ fields: [...this.edgeFields[edgeLabel]]});

            const filteredEdges = this.edges.filter(edge => edge.label == edgeLabel);
            if (filteredEdges.length == 0) { continue; }
            const csv = parser.parse(filteredEdges);
            
            fs.writeFileSync(edgesOutput, csv);

            const fromLabel = 'Entity';
            let toLabel = 'Entity';
            
            if (edgeLabel == 'HAS_DATA') {
                toLabel = 'Data';
            }

            if (edgeLabel == 'HAS_ID') {
                toLabel = 'Identifier';
            }

            const insertEdgesQuery = `
            LOAD CSV WITH HEADERS FROM 'file:///edges.tmp.csv' AS row
            MATCH (a:${fromLabel}), (b:${toLabel}) 
            WHERE a.id = row.fromNode AND b.id = row.toNode 
            MERGE  (a)-[r:${edgeLabel} { id: row.id }]->(b)
            ${[...this.edgeFields[edgeLabel]].filter(field => !(['label', 'fromNode', 'toNode', 'fromLabel', 'toLabel', 'id'].includes(field))).map(field => `ON CREATE SET r.${field} = row.${field}`).join('\n')}`;
            
            await tx.run(insertEdgesQuery);
        }
        

        this.nodes = [];
        this.nodeFields = {};
        this.edges = [];
        this.edgeFields = {};
    }
}

module.exports = DB;