class IdentifierIndexer {
    constructor(logs) {
        this.logs = logs;
        console.log('Identifier indexer loaded');
        this.currentIdentifiers = [];
        this.currentIdentifierLinks = [];
    }

    async write() {
        //     const { createIdentifier, createIdentifierLink, recreateIdentifierIndex } = this.logs.scripts.identifier;

        //     const identifierPromises = this.currentIdentifiers.map(({ entryId, identifierType, value, isPrimary }) => {
        //             try {
        //                 return createIdentifier(entryId, identifierType, value, isPrimary ? 1 : 0);
        //             } catch (err) {
        //                 console.log(entryId, value, isPrimary ? 1 : 0);
        //                 console.log(err);
        //                 console.log();
        //                 throw err;
        //             }
        //         }
        //     );

        //     const identifierLinkPromises = this.currentIdentifierLinks.map(({ entryId, entityId }) => {
        //         try {
        //             return createIdentifierLink(entryId, entityId);
        //         } catch (err) {
        //             console.log(entryId, entityId);
        //             console.log(err);
        //             console.log();
        //             throw err;
        //         }
        //     }
        // );

        const chunkSize = 10000;
        for (let i = 0; i < this.currentIdentifiers.length; i += chunkSize) {
            console.log('Storing chunks:', i,'/',Math.ceil(this.currentIdentifiers.length) );

            const chunk = this.currentIdentifiers.slice(i, i + chunkSize);
            // do whatever
            await this.logs.identifierControler.bulkCreate(
                chunk.map(({ entryId, identifierType, value, valueHash, isPrimary }) => (
                    {
                        entry_id: entryId,
                        identifier_type: identifierType,
                        value,
                        value_hash: valueHash,
                        is_primary: isPrimary,
                    })))
        }

        for (let i = 0; i < this.currentIdentifierLinks.length; i += chunkSize) {
            console.log('Storing chunks:', i,'/',Math.ceil(this.currentIdentifierLinks.length) );

            const chunk = this.currentIdentifierLinks.slice(i, i + chunkSize);

            await this.logs.entityIdentifierController.bulkCreate(
                chunk.map(({ entryId, entityId }) => (
                    {
                        entry_id: entryId,
                        entity_id: entityId,
                    })))
        }

        this.currentIdentifiers = [];
        this.currentIdentifierLinks = [];
        console.log('Identifier index updated');
    }




    async createIdentifier(entryId, identifierType, value, valueHash, isPrimary) {
        this.currentIdentifiers.push({
            entryId,
            identifierType,
            value,
            valueHash,
            isPrimary,
        });

        return false;
    }

    async createIdentifierLink(entryId, entityId) {
        this.currentIdentifierLinks.push({
            entryId,
            entityId,
        });

        return false;
    }

    async getEntitiesByIdentifier(identifierId, entityType) {
        const query = `SELECT DISTINCT
        e.primary_id primary_id,
        MATCH (i.value) AGAINST ('*${identifierId}*' IN BOOLEAN MODE) as relevance
    FROM
        Entity_Identifiers ei
        JOIN Entries e ON e.entry_type = '${entityType}' AND ei.entity_id = e.id
        JOIN Identifiers i on ei.entry_id = i.entry_id
    WHERE    
    MATCH (i.value) AGAINST ('*${identifierId}*' IN BOOLEAN MODE) > 0.99
    order by relevance desc
    LIMIT 10`;

    // console.log(query);

        const res = await this.logs.db.query(query);
        // console.log(res);
        return res;
    }

    async getEntityIdentifiers(identifierIds) {
        // const { findId } = this.logs.scripts.identifier;
        return this.logs.db.query(`SELECT
        DISTINCT i.value
    FROM
        Entity_Identifiers ei
        JOIN Entries e ON ei.entity_id = e.id 
        JOIN Identifiers i ON i.entry_id = ei.entry_id
    WHERE
        e.primary_id = '${identifierIds}'
    LIMIT
        5;`);
    }
}

module.exports = IdentifierIndexer;