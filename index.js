import ethers from "ethers";
import { MongoClient, ServerApiVersion } from "mongodb";
import { hexToAddress, hexToNumber, isTimestampReady, apiCall } from "./utils.js";
import { config } from "dotenv";
    config({ path: process.ENV })

const uri = `${process.env.MONGO_DB_URI}`;

async function main() {
console.log("\n Event listener started")
const provider = new ethers.providers.AlchemyProvider('mainnet', process.env.ALCHEMY_API_KEY);
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
const db = client.db("UpworkProject");


const filter = {
    address: process.env.CONTRACT_ADDRESS,
    topics: [
        process.env.TOPIC_HEX_CODE
    ]
}
console.log(`\n __________ \n \n Listening to contract: ${filter.address} \n __________ \n \n topics: ${filter.topics}`)
provider.on(filter, (log, event) => {

    // constants defined here for clarity purposes.
    const topics = log.topics;
    const chain = topics[0];
    const contractAddress = topics[1];
    const tokenId = topics[2];
    const futureExecutionDate = topics[3];

    const isReadyForApiCall = isTimestampReady(log);

    if (isReadyForApiCall){
        
        apiCall(hexToAddress(contractAddress), hexToAddress(tokenId));
       
    } else {
        const insertEvent = db
            .collection('futureEventsLog')
            .insertOne(
                { log }
            )
        console.log(`Found event with future action requirement. \n ____________ \n`)   
        console.log(`Storing event at database.`)
        
    }
})
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });