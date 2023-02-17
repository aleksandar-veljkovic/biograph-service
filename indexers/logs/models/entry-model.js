const { DataTypes } = require('sequelize');

module.exports = (db) => db.define('Entries', {

  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  entry_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
//   is_edge: {
//     type: DataTypes.BOOLEAN,
//     allowNull: false,
//   },
  primary_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
    indexes:[
        { 
            unique: false, 
            name: 'entries_entry_type_idx', 
            fields: ['entry_type'] 
        },
        { 
            unique: false, 
            name: 'entries_primary_id_idx', 
            fields: ['primary_id'] 
        },
    ]
});