const { DataTypes } = require('sequelize');

module.exports = (db) => db.define('Entity_Descriptions', {

  entry_id: {
    type: DataTypes.STRING,
    allowNull: false,
    
  },
  entity_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
}, {
  indexes: [
    { type: 'FULLTEXT', name: 'description_text_idx', fields: ['description_text'] },
    { name: 'description_entity_id_idx', fields: ['entity_id'] },
    // { unique: true, name: 'description_unique_idx', fields: ['entity_id', 'entry_id'] },
  ]
});