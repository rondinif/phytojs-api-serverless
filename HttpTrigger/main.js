import 'isomorphic-fetch';
import { Phyto } from '@rondinif/phytojs';
// import { fail } from 'assert';
const phyto = new Phyto(fetch);
const redis = require('redis');


const redisCacheHostName = process.env.REDIS_CACHE_HOST_NAME;
const redisCacheHostPort = process.env.REDIS_CACHE_HOST_PORT;
let redisClientOptions = {
    retry_strategy: function (options) {
        // End reconnecting with built in error
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            // return new Error('Retry time exhausted');
            return undefined;
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    }
};
// Don't include REDISCACHEKEY in local.settings.json if you are testing with the local.dev redis server
if (process.env.REDIS_CACHE_KEY) {
    redisClientOptions.auth_pass =  process.env.REDIS_CACHE_KEY;
    redisClientOptions.tls =  { servername: process.env.REDIS_CACHE_HOST_NAME };
}

const client = redis.createClient(redisCacheHostPort, redisCacheHostName, redisClientOptions);

client.on('connect', function () {
    console.log('Redis client connected');
});

client.on('error', async function (err) {
    const errorMessage = 'Something went wrong ' + err;
    console.log(errorMessage);
});

async function getPromiseOfResutByName({ context }, name) {
    // ##DEBUG: context.log(process.env);
    return new Promise(async (resolve, reject) => {
        if (client.connected) {
            client.get(name, async function (error, result) {
                if (error) {
                    context.log(error);
                    throw error;
                }
                if (result) {
                    context.log(`FOUND CACHED result for ${name}`);
                    resolve(result)
                }
                else {
                    context.log(`NO CACHED result for ${name}`);
                    const queryResult = await phyto.resolvedPlantsByName(name);
                    client.set(name, JSON.stringify(queryResult), redis.print);
                    context.log(`CACHED result for name:${name}`);
                    resolve(JSON.stringify(queryResult));
                }
            });
        }
        else {
            context.log('WORKING WITHOUT REDIS BECAUSE REDIS CLIENT IS NOT CONNECTED');
            const queryResult = await phyto.resolvedPlantsByName(name);

            context.log(`NOT CACHED result for name:${name}`);
            resolve(JSON.stringify(queryResult));
        }
    }); // new Promise
}

module.exports = async function (context, req, name ) {
    context.log('JavaScript HTTP trigger function processed a request.');
    if (req.params['name'] || req.query.name || (req.body && req.body.name)) {
        const pname = req.params['name'] || req.query.name || req.body.name;
        const promise = getPromiseOfResutByName({ context }, pname);
        const resultJsonString = await (promise);
        context.res = {
            status: 200,
            body: resultJsonString,
            headers: {
                'Content-Type': 'application/json'
            }
        }
        // This section was added because of azure fuctions cors management does't works as stated in http://blog.timwheeler.io/cors-and-azure-functions/
        // reference: https://blogs.msdn.microsoft.com/benjaminperkins/2017/04/12/azure-functions-access-control-allow-credentials-with-cors/ and 
        context.res.headers["Access-Control-Allow-Origin"] =  "*";
        context.res.headers["Access-Control-Allow-Headers"] =
          "Origin, X-Requeted-With, Content-Type, Accept, Authorization, RBR";
        if (req.headers.origin) {
            context.res.headers["Access-Control-Allow-Origin"] = req.headers.origin;
        }
        if (req.method === 'OPTIONS') {
          context.res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE";
        }
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a name of the plant you want to be resolved on the request body"
        };
    }
    context.log('JavaScript HTTP trigger function exit.');
};