const { sha3_256: sha3256 } = require('js-sha3');
const { v4: uuidv4 } = require('uuid');

function isInt(n){
    return Number(n) === n && n % 1 === 0;
}

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}

function joinPath(path) {
    const graph = {};
    // console.log(path);

    for (const segment of path) {
        const { from, to, relationship } = segment;

        if (relationship == null) {
            graph[from] = { edges: [], node: from, relations: 0}
        } else {

            if (graph[from.id] == null) {
                graph[from.id] = { edges: [], node: from, numRelations: 0 };
            }
            
            graph[from.id].numRelations += 1;
            graph[from.id].edges.push({ from: from.id, to: to.id, relationship });

            if (graph[to.id] == null) {
                graph[to.id] = { edges: [], node: to, numRelations: 0 };
            }

            graph[to.id].numRelations += 1;
            graph[to.id].edges.push({ from: to.id, to: from.id, relationship });
        }
    }

    const start = Object.keys(graph).map(nodeId => graph[nodeId]).find(el => el.numRelations == 1);
    let startNode = null;

    if (start == null) {
        if (Object.values(graph).length == 1) {
            return [[Object.values(graph).length > 0 ? Object.values(graph)[0].node : []]];
        } else {
            startNode = Object.values(graph)[0].node;
        }
    } else {
        startNode = graph[start.node.id].node;
    }

    

    const branches = [[]];
    let currentBranchIndex = 0;
    const visited = {};
    const stack = [startNode];

    while (stack.length > 0){
        const currentNode = stack[stack.length - 1];
        const wasVisited = visited[currentNode.id];

        if (!visited[currentNode.id]) {
            branches[currentBranchIndex].push(currentNode);
        }

        visited[currentNode.id] = true;
        const neighborEdges = graph[currentNode.id].edges.filter(e => !visited[e.relationship.properties.id] && e.to != currentNode.id);
        // console.log(neighborEdges);

        if (neighborEdges.length > 0) {
            if (wasVisited) {
                branches[currentBranchIndex].push(currentNode);
            }

            const nextEdge = neighborEdges[0];
            branches[currentBranchIndex].push(nextEdge);
            visited[nextEdge.relationship.properties.id] = true;
            
            if (visited[nextEdge.to]) {
                branches[currentBranchIndex].push(graph[nextEdge.to].node);
                branches.push([])
                currentBranchIndex += 1;
            } else {
                const nextNode = graph[nextEdge.to].node;
                stack.push(nextNode);
            }
            
        } else {
            branches.push([])
            currentBranchIndex += 1;
            stack.pop();
        }
    }

    return branches.filter(branch => branch.length > 0);
}

module.exports = {
    isInt,
    isFloat,
    generateId: () => uuidv4(),
    sha3: (message) => sha3256(message),
    prepareFields: (data) => {
        if (data == null) {
            return null;
        }
        
        const parts = [];

        for (const key of Object.keys(data)) {
            if (data[key] != null) {
                parts.push(`${key}: $${key}`);
            }
        }

        return parts.join(',')
    },
    prepareQuery: (match, params) => {
        const objectTypes = {};
        const edgeTypes = {};

        // Process match segment
        const matchClauses = match.map(clause => ({ shouldReturn: true, value: clause }));
        const regex = /([\w_\d])+:([\w]+)/g;

        // Extract object types
        for (const clause of matchClauses) {
            m = clause.value.match(regex);
            if (m == null) {
                return null;
            }

            for (let i = 0; i < m.length; i += 1) {
                foundMatch = m[i];
                const [objectId, objectType] = foundMatch.split(':');

                if (m.length == 3 && i == 1) {
                    edgeTypes[objectId] = objectType
                } else {
                    objectTypes[objectId] = objectType;
                }
            }
        }
        
        // Process params segment
        const whereClauses = [];
        for (const objectId of Object.keys(params)) {
            const { identifiers=[], data=[] } = params[objectId];
            const objectType = objectTypes[objectId];

            if (edgeTypes[objectId] == null && objectType == null) {
                throw new Error('Missing object type in match query');
            }
            
            if (objectType != null) {
                matchClauses.push(...identifiers.map((identifier, index) => {
                    const identifierKey = `${objectId}_identifier_${index}`;
                    whereClauses.push(`${identifierKey}.value = '${identifier.value}'`);

                    return { shouldReturn: false, value: `(${objectId}:${objectType})-[E${uuidv4().replace(/\-/g,'')}:HAS_ID]->(${identifierKey}:Identifier)` };
                }))
            }

            const opMap = {
                EQ: '=',
                LTE: '<=',
                LT: '<',
                GT: '>',
                GTE: '>=',
            }

            if (edgeTypes[objectId] == null) {
                matchClauses.push(...data.map((dataObj, index) => {
                    const { field, op='EQ', value, isNumber } = dataObj;
                
                    const dataKey = `${objectId}_data_${index}`;
                    whereClauses.push(
                        // `${dataKey}.${field} ${opMap[op]} ${isNumber ? parseFloat(value) : `'${value}'`}`
                        `${isNumber ? `toFloat(${dataKey}.${field}) ${opMap[op]} ${parseFloat(value)}` : `${dataKey}.${field} ${opMap[op]} '${value}'`}`
                        );

                    return { shouldReturn: false, value: `(${objectId}:${objectType})-[E${uuidv4().replace(/\-/g,'')}:HAS_DATA]->(${dataKey}:Data)` };
                }))
            } else {
                    whereClauses.push(...data.map((dataObj, index) => {
                        const { field, op='EQ', value, isNumber } = dataObj;
                        // console.log(dataObj);
                        return `${isNumber ? `toFloat(${objectId}.${field}) ${opMap[op]} ${parseFloat(value)}` : `${objectId}.${field} ${opMap[op]} '${value}'`}`
                    }))
                }
            
        }

        // console.log(matchClauses);
        // console.log(whereClauses);

        let pathCounter = 0;
        const paths = [];
        
        for (const { value: p, shouldReturn} of matchClauses) {
            paths.push(shouldReturn ? `MATCH p${pathCounter++} = ${p}` : `MATCH ${p}`);
        }

        const query = `${paths.join(' ')}
        ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}`: ''}
        RETURN DISTINCT ${Object.keys(new Array(pathCounter).fill(null)).map(i => `p${i}`)}`;

        return query;
    },

    joinPath,

    formatQueryResults: (results) => 
        results.records.map(record => joinPath((
                record.map(part => part.segments.length == 0 ? ({ from: part.start.properties }) : part.segments.map(segment => ({
                    from: segment.start.properties,
                    to: segment.end.properties,
                    relationship: { type: segment.relationship.type, properties: segment.relationship.properties }
                })).reduce((prev, curr) => prev.concat(curr), [])
            ).reduce((prev, curr) => prev.concat(curr), [])
            ))),

    formatSingleNodeResults: (results, primaryId) => {
        if (results.records.length == 0) {
            return null;
        }

        const response = {
            id: null,
			entityType: null,
			identifiers: [],
			data: [],
			neighbors: []
        }

        for (const record of results.records) {
            const [n, r, m] = record._fields;

            if (response.id == null) {
                response.id = n.properties.primaryId;
                response.entityType = n.properties.entityType;
            }

            if (r.type == 'HAS_ID') {
                response.identifiers.push(m.properties);
            } else if (r.type == 'HAS_DATA') {
                response.data.push(m.properties)
            } else {
                response.neighbors.push({ ...m.properties, id: m.properties.primaryId, edgeType: r.type, edgeData: {  ...r.properties, id: undefined }})
            }
        }

        return response;

    }

}