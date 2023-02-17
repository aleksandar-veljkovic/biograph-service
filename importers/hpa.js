const fs = require('fs');

class ProteinAtlasImporter {
    constructor(bg) {
        this.bg = bg;
        this.importer = 'human-protein-atlas';
        this.importerVersion = '1.0';
        this.dataSource = 'Human Protein Atlas';
        console.log('Human Protein Atlas importer loaded');
    }

    async run() {
        const { bg } = this;
        
        // Start new import
        await bg.beginImport(this.importer, this.importerVersion, this.dataSource);

        console.log('Importing data from Protein Atlas...');

        // Load local data
        const data = JSON.parse(fs.readFileSync('./importers/local-data/proteinatlas.json'));

        let i = 0;

        console.log('Parsing import data');
        for (const entry of data) {
			i += 1;

            console.log(JSON.stringify(entry, null, 2));
            process.exit();

            // Logging progres
			if (i % 100 == 0) {
				console.log(`Human Protein Atlas: ${i}/${data.length}`);
			}

            const gene = entry["Gene"];
            const geneSynonyms = entry['Gene synonym'];
            const ensembleId = entry["Ensembl"];
            const geneDescription = entry["Gene description"];
            const uniprotIds = entry["Uniprot"];
            const chromosome = entry["Chromosome"];
            const [fromPosition, toPosition] = entry["Position"].split('-');
            const proteinClasses = entry["Protein class"]; // ["Cancer-related genes", "Plasma proteins", "Predicted intracellular proteins", "Transporters"],
            const biologicalProcesses = entry["Biological process"]; // ["Cell cycle", "Cell division", "Mitosis"],
            const molecularFunctions = entry["Molecular function"]; // ["Cyclin"],
            const diseaseInvolvements = entry["Disease involvement"]; // ["Cancer-related genes"]
            const subcellularLocation = entry["Subcellular location"]; // ["Cytosol"]
            const secretomeLocation = entry["Secretome location"] //: null,

            const prognostics = Object.keys(entry)
                .filter(key => key.startsWith('Pathology prognostics'))
                .map(prognosticKey => {
                    const cancerType = prognosticKey.split('-')[1].trim();
                    return {
                        cancerType,
                        prognosticType: entry[prognosticKey]["prognostic type"], // "unfavorable",
                        isPrognostic: entry[prognosticKey]["is_prognostic"], // "unfavorable",
                        pVal: parseFloat(entry[prognosticKey]["p_val"]),
                    }
                })
        }


        console.log(`Human Protein Atlas: ${data.length}/${data.length}`)

        // Finish and commit the import
        await bg.finishImport();
        console.log('Human Protein Atlas import complete');
    }
}

module.exports = ProteinAtlasImporter;