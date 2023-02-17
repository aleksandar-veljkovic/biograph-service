const { DataTypes } = require('sequelize');

module.exports = (db) => db.define('Identifiers', {

    entry_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    identifier_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    value_hash: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    is_primary: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
}, {
    indexes: [
        // {
        //     unique: false,
        //     name: 'identifiers_value_idx',
        //     fields: ['value']
        // },
        { type: 'FULLTEXT', name: 'identifier_value_text_idx', fields: ['value'] },
        { unique: true, name: 'identifiers_unique_idx', fields: ['entry_id', 'identifier_type', 'value_hash'] },
    ]
});