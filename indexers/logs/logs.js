// const sqlite = require('better-sqlite3');
const { Sequelize } = require('sequelize');
const loadScripts = require('./scripts/scripts');
const loadEntityDescriptionModel = require('./models/entity-descriptions-model');
const loadEntityIdentifiersModel = require('./models/entity-identifiers-model');
const loadImportModel = require('./models/import-model');
const loadEntryImportModel = require('./models/entry-import-model');
const loadEntryModel = require('./models/entry-model');
const loadIdentifierModel = require('./models/identifiers-model');
const Controller = require('./controller');

class Logs {
    constructor(config) {
        this.config = config;
        // this.db = sqlite('indexers/logs/logs.db');
        this.currentTransaction = null;
    }
    
    async init(sync=true) {
        const { config } = this;
        // await this.scripts.initDatabase();
        this.db = new Sequelize(
            config.catalog.database,
            config.catalog.username,
            config.catalog.password,
             {
               host: config.catalog.host,
               port: config.catalog.port,
               dialect: config.catalog.dbms,
               logging: false,
             }
           );

        // Load models
        this.entityDescriptionController = new Controller(loadEntityDescriptionModel(this.db), this);
        this.entityIdentifierController = new Controller(loadEntityIdentifiersModel(this.db), this);
        this.importController = new Controller(loadImportModel(this.db), this);
        this.entryImportController = new Controller(loadEntryImportModel(this.db), this);
        this.entryController = new Controller(loadEntryModel(this.db), this);
        this.identifierControler = new Controller(loadIdentifierModel(this.db), this); 

        if (sync) {
            await this.db.sync({ alter: true });
        }
       
        console.log('Logs initialized');
    }

    async beginTransaction() {
        // await this.scripts.beginTransaction();
        this.currentTransaction = await this.db.transaction();
        console.log('Indexing transaction created');
    }

    async commitTransaction() {
        // await this.scripts.commitTransaction();
        await this.currentTransaction.commit();
        console.log('Indexing transaction commited');
    }

    async rollbackTransaction() {
        // await this.scripts.rollbackTransaction();
        await this.currentTransaction.rollback();
        console.log('Indexing transaction rolled back');
    }
}

module.exports = Logs;