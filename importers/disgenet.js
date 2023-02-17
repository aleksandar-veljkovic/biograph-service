const { TSV } = require('tsv');
const fs = require('fs');

class DisGeNetImporter {
    constructor(bg) {
        this.bg = bg;
        this.importer = 'disgenet';
        this.importerVersion = '1.0';
        this.dataSource = 'DisGeNet';
        console.log('DisGeNet importer loaded');
    }

    async run() {
        const { bg } = this;
        
        // Start new import
        await bg.beginImport(this.importer, this.importerVersion, this.dataSource);

        console.log('Importing data from DisGeNet...');

       
        
        // Load data
        const tsvFile = fs.readFileSync('./importers/local-data/disgenet.tsv','utf8');
        const parser = new TSV.Parser("\t", { header: true });
		const data = parser.parse(tsvFile);

        const organismEntityId = await bg.createEntityNode('Organism', `9606`);
        await bg.createIdentifierNode(organismEntityId, 'id', 'NCBI ID', '9606');

        let i = 0;
        for (const disease of data) {
            i += 1;

            if (i % 1000 == 0 && i > 0) {
                console.log(`DisGeNet: ${i}/${data.length}`);
            }

			if (i % 10000 == 0 && i !== 0) {
                await bg.closeBatch();
			}

			const { 
				diseaseId, 
				diseaseName, 
				diseaseType, 
				diseaseClass,
				diseaseSemanticType,
			} = disease;

			// Create disase
            const diseaseEntityId = await bg.createEntityNode('Disease', diseaseId);
            await bg.createEntityEdge(diseaseEntityId, organismEntityId, 'FROM', {});

            await bg.createIdentifierNode(diseaseEntityId, 'id', 'Condition ID', diseaseId);
            await bg.createIdentifierNode(diseaseEntityId, 'name', 'Disease Type', diseaseType);
            await bg.createIdentifierNode(diseaseEntityId, 'name', 'Disease Semantic Type', diseaseSemanticType);
            await bg.createIdentifierNode(diseaseEntityId, 'name', 'Disease Name', diseaseName);
            

            await bg.createDataNode(diseaseEntityId, 'DisGeNet', {
				disease_name: diseaseName,
			});

			if (diseaseClass != null) {
				for (const dclass of diseaseClass.split(';')) {
                    await bg.createIdentifierNode(diseaseEntityId, 'id', 'Disease Class', dclass);
                    const diseaseClassEntityId = await bg.createEntityNode('Disease_Class', dclass);
                    await bg.createIdentifierNode(diseaseClassEntityId, 'id', 'Disease Class', dclass);
                    await bg.createEntityEdge(diseaseEntityId, diseaseClassEntityId, 'IS_INSTANCE', {});
				}

				// TODO: Disease class names

				const { geneId, geneSymbol, DSI, DPI, score } = disease;

                const rootGeneEntityId = await bg.createEntityNode('Gene', geneSymbol.trim());
                const geneEntityId = await bg.createEntityNode('Gene', `${geneSymbol.trim()}-9606`);
                await bg.createIdentifierNode(rootGeneEntityId, 'id', 'NCBI ID', geneId);
                await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Gene Symbol', geneSymbol.trim());

                await bg.createIdentifierNode(geneEntityId, 'id', 'NCBI ID', geneId);
                await bg.createIdentifierNode(geneEntityId, 'name', 'Gene Symbol', geneSymbol.trim());

                await bg.createEntityEdge(geneEntityId, rootGeneEntityId, 'IS_INSTANCE', {});
                await bg.createEntityEdge(geneEntityId, organismEntityId, 'FROM', {});

				const edgeData = {
					dsi: DSI || null,
					dpi: DPI || null,
					score: score ? parseFloat(score) : null
				}

                await bg.createEntityEdge(diseaseEntityId, geneEntityId, 'RELATED_WITH', edgeData);
			}
		}

        
        console.log(`DisGeNet: ${data.length}/${data.length}`);

        // Finish and commit the import
        await bg.finishImport();
        console.log('DisGeNet import complete');
    }
}

module.exports = DisGeNetImporter;