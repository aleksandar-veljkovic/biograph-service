const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const Neo4J = require('./database/neo4j/neo4j');
const config = require('./config');
const utils = require('./utils');
const loadIndexers = require('./indexers/indexers');

const db = new Neo4J(config);
db.connect();

const cors = corsMiddleware({
    origins: ['*'],
    allowHeaders: ['*'],
    exposeHeaders: ['*'],
});

const server = restify.createServer({
    name: config.api.appName,
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.queryParser({ mapParams: false }));
server.use(restify.plugins.bodyParser());

let loadedIndexers = null;

// Routes
// =================================

// Heartbeat 
server.get('/', (req, res, next) => {
    res.send({ message: `${config.api.appName} is running`, timestamp: new Date().getTime() });
    return next();
});

server.post('/query', (req, res, next) => {
    if (req.body == null) {
        res.status(400);
        res.send({ message: 'Empty request' });
        return next();
    }

    const { query } = req.body;
    if (query == null) {
        res.status(400);
        res.send({ message: 'Empty query' });
        return next();
    }

    const { match, params } = query;

    const preparedQuery = utils.prepareQuery(match, params);

    const startTime = new Date();

    const session = db.createReadSession();
    console.log(preparedQuery);

    session.run(preparedQuery).then((results) => {
        console.log(`Query finished in ${new Date().getTime() - startTime} ms`);
        res.send(utils.formatQueryResults(results));
        session.close()
    })
});

server.get('/node', (req, res, next) => {
    const { primaryId, entityType } = req.query;

    const session = db.createReadSession();
    const query = `MATCH p = (n:Entity:${entityType})-[r]-(m) WHERE n.primaryId = $primaryId RETURN n, r, m`;

    session.run(query, { primaryId }).then((results) => {
        res.send(utils.formatSingleNodeResults(results));
        session.close()
    })
});

server.get('/search', async (req, res, next) => {
    console.log('Query received');
    const { q, entityType } = req.query;

    console.log({ q, entityType });
    let byIdentifier = [];
    let byKeyword = [];

    try {
        const byIdentifierRaw = (await loadedIndexers.identifierIndexer.getEntitiesByIdentifier(q, entityType))[0]
        console.log(byIdentifierRaw);
        for (const entity of byIdentifierRaw) {
            // console.log(entity);
            const { primary_id: primaryId } = entity;
            // console.log(primaryId);
            const identifiers = (await loadedIndexers.identifierIndexer.getEntityIdentifiers(primaryId))[0];
            // console.log(identifiers);
            // console.log(identifiers);
            identifiers.map(id => id.value)
            byIdentifier.push({ primaryId, identifiers: identifiers.map(id => id.value) });
        }
        // byKeyword = await loadedIndexers.identifierIndexes.getEntitiesByIdentifier(q)
    } catch (err) {
        console.log(err);
    } finally {
        res.send({ byIdentifier, byKeyword });
        return next();
    }

});

console.log(`Starting server on ${config.api.host}:${config.api.port}`);
loadIndexers(config, false).then(indexers => {
    loadedIndexers = indexers;
    console.log('Indexers loaded');
    server.listen(
        config.api.port,
        config.api.host || 'localhost',
        () => console.log(`${config.api.appName} API listening at ${server.address().address
            }:${config.api.port
            }`),
    )
});
