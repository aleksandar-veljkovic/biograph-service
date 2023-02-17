const fs = require('fs');

const initDatabase = fs.readFileSync('./indexers/logs/scripts/init-database.sql', 'utf8');
const createImport = fs.readFileSync('./indexers/logs/scripts/create-import.sql', 'utf8');
const findEntry = fs.readFileSync('./indexers/logs/scripts/find-entry.sql', 'utf8');
const createEntry = fs.readFileSync('./indexers/logs/scripts/create-entry.sql', 'utf8');
const createEntryImport = fs.readFileSync('./indexers/logs/scripts/create-entry-import.sql', 'utf8');
const createIdentifier = fs.readFileSync('./indexers/logs/scripts/create-identifier.sql', 'utf8');
const createIdentifierLink = fs.readFileSync('./indexers/logs/scripts/create-identifier-link.sql', 'utf8');
const createDescription = fs.readFileSync('./indexers/logs/scripts/create-description.sql', 'utf8');
const recreateDescriptionIndex = fs.readFileSync('./indexers/logs/scripts/recreate-description-index.sql', 'utf8');
const recreateIdentifierIndex = fs.readFileSync('./indexers/logs/scripts/recreate-identifier-index.sql', 'utf8');
const findEntitiesById = fs.readFileSync('./indexers/logs/scripts/find-entities-by-id.sql', 'utf8');
const findId = fs.readFileSync('./indexers/logs/scripts/find-id.sql', 'utf8');

// Import indexer methods

module.exports = (db) => ({
    initDatabase: async () => db.exec(initDatabase),
    beginTransaction: async () => db.exec('BEGIN TRANSACTION;'),
    commitTransaction: async () => db.exec('COMMIT;'),
    rollbackTransaction: async () => db.exec('ROLLBACK;'),
    
    import: {
        createImport: async (id, importer, importerVersion, importDate, dataSource) => 
            db.prepare(createImport).run(id, importer, importerVersion, importDate, dataSource),
    },
    
    entry: {
        createEntry: async (id, entryType, primaryId, isEdge) => { 
            try {
                await db.prepare(createEntry).run(id, entryType, primaryId, isEdge);
            } catch (err) {
                console.log(id, entryType, primaryId, isEdge);
                throw err;
            }
        },
        createEntryImport: (importId, batchId, entryId) => 
                db.prepare(createEntryImport).run(importId, batchId, entryId),
        findEntry: async (id) => db.prepare(findEntry).get(id),
    },

    identifier: {
        createIdentifier: (entryId, identifierType, value, isPrimary) =>
            db.prepare(createIdentifier).run(entryId, identifierType, value, isPrimary),
        createIdentifierLink: (entryId, entityId) =>
            db.prepare(createIdentifierLink).run(entryId, entityId),
        findEntitiesById: (identifierIds, entityType) => {
            const query = `SELECT DISTINCT
                e.primary_id primary_id
            FROM
                EntityIdentifiers ei
                JOIN Entries e ON ei.entity_id = e.id
                JOIN identifier_index i on ei.entry_id = i.entry_id
            WHERE
                e.entry_type = ? AND
                (
                    ${identifierIds.map(() => "i.value LIKE ?").join(" OR ")} 
                )
            LIMIT 5;
            `;

            // console.log(query);

            return db.prepare(query).all(entityType, ...identifierIds.map(el => `%${el}%`))
        },
            findId: (entityPrimaryId) =>
            db.prepare(findId).all(entityPrimaryId),
        recreateIdentifierIndex: () =>
            db.exec(recreateIdentifierIndex)
    },

    description: {
        createDescription: (entryId, entityId, descriptionText) =>
            db.prepare(createDescription).run(entryId, entityId, descriptionText),
        recreateDescriptionIndex: () => 
            db.exec(recreateDescriptionIndex),
    }
});