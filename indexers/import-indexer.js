const utils = require("../utils");

class ImportIndexer {
    constructor(logs) {
        this.logs = logs;
        console.log('Import indexer loaded');

        this.imports = [];
    }

    // Register new import
    createImport(importer, importerVersion, dataSource) {
        const id = utils.generateId();

        const importDate = new Date().toString();

        this.imports.push({ id, importer, importerVersion, importDate, dataSource });
        console.log('\nNew import started:');
        console.log('Import ID:', id);
        console.log('Importer:', importer);
        console.log('Importer version:', importerVersion);
        console.log('Import date:', importDate); 
        console.log('Data source:', dataSource);
        return id;
    }

    async write() {
        // const { createImport } = this.logs.scripts.import;
        // const promises = this.imports.map(({ id, importer, importerVersion, importDate, dataSource }) => 
        //     createImport(id, importer, importerVersion, importDate, dataSource)
        // )

        // await Promise.all(promises)
        await this.logs.importController.bulkCreate(this.imports.map(({ id, importer, importerVersion, importDate, dataSource }) => ({
            id, 
            importer, 
            importer_version: importerVersion, 
            import_date: importDate, 
            datasource: dataSource
        })))
        console.log('Import index updated');

        // Clean imports
        this.imports = [];
    }
}

module.exports = ImportIndexer;