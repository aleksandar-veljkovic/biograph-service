const config = require('./config');
const BioGraph = require('./biograph/biograph');

// Verify command line arguments
const args = process.argv;
if (args.length != 3) {
    console.log('ERROR: Invalid call. Regular call format: node biograph-import.js <importer script name>');
    console.log('Example: node biograph-import.js disprot');
    process.exit();
}

// Load importer
let importer = null;
const importerName = args[2];
try {
    importer = require(`./importers/${importerName}.js`)
} catch(err) {
    console.log(`ERROR: Importer '${importerName}' not found`);
    process.exit();
}

// Initialize graph database
const Neo4J = require('./database/neo4j/neo4j');
const db = new Neo4J(config);

console.log('Connecting to database');
// Check graph database connectivity
db.connect().then(() => {
    const loadIndexers = require('./indexers/indexers');
    console.log('Loading indexers');
    loadIndexers(config).then(indexers => {
        console.log('Loading biograph service');
        // Initialize BioGraph
        const bg = new BioGraph(db, indexers);

        // Initialize importer
        const importerInstance = new importer(bg);

        // Run import
        importerInstance.run().then(() => {
            console.log('Import process finished successfully!');
            db.disconnect();
        }).catch ((err) => {
            console.log('ERROR: Import failed');
            console.log(err);
            process.exit();
        });
    }).catch((err) => {
        console.log('ERROR: Indexer initialization failed');
        console.log(err.message);
        process.exit();
    }) 
}).catch((err) => { console.log(err); console.error('Graph database connection failed') })