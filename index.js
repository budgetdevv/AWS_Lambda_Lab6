// // Import mysql library
// import mysql from 'mysql';
//
// // Connect to the Amazon DBS companies\_job that was created in Lab 03
// const con = mysql.createConnection({
//     host: "companies-jobs.cnl7vfgucvoi.us-east-1.rds.amazonaws.com",
//     user: "admin",
//     password: "password",
//     port: "3306",
//     database: "companies_jobs"
// });
//
// export const handler = (event, context, callback) => {
//     let sql;
//     context.callbackWaitsForEmptyEventLoop = false;
//     sql = "SELECT * from `companies_jobs`.`jobs`;";
//
//     con.query(sql, function (err, result) {
//         if (err) throw err;
//         return callback(null, result);
//     });
// };


// Import mysql library
import mysql from 'mysql2/promise';
import fs from 'fs/promises';

class DatabaseConfig
{
    host;
    user;
    password;
    port;
    database_name;

    constructor()
    {
        this.host = "( Input host here )";
        this.user = "( Input user here )";
        this.password = "( Input password here )";
        this.port = "( Input port here )";
        this.database_name = "( Input database name here )";
    }
}

class DBQueryResult
{
    data;
    column_definitions;
    error;
}


async function tryQueryDB(connection, query, parameters=null)
{
    /**
     * @type { DBQueryResult }
     */
    let result = {};

    try
    {
        const resultPair = await connection.query(query, parameters);
        // Second item is column definitions
        result.data = resultPair[0];
        result.column_definitions = resultPair[1];
    }

    catch (ERROR)
    {
        result.error = ERROR;
    }

    return result;
}

export const handler = async (event, context, callback) =>
{
    let sql;
    context.callbackWaitsForEmptyEventLoop = false;

    try
    {
        let config;

        const DB_CONFIG_PATH = "DatabaseConfig.json";

        try
        {
            // Read the connection details from the config.json file
            const configData = await fs.readFile(DB_CONFIG_PATH);

            /**
             * @type { DatabaseConfig }
             */

            config = JSON.parse(configData.toString());
        }

        catch (error)
        {
            console.error(```Error while reading ${DB_CONFIG_PATH}. Regenerating config...\nError: ${error}```);

            let json = JSON.stringify(new DatabaseConfig());

            await fs.writeFile(DB_CONFIG_PATH, json);

            return callback(error);
        }

        // Connect to the Amazon DBS companies\_job that was created in Lab 03
        const connection = await mysql.createConnection(
            {
                host: config.host,
                user: config.user,
                password: config.password,
                port: config.port,
                database: config.database_name
            });

        let query = "SELECT * from `companies_jobs`.`jobs`;";

        let result = await tryQueryDB(connection, query);

        let error = result.error;

        if (error != null){
            throw error;
        }

        return callback(null, result.data);
    }

    catch (err)
    {
        console.error('Error reading config file or connecting to database:', err);
        return callback(err);
    }
};