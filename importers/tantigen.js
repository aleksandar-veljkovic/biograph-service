const fs = require('fs');
const tabletojson = require('tabletojson').Tabletojson;


class TantigenImporter {
    constructor(bg) {
        this.bg = bg;
        this.importer = 'tantigen';
        this.importerVersion = '1.0';
        this.dataSource = 'Tantigen';
        console.log('Tantigen importer loaded');
    }

    downloadTable(antigenId) {
        const url = 'http://projects.met-hilab.org/tadb/cgi/displayAntigen.pl';

		return new Promise((resolve, reject) => {
			tabletojson.convertUrl(
				`${url}?ACC=${antigenId}`,
				(tablesAsJson) => {
						if (tablesAsJson[1]) {
							fs.writeFileSync(`/Users/aleksandarveljkovic/tantigen/${antigenId}.json`, JSON.stringify(tablesAsJson[1], null, 2), { flag : 'w'});
						}
						resolve(tablesAsJson[1]);
				})
			})
	}

    async run() {
        try {
            const { bg } = this;
            
            // Start new import
            await bg.beginImport(this.importer, this.importerVersion, this.dataSource);

            console.log('Importing data from Tantigen...');

            // for (let i = 1; i <= 4507; i+= 1) {
            //     try {
            //         await this.downloadTable(`Ag${`${i}`.padStart(6, '0')}`)
            //     } catch (err) {
            //         console.log(`Skipping Ag${`${i}`.padStart(6, '0')}`);
            //     }
            // }

            const files = fs.readdirSync('./importers/local-data/tantigen');
            const organismEntityId = await bg.createEntityNode('Organism', `9606`);
            await bg.createIdentifierNode(organismEntityId, 'id', 'NCBI ID', '9606');

            let i = 0;
            for (const filename of files) {
                // const num = `${i}`;
                // const antigenId = `Ag${num.padStart(6, '0')}`;
                const antigenId = filename.split('.')[0];
                const file = fs.readFileSync(`./importers/local-data/tantigen/${filename}`, { encoding: 'utf8'});
                const table = JSON.parse(file);

                i += 1;

                if (i % 100 == 0 && i > 0) {
                    console.log(`Tantigen: ${i}/${files.length}`);
                    await bg.closeBatch();
                }

                // if (i == 6) {
                //     break;
                // }

                const antigenEntityId = await bg.createEntityNode('Antigen', antigenId);
                await bg.createIdentifierNode(antigenEntityId, 'id', 'Antigen ACC', antigenId);
                
                // objects.add(antigenEntityId);
                let geneEntityId = null;
                let rootGeneEntityId = null;

                // epitopes = null;
                // hlaLigands = null;

                const antigenData = {};

                for (const row of table) {
                    const key = row[0];

                    if (key == 'Antigen Name') {
                        const antigenName = row[1].trim();
                        
                        rootGeneEntityId = await bg.createEntityNode('Gene', antigenName);
                        geneEntityId = await bg.createEntityNode('Gene', `${antigenName}-9606`);
                        await bg.createIdentifierNode(geneEntityId, 'name', 'Gene Name', antigenName);

                        await bg.createEntityEdge(geneEntityId, rootGeneEntityId, 'IS_INSTANCE', {});
                        await bg.createEntityEdge(geneEntityId, organismEntityId, 'FROM', {});
                        await bg.createEntityEdge(geneEntityId, antigenEntityId, 'HAS_ROLE');
                    }

                    if (key == 'Common Name') {
                        const commonName = row[1].trim();
                        await bg.createIdentifierNode(geneEntityId, 'name', 'Common Name', commonName);
                    }

                    if (key == 'Full name') {
                        antigenData.fullName = row[1];
                    }

                    if (key == 'Comment') {
                        antigenData.comment = row[1];
                    }

                    if (key == 'Synonym') {
                        const synonyms = row[1].split('\n')[0].split('another')[0].split(';').map(el => el.trim());

                        for (const synonym of synonyms) {
                            await bg.createIdentifierNode(antigenEntityId, 'name', 'Synonym Name', synonym);
                        }
                    }

                    if (key == 'UniProt ID') {
                        const uniprotId = row[1].trim();
                        // proteins.add(uniprotId);
                        const proteinEntityId = await bg.createEntityNode('Protein', uniprotId);

                        // objects.add(proteinEntityId);

                        await bg.createIdentifierNode(proteinEntityId, 'id', 'UniProt ID', uniprotId);
                        await bg.createIdentifierNode(antigenEntityId, 'id', 'UniProt ID', uniprotId);

                        await bg.createEntityEdge(proteinEntityId, antigenEntityId, 'HAS_ROLE');
                        await bg.createEntityEdge(proteinEntityId, organismEntityId, 'FROM', {});

                        if (geneEntityId != null) {
                            await bg.createEntityEdge(proteinEntityId, geneEntityId, 'FROM', {});    
                        }
                    }

                    if (key == 'NCBI Gene ID') {
                        const geneId = row[1].trim();
                        if (geneEntityId != null) {
                            await bg.createIdentifierNode(geneEntityId, 'id', 'NCBI ID', geneId);
                            await bg.createIdentifierNode(rootGeneEntityId, 'id', 'NCBI ID', geneId);
                        }
                    }

                    if (key == 'Annotation') {
                        const annotation = row[1].trim();
                        antigenData.annotation = annotation;
                    }

                    if (key == 'Isoforms') {
                        const isoforms = row[1].split('Alignment')[0].split('\n')[0].split(',').map(el => el.trim().split('Alignment')[0]);
                        for (const isoform of isoforms) {
                            const isoNodeId = await bg.createEntityNode('Antigen', isoform);

                            if (antigenEntityId != isoNodeId) {
                                await bg.createEntityEdge(antigenEntityId, isoNodeId, 'IS_VARIANT', { variationType: 'ISOFORM' });
                            }
                        }
                    }

                    if (key == 'Mutation entries') {
                        const mutationEntries = row[1].split('view')[0].split(',').map(el => el.trim().split('View')[0]);

                        for (const entry of mutationEntries) {
                            const mutationNodeId = await bg.createEntityNode('Antigen', entry);
                            // objects.add(mutationNodeId);

                            if (antigenEntityId != mutationNodeId) {
                                await bg.createEntityEdge(antigenEntityId, mutationNodeId, 'IS_VARIANT', { variationType: 'MUTATION'});
                            }
                        }
                    }
                    

                    if (key == 'RNA/protein expression profile') {
                        antigenData.rnaProteinExpressionProfile = row[1];
                    }
                
                    if (key == 'T cell epitope') {
                        // First row / header
                        if (row[1].trim() != "Epitope sequence") {
                            const positions = row[2].split('  ');
                            // const [from, to] = row[2].split('-');
                            const epitope = {
                                sequence: row[1].trim(),
                                positions,
                                hlaAllele: row[3].trim(),
                                epitopeType: 'T-cell',
                            };

                            const epitopeReferences = `${row[4]}`.split('\n').map(el => el.trim());

                            const epitopeEntityId = await bg.createEntityNode('Epitope', epitope.sequence);

                            await bg.createIdentifierNode(epitopeEntityId, 'sequence', 'Epitope Sequence', epitope.sequence);
                            await bg.createIdentifierNode(epitopeEntityId, 'id', 'HLA Allele', epitope.hlaAllele);

                            for (const reference of epitopeReferences) {
                                await bg.createIdentifierNode(epitopeEntityId, 'id', 'Reference ID', reference);
                            }

                            await bg.createDataNode(epitopeEntityId, 'Tantigen', epitope);
                            await bg.createEntityEdge(antigenEntityId, epitopeEntityId, 'CONTAINS', {});
                        }
                    }

                    if (key == 'HLA ligand') {
                        // if (hlaLigands == null) {
                        // 	hlaLigands = true;
                        if (row[1] != 'Ligand Sequence' && row[1] != 'Predicted HLA binders' && row[1] != 'Antigen sequence') {
                            const positions = row[2].split('  ');

                            // console.log(row);
                            const hlaLigand = {
                                sequence: row[1].trim(),
                                positions,
                                hlaAllele: row[3].trim(),
                                type: 'HLA ligand'
                            }

                            const ligandReferences = `${row[4]}`.split('\n').map(el => el.trim());

                            const ligandEntityId = await bg.createEntityNode('HLA_Ligand', hlaLigand.sequence);

                            await bg.createIdentifierNode(ligandEntityId, 'sequence', 'Ligand Sequence', hlaLigand.sequence);
                            
                            for (const reference of ligandReferences) {
                                await bg.createIdentifierNode(ligandEntityId, 'id', 'Reference ID', reference);
                            }

                            await bg.createDataNode(ligandEntityId, 'Tantigen', hlaLigand);
                            await bg.createEntityEdge(antigenEntityId, ligandEntityId, 'CONTAINS', {});
                        }
                    }
                }
            }

            console.log(`Tantigen: ${files.length}/${files.length}`)

            // Finish and commit the import
            await bg.finishImport();
            console.log('Tantigen import complete');
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}

module.exports = TantigenImporter;