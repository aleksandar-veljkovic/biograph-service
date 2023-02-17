const Papa = require('papaparse');
const fs = require('fs');

class IEDBImporter {
    constructor(bg) {
        this.bg = bg;
        this.importer = 'iedb';
        this.importerVersion = '1.0';
        this.dataSource = 'IEDB';
        console.log('IEDB importer loaded');
    }

    parseCSV(path, skipRows = null) {
        return new Promise((resolve, reject) => {
            const loadedData = [];

            console.log('Parsing input file: ', path);
            const stream = fs.createReadStream(path, 'utf8');
            const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, { header: false, });

            stream.pipe(parseStream);

            parseStream.on('data', (data) => loadedData.push(data));
            parseStream.on('finish', () => resolve(skipRows != null ? loadedData.slice(skipRows) : loadedData));
            parseStream.on('error', err => reject(err))

        })
    }

    async processEpitope(
        bg,
        epitopeIri,
        objectType,
        description,
        epitopeModifiedResidues,
        epitopeModifications,
        startingPosition,
        endingPosition,
        nonPeptidicEpitopeIri,
        epitopeSynonyms,
        antigenName,
        antigenIri,
        parentProtein,
        parentProteinIri,
        parentOrganism,
        parentOrganismIri,
        epitopeComments,
    ) {
        const epitopeEntityId = await bg.createEntityNode('Epitope', `${epitopeIri.split('/').slice(-1)[0]}`);
        await bg.createIdentifierNode(epitopeEntityId, 'id', `IEDB ID`, `${epitopeIri.split('/').slice(-1)[0]}`);
        await bg.createIdentifierNode(epitopeEntityId, 'url', `IEDB URL`, `${epitopeIri}`);
        await bg.createIdentifierNode(epitopeEntityId, 'name', `Epitope description`, description);
        await bg.createIdentifierNode(epitopeEntityId, 'id', `IEDB IRI`, `${epitopeIri}`);

        const epitopeData = {
            ...(epitopeModifiedResidues.length > 0 && { epitope_modified_residues: epitopeModifiedResidues }),
            ...(description.length > 0 && { epitope_description: description }),
            ...(startingPosition.length > 0 && { start_position: startingPosition }),
            ...(endingPosition.length > 0 && { end_position: endingPosition }),
            ...(objectType.length > 0 && { object_type: objectType }),
            ...(epitopeModifications.length > 0 && { epitope_modifications: epitopeModifications }),
            ...(epitopeComments.length > 0 && { epitope_comments: epitopeComments })
        };

        if (Object.keys(epitopeData).length > 0) {
            await bg.createDataNode(epitopeEntityId, 'iedb', epitopeData, epitopeComments.length > 0 ? "epitope_comments" : null);
        }

        if (nonPeptidicEpitopeIri.length > 0) {
            const nonPeptidicMoleculeEntityId = await bg.createEntityNode('Molecule', nonPeptidicEpitopeIri.split('/').slice(-1)[0].split('_')[1]);
            await bg.createIdentifierNode(nonPeptidicMoleculeEntityId, 'sequence', `ChEBI ID`, nonPeptidicEpitopeIri.split('/').slice(-1)[0].split('_')[1]);
            await bg.createEntityEdge(nonPeptidicMoleculeEntityId, epitopeEntityId, 'CONTAINS', {});

            if (parentOrganismIri.length > 0) {
                const moleculeOrganismId = parentOrganismIri.split('NCBITaxon_')[1];
                const moleculeOrganismEntityId = await bg.createEntityNode('Organism', `${moleculeOrganismId}`);
                await bg.createEntityEdge(nonPeptidicMoleculeEntityId, moleculeOrganismEntityId, 'FROM');

                await bg.createIdentifierNode(organismEntityId, 'id', `Taxon ID`, `${parentOrganismIri.split('NCBITaxon_')[1]}`);
                await bg.createIdentifierNode(organismEntityId, 'url', `Taxon URL`, `${parentOrganismIri}`);
                await bg.createIdentifierNode(organismEntityId, 'name', `Taxon Name`, `${parentOrganism}`);
            }
            

           
        }

        if (epitopeSynonyms.length > 0) {
            for (const synonym of epitopeSynonyms.split(', ')) {
                await bg.createIdentifierNode(epitopeEntityId, 'name', `Synonym`, synonym);
            }
        }

        if (antigenName.length > 0) {
            let antigenIriType = 'Antigen';

            if (antigenIri.includes('uniprot')) {
                antigenIriType = 'UniProt';
            }

            if (antigenIri.includes('ncbi')) {
                antigenIriType = 'NCBI';
            }

            const antigenEntityId = await bg.createEntityNode('Antigen', `${antigenIri.split('/').slice(-1)[0]}`);
            await bg.createIdentifierNode(antigenEntityId, 'id', `${antigenIriType} ID`, `${antigenIri.split('/').slice(-1)[0]}`);
            await bg.createIdentifierNode(antigenEntityId, 'url', `${antigenIriType} URL`, `${antigenIri}`);
            await bg.createEntityEdge(epitopeEntityId, antigenEntityId, 'FROM', {});

            const proteinEntityId = await bg.createEntityNode('Protein', `${parentProteinIri.split('/').slice(-1)[0]}`);
            await bg.createIdentifierNode(proteinEntityId, 'id', `${antigenIriType} ID`, `${parentProteinIri.split('/').slice(-1)[0]}`);
            await bg.createIdentifierNode(proteinEntityId, 'id', 'UniProt ID', `${parentProteinIri.split('/').slice(-1)[0]}`);
            await bg.createIdentifierNode(proteinEntityId, 'url', 'UniProt URL', `${parentProteinIri}`);
            await bg.createIdentifierNode(proteinEntityId, 'name', 'Protein Name', `${parentProtein}`);
            await bg.createEntityEdge(proteinEntityId, antigenEntityId, 'HAS_ROLE', { relationDetails: 'PARENT_PROTEIN' });

            const organismEntityId = await bg.createEntityNode('Organism', `${parentOrganismIri.split('NCBITaxon_')[1]}`);
            await bg.createIdentifierNode(organismEntityId, 'id', `Taxon ID`, `${parentOrganismIri.split('NCBITaxon_')[1]}`);
            await bg.createIdentifierNode(organismEntityId, 'url', `Taxon URL`, `${parentOrganismIri}`);
            await bg.createIdentifierNode(organismEntityId, 'url', `Taxon Name`, `${parentOrganism}`);

        }

        return epitopeEntityId;
    }


    async run() {
        const { bg } = this;

        // Start new import
        await bg.beginImport(this.importer, this.importerVersion, this.dataSource);

        console.log('Importing data from IEDB...');



        // Load data
        const antigenCsvFile = fs.readFileSync('./importers/local-data/iedb-antigen.csv', 'utf8');
        const { data: antigenData } = Papa.parse(antigenCsvFile.split('\n').slice(1).join('\n'), { header: true });

        console.log('IEDB: Processing antigen data');

        let i = 0;
        for (const antigen of antigenData) {
            i += 1;

            const antigenName = antigen['Antigen Name'];
            const rawId = antigen['Antigen ID'];
            if (rawId == null || rawId.length == 0) {
                continue;
            } 

            const antigenId = rawId.split('/').slice(-1)[0];
            const organismName = antigen['Organism Name'];
            const organismTaxonId = antigen['Organism ID'].split('NCBITaxon_')[1];

            let idType = 'Protein';
            if (rawId.includes('uniprot')) {
                idType = 'UniProt';
            }
            if (rawId.includes('allergen')) {
                idType = 'Alergen.org';
            }
            if (rawId.includes('ontology.iedb')) {
                idType = 'IEDB ontology';
            }

            // console.log(organismNCBIId);
            // break;

            if (i % 1000 == 0 && i > 0) {

                console.log(`IEDB: ${i}/${antigenData.length} (Antigen)`);
            }

        	if (i % 10000 == 0 && i > 0) {
                await bg.closeBatch();
        	}

            const antigenEntityId = await bg.createEntityNode('Antigen', antigenId);
            await bg.createIdentifierNode(antigenEntityId, 'url', `${idType} URL`, rawId);
            await bg.createIdentifierNode(antigenEntityId, 'id', `${idType} ID`, `${antigenId}`);
            await bg.createIdentifierNode(antigenEntityId, 'name', 'Antigen Name', `${antigenName}`);

            const proteinEntityId = await bg.createEntityNode('Protein', antigenId);
            await bg.createIdentifierNode(proteinEntityId, 'url',  `${idType} URL`, rawId);
            await bg.createIdentifierNode(proteinEntityId, 'id', `${idType} ID`, `${antigenId}`);
            await bg.createIdentifierNode(proteinEntityId, 'name', 'Antigen Name', `${antigenName}`);

            await bg.createEntityEdge(proteinEntityId, antigenEntityId, 'HAS_ROLE', {});

            if (organismTaxonId != null) {
                const organismEntityId = await bg.createEntityNode('Organism', organismTaxonId);

                await bg.createIdentifierNode(organismEntityId, 'id', 'Taxon ID', organismTaxonId);
                await bg.createIdentifierNode(organismEntityId, 'id', 'Taxon Name', organismName);
                await bg.createDataNode(organismEntityId, 'iedb', { species: organismTaxonId });

                await bg.createEntityEdge(antigenEntityId, organismEntityId, 'FROM', {});
                await bg.createEntityEdge(proteinEntityId, organismEntityId, 'FROM', {});
            }
        }

        const epitopeData = await this.parseCSV('./importers/local-data/iedb-epitope.csv', 2);

        console.log(`IEDB: ${antigenData.length}/${antigenData.length}`);
        await bg.closeBatch();

        console.log('IEDB: Processing epitope data');
        i = 0;
        for (const epitope of epitopeData) {
            const [
                epitopeIri,
                objectType,
                description,
                epitopeModifiedResidues,
                epitopeModifications,
                startingPosition,
                endingPosition,
                nonPeptidicEpitopeIri,
                epitopeSynonyms,
                antigenName,
                antigenIri,
                parentProtein,
                parentProteinIri,
                organismName,
                organismIri,
                parentOrganism,
                parentOrganismIri,
                epitopeComments,
                relatedObjectEpitopeRelationship,
                relatedObjectType,
                relatedObjectDescription,
                relatedObjectStartingPosition,
                relatedObjectEndingPosition,
                relatedObjectNonPeptidicEpitopeIri,
                relatedObjectSynonyms,
                relatedObjectAntigenName,
                relatedObjectAntigenIri,
                relatedObjectParentProtein,
                relatedObjectParentProteinIri,
                relatedObjectOrganismName,
                relatedObjectOrganismIri,
                relatedObjectParentOrganism,
                relatedObjectParentOrganismIri,

            ] = epitope;
            i += 1;
            // if (i < 40000) { continue; }
            

            if (i % 10000 == 0 && i > 0) {

                console.log(`IEDB: ${i}/${epitopeData.length} (Epitope)`);
            }

            if (i % 10000 == 0 && i > 0) {
                await bg.closeBatch();
            }

            await this.processEpitope(
                bg,
                epitopeIri,
                objectType,
                description,
                epitopeModifiedResidues,
                epitopeModifications,
                startingPosition,
                endingPosition,
                nonPeptidicEpitopeIri,
                epitopeSynonyms,
                antigenName,
                antigenIri,
                parentProtein,
                parentProteinIri,
                parentOrganism,
                parentOrganismIri,
                epitopeComments,
            );
        }
        // Finish and commit the import
        await bg.finishImport();
        console.log('IEDB import complete');
    }
}

module.exports = IEDBImporter;