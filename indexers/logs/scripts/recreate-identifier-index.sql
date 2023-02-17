DROP TABLE IF EXISTS identifier_index;
CREATE VIRTUAL TABLE IF NOT EXISTS identifier_index USING fts5(content="Identifiers", entry_id, value);
