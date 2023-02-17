const fs = require('fs');

class EntryIndexer {
    constructor(logs) {
        this.logs = logs;
        console.log('Entry indexer loaded'); 
        this.currentEntries = [];
        this.history = {};
    }

    async write() {
        // fs.writeFileSync('output.json', JSON.stringify(this.currentEntries, null, 2));
        // const { createEntry, createEntryImport } = this.logs.scripts.entry;
        // const entryPromises = [];
        // const entryImportPromises = [];
        
        // for (const { id, entryType, primaryId, isEdge, importId, batchId, isNew } of Object.values(this.currentEntries)) {
        //     try {
        //         if (isNew) {
        //             entryPromises.push(createEntry(id, entryType, primaryId, isEdge ? 1 : 0));
        //         }

        //         entryImportPromises.push(createEntryImport(importId, batchId, id));
        //     } catch (err) {
        //         console.log({ id, entryType, primaryId, isEdge, importId, isNew });
        //         console.log(err);
        //         throw err;
        //     }
        // }

        // await Promise.all(entryPromises);
        // await Promise.all(entryImportPromises);

        // // Clean entries

        let chunkSize = 10000;
        const uniqueItems = this.currentEntries.filter(el => el.isNew);
        for (let i = 0; i < uniqueItems.length; i += chunkSize) {
            console.log('Storing chunks:', i,'/',Math.ceil(uniqueItems.length) );
            const chunk = uniqueItems.slice(i, i + chunkSize);
            // do whatever
            await this.logs.entryController.bulkCreate(chunk.map(({ id, entryType, primaryId, isEdge}) => ({ id, entry_type: entryType, primary_id: primaryId, is_edge: isEdge })));
        }

        chunkSize = 100000
        for (let i = 0; i < this.currentEntries.length; i += chunkSize) {
            console.log('Storing chunks:', i,'/',Math.ceil(this.currentEntries.length) );
            const chunk = this.currentEntries.slice(i, i + chunkSize);
            await this.logs.entryImportController.bulkCreate(chunk.map(({ importId, batchId, id }) => ({ import_id: importId, batch_id: batchId, entry_id: id })));
        }

        this.currentEntries = [];
        if (Object.keys(this.history).length > 100000000) {
            this.history = {};
        }
        console.log('Entry index updated');
    }

    async createEntry(entryType, id, primaryId, isEdge, importId, batchId) {
        if (isEdge) { return false; }
        
        const isNew = this.history[id] == null;
        this.history[id] = true;

        this.currentEntries.push({
            id,
            entryType,
            primaryId,
            isEdge,
            importId,
            batchId,
            isNew,
        });
        
        return isNew;
    }

    // updateEntry(id, updateObj) {
    //     if (this.currentEntries[id] == null) {
    //         throw new Error('Unknown entity',id);
    //     }

    //     this.currentEntries[id] = { ...this.currentEntries[id], ...updateObj };
    // }
}

module.exports = EntryIndexer;