module.exports = {
    db: {
        dbms: 'neo4j',
        host: 'neo4j://localhost',
        port: 7687,
        database: 'neo4j',
        username: 'neo4j',
        password: 'password',
        homePath: 'D:/neo4j-community-4.4.11'
    },
    catalog: {
        dbms: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'biograph_catalog',
        username: 'admin',
        password: 'password'
    },
    api: {
        host: '127.0.0.1',
        port: '8765',
        appName: 'BioGraph Service'
    }
}