const { DataTypes } = require('sequelize');

module.exports = (db) => db.define('Entries_Imports', {

  import_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  batch_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entry_id: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
});