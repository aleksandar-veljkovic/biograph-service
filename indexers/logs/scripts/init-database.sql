-- Initialize imports table
CREATE TABLE IF NOT EXISTS Imports (
    id STRING PRIMARY KEY NOT NULL,
    importer STRING NOT NULL,
    importer_version REAL NOT NULL,
    import_date DATE NOT NULL,
    datasource STRING NOT NULL
);

-- Initialize entries table
CREATE TABLE IF NOT EXISTS Entries (
    id STRING PRIMARY KEY NOT NULL,
    entry_type STRING NOT NULL,
    is_edge BOOLEAN NOT NULL,
    primary_id STRING
);

CREATE INDEX IF NOT EXISTS entriesEntryTypeIndex ON Entries(entry_type);
CREATE INDEX IF NOT EXISTS entriesPrimaryIdIndex ON Entries(primary_id);

-- Initialize entries-imports table
CREATE TABLE IF NOT EXISTS EntriesImports (
    import_id STRING NOT NULL,
    entry_id STRING NOT NULL,
    batch_id INT NOT NULL,
    FOREIGN KEY (import_id) REFERENCES Imports(id),
    FOREIGN KEY (entry_id) REFERENCES Entries(id)
);

-- Initialize entity descriptions table
CREATE TABLE IF NOT EXISTS EntityDescriptions (
    entry_id STRING NOT NULL,
    entity_id STRING NOT NULL,
    description_text TEXT NOT NULL,
    FOREIGN KEY (entity_id) REFERENCES Entries(id)
);

CREATE INDEX IF NOT EXISTS entityDescriptionsEntityIdIndex ON EntityDescriptions(entity_id);

-- Initialize entity identifiers table
CREATE TABLE IF NOT EXISTS EntityIdentifiers (
    entry_id STRING NOT NULL,
    entity_id STRING NOT NULL,
    FOREIGN KEY (entity_id) REFERENCES Entries(id)
    FOREIGN KEY (entry_id) REFERENCES Entries(id)
);

CREATE INDEX IF NOT EXISTS entryIdentifiersEntityIdIndex ON EntityIdentifiers(entity_id);
CREATE INDEX IF NOT EXISTS entryIdentifiersEntryIdIndex ON EntityIdentifiers(entry_id);

CREATE TABLE IF NOT EXISTS Identifiers (
    entry_id STRING NOT NULL,
    identifier_type STRING NOT NULL,
    value STRING NOT NULL,
    is_primary BOOLEAN NOT NULL,
    FOREIGN KEY (entry_id) REFERENCES Entries(id)
);

CREATE INDEX IF NOT EXISTS identifiersValueIndex ON Identifiers(value);

-- Initialize description table index
CREATE VIRTUAL TABLE IF NOT EXISTS description_index USING fts5(content="EntityDescriptions", entity_id, description_text);
CREATE VIRTUAL TABLE IF NOT EXISTS identifier_index USING fts5(content="Identifiers", entry_id, value);
