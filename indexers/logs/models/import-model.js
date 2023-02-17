const { DataTypes } = require('sequelize');

module.exports = (db) => db.define('Import', {

id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    },
    importer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  importer_version: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  import_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  datasource: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {

});

