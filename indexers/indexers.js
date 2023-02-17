// Logs
const Logs = require('./logs/logs');

// Load indexers
const EntryIndexer = require('./entry-indexer');
const IdentifierIndexer = require('./identifier-indexer');
const DescriptionIndexer = require('./description-indexer');
const ImportIndexer = require('./import-indexer');

module.exports = async (config, initLogs=true) => {
    // Initialize logs database
    const logs = new Logs(config);

    await logs.init(initLogs);
  

    // Initialize indexers
    const entryIndexer = new EntryIndexer(logs);
    const identifierIndexer = new IdentifierIndexer(logs);
    const descriptionIndexer = new DescriptionIndexer(logs);
    const importIndexer = new ImportIndexer(logs);

    const beginTransaction = async () => {
        return logs.beginTransaction();
    }

    const commitTransaction = async () => {
        return logs.commitTransaction();
    }

    const rollbackTransaction = async () => {
        return logs.rollbackTransaction();
    }

    return {
        beginTransaction,
        commitTransaction,
        rollbackTransaction,
        entryIndexer,
        identifierIndexer,
        descriptionIndexer,
        importIndexer,
    };
}