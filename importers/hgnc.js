const axios = require('axios');

class DisprotImporter {
    constructor(bg) {
        this.bg = bg;
        this.importer = 'hgnc';
        this.importerVersion = '1.0';
        this.dataSource = 'HGNC';
        console.log('HGNC importer loaded');
    }

    async run() {
        const { bg } = this;
        
        // Start new import
        await bg.beginImport(this.importer, this.importerVersion, this.dataSource);

        console.log('Importing data from HGNC...');

        // HGNC URL
        const url = 'http://ftp.ebi.ac.uk/pub/databases/genenames/hgnc/json/hgnc_complete_set.json'

        console.log('Downloading data...');
		const { docs: data }  = (await axios.get(url)).data.response;
        const size = data.length;
		console.log('Download complete, preparing data...');

        let i = 0;

        console.log('Parsing import data');
        const organismEntityId = await bg.createEntityNode('Organism', `9606`);
        await bg.createIdentifierNode(organismEntityId, 'id', 'NCBI ID', '9606');


        for (const gene of data) {
			i += 1;

            if (i % 100 == 0) {
                console.log(`HGNC: ${i}/${data.length}`);
            }

            // Logging progres
			if (i > 0 && i % 2000 == 0) {
				console.log(`HGNC: ${i}/${data.length}`);
                await bg.closeBatch();
			}

            const { 
                symbol, 
                alias_symbol: alias_symbols,
                alias_name: alias_names,
                name, 
                omim_id: omim_ids, 
                rgd_id: rgd_ids, 
                ucsc_id: ucsc_id, 
                entrez_id, 
                ensembl_gene_id, 
                gene_group: gene_groups, 
                gene_group_id: gene_group_ids,
                location,
                locus_type,
                locus_group,
                status,
                vega_id,
                hgnc_id,
                ncbi_id,
                uniprot_ids,
                refseq_accession: refseq_accessions,
                pubmed_id: pubmed_ids,
                gene_family_id: gene_family_ids,
                gene_family: gene_families,
                ccds_ids,
                mgd_id: mgd_ids,
                enzyme_id: enzyme_ids,
                mane_select,
            } = gene;

            const rootGeneEntityId = await bg.createEntityNode('Gene', symbol);
            const geneEntityId = await bg.createEntityNode('Gene', `${symbol}-9606`);
            await bg.createEntityEdge(geneEntityId, rootGeneEntityId, 'IS_INSTANCE', {});
            await bg.createEntityEdge(geneEntityId, organismEntityId, 'FROM', {});

            await bg.createIdentifierNode(geneEntityId, 'name', 'Gene Symbol', symbol);
            await bg.createIdentifierNode(rootGeneEntityId, 'name', 'Gene Symbol', symbol);

            if (name != null) {
                await bg.createIdentifierNode(geneEntityId, 'name', 'Gene Name', name);
                await bg.createIdentifierNode(rootGeneEntityId, 'name', 'Gene Name', name);
            }

            if (entrez_id != null) {
                await bg.createIdentifierNode(geneEntityId, 'id', 'Entrez ID', entrez_id);
                await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Entrez ID', entrez_id);
            }

            if (ensembl_gene_id != null) {
                await bg.createIdentifierNode(geneEntityId, 'id', 'Ensembl Gene ID', ensembl_gene_id);
                await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Ensembl Gene ID', ensembl_gene_id);
            }

            if (vega_id != null) {
                await bg.createIdentifierNode(geneEntityId, 'id', 'Vega ID', vega_id);
                await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Vega ID', vega_id);
            }

            if (hgnc_id != null) {
                await bg.createIdentifierNode(geneEntityId, 'id', 'HGNC ID', hgnc_id);
                await bg.createIdentifierNode(rootGeneEntityId, 'id', 'HGNC ID', hgnc_id);
            }

            if (ncbi_id != null) {
                await bg.createIdentifierNode(geneEntityId, 'id', 'NCBI ID', ncbi_id);
                await bg.createIdentifierNode(rootGeneEntityId, 'id', 'HGNC ID', hgnc_id);
            }

            if (enzyme_ids != null) {
                for (const enzyme_id of enzyme_ids) {
                    await bg.createIdentifierNode(geneEntityId, 'id', 'Enzyme ID', enzyme_id);
                    await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Enzyme ID', enzyme_id);
                }
            }

            if (pubmed_ids != null) {
                for (const pubmed_id of pubmed_ids) {
                    await bg.createIdentifierNode(geneEntityId, 'id', 'Pubmed ID', pubmed_id);
                    await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Enzyme ID', pubmed_id);
                }
            }

            if (omim_ids != null) {
                for (const omim_id of omim_ids) {
                    await bg.createIdentifierNode(geneEntityId, 'id', 'OMIM ID', omim_id);
                    await bg.createIdentifierNode(rootGeneEntityId, 'id', 'OMIM ID', omim_id);
                }
            }

            if (rgd_ids != null) {
                for (const rgd_id of rgd_ids) {
                    await bg.createIdentifierNode(geneEntityId, 'id', 'Rat Gene Database ID', rgd_id);
                    await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Rat Gene Database ID', rgd_id);
                }
            }

            if (ucsc_id != null) {
                await bg.createIdentifierNode(geneEntityId, 'id', 'USCS ID', ucsc_id);
                await bg.createIdentifierNode(rootGeneEntityId, 'id', 'USCS ID', ucsc_id);
            }

            if (alias_symbols != null) {
                for (const alias_symbol of alias_symbols) {
                    await bg.createIdentifierNode(geneEntityId, 'id', 'Alias Symbol', alias_symbol);
                    await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Alias Symbol', alias_symbol);
                }
            }

            if (alias_names != null) {
                for (const alias_name of alias_names) {
                    await bg.createIdentifierNode(geneEntityId, 'id', 'Alias Name', alias_name);
                    await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Alias Symbol', alias_name);
                }
            }

            if (mgd_ids != null) {
                for (const mgd_id of mgd_ids) {
                    await bg.createIdentifierNode(geneEntityId, 'id', 'Mouse Gene Database ID', mgd_id);
                    await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Mouse Gene Database ID', mgd_id);
                }
            }

            if (ccds_ids != null) {
                for (const ccd_id of ccds_ids) {
                    await bg.createIdentifierNode(geneEntityId, 'id', 'Consensus CDS ID', ccd_id);
                    await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Consensus CDS ID', ccd_id);
                }
            }

            if (refseq_accessions != null) {
                for (const refseq_accession of refseq_accessions) {
                    await bg.createIdentifierNode(geneEntityId, 'id', 'RefSeq Accession', refseq_accession);
                    await bg.createIdentifierNode(rootGeneEntityId, 'id', 'RefSeq Accession', refseq_accession);
                }
            }

            if (gene_families != null) {
                for (const gene_family of gene_families) {
                    await bg.createIdentifierNode(geneEntityId, 'id', 'Gene Family', gene_family);
                    await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Gene Family', gene_family);
                }
            }

            if (gene_family_ids != null) {
                for (const gene_family_id of gene_family_ids) {
                    await bg.createIdentifierNode(geneEntityId, 'id', 'Gene Family ID', gene_family_id);
                    await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Gene Family ID', gene_family_id);
                }
            }

            if (mane_select != null) {
                const [ens_id, rep_seq_id] = mane_select;
                await bg.createIdentifierNode(geneEntityId, 'id', 'Representative Ensamble ID', ens_id);
                await bg.createIdentifierNode(geneEntityId, 'id', 'Representative Sequence ID', rep_seq_id);
                await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Representative Ensamble ID', ens_id);
                await bg.createIdentifierNode(rootGeneEntityId, 'id', 'Representative Sequence ID', rep_seq_id);
            }

            const locusEntityId = await bg.createEntityNode('Locus', location);
            await bg.createDataNode(locusEntityId, 'HGNC', { location });
            await bg.createIdentifierNode(locusEntityId, 'id', 'Location', location);
            await bg.createEntityEdge(geneEntityId, locusEntityId, 'FROM', {});

            const geneData = {
                location,
                locus_type,
                locus_group,
                status,
            }

            await bg.createDataNode(geneEntityId, 'HGNC', geneData);

             // UniProt ids
             if (uniprot_ids != null) {
                for (const uniprot_id of uniprot_ids) {
                    const proteinEntityId = await bg.createEntityNode('Protein', uniprot_id);
                    await bg.createIdentifierNode(proteinEntityId, 'id', 'UniProt ID', uniprot_id);
                    await bg.createEntityEdge(proteinEntityId, geneEntityId, 'FROM', {});
                    await bg.createEntityEdge(proteinEntityId, organismEntityId, 'FROM', {});
                }
            }

            
        }

        console.log(`HGNC: ${data.length}/${data.length}`)

        // Finish and commit the import
        await bg.finishImport();
        console.log('HGNC import complete');
    }
}

module.exports = DisprotImporter;