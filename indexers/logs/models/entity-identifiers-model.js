const { DataTypes } = require('sequelize');

module.exports = (db) => db.define('Entity_Identifiers', {
    entry_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      entity_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
}, {
    indexes: [
        { name: 'enitity_identifiers_entity_id_idx', fields: ['entity_id'] },
        { name: 'enitity_identifiers_entry_id_idx', fields: ['entry_id'] },
        { unique: true, name: 'entity_identifiers_unique_idx', fields: ['entity_id', 'entry_id'] },
    ]
});