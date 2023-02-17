DROP TABLE IF EXISTS description_index;
CREATE VIRTUAL TABLE IF NOT EXISTS description_index USING fts5(content="EntityDescriptions", entity_id, description_text);