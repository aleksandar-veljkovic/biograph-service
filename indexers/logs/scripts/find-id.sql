SELECT
    DISTINCT i.value
FROM
    EntityIdentifiers ei
    JOIN Entries e ON ei.entity_id = e.id 
    JOIN Identifiers i ON i.entry_id = ei.entry_id AND i.identifier_type = 'name'
WHERE
    e.primary_id = ?
LIMIT
    5;