class DescriptionIndexer {
    constructor(logs) {
        this.logs = logs;
        console.log('Description indexer loaded');

        this.currentDescriptions = [];
    }

    async write() {
        // const { createDescription, recreateDescriptionIndex } = this.logs.scripts.description;

        // const promises = this.currentDescriptions.map(({ entryId, entityId, descriptionText }) => 
        //     createDescription(entryId, entityId, descriptionText)
        // )

        // await Promise.all(promises);
        // await recreateDescriptionIndex();
        await this.logs.entityDescriptionController.bulkCreate(this.currentDescriptions);
        this.currentDescriptions = [];
        console.log('Description index updated');
    }

    async createDescription(entryId, entityId, descriptionText) {
        this.currentDescriptions.push({
            entry_id: entryId, 
            entity_id: entityId, 
            description_text: descriptionText,
        });

        return false;
    }
}

module.exports = DescriptionIndexer;