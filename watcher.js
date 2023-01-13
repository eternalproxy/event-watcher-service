import ethers from "ethers";
import { MongoClient, ServerApiVersion } from "mongodb";
import { config } from "dotenv";
import fetch from 'node-fetch';

config({ path: process.ENV })

const uri = `${process.env.MONGO_DB_URI}`;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
const db = client.db("eps-event-watcher");

const openSeaKey = process.env.OPEN_SEA_API_KEY;

const apiCall = (contractAddress, tokenId) => {

  const options = { method: 'GET', headers: { 'X-API-KEY': openSeaKey } };

  fetch(`https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`, options)
    .then(response => response.json())
    .then(response => console.log(response))
    .catch(err => console.log(err));
}

async function main() {

  console.log("\n Event listener starting")
  const provider = new ethers.providers.AlchemyProvider(process.env.CHAIN_NAME, process.env.ALCHEMY_API_KEY);

  const filter = {
    address: process.env.CONTRACT_ADDRESS,
    topics: [
      process.env.TOPIC_HEX_CODE
    ]
  }

  db
    .collection('activityLog')
    .insertOne(
      {
        service: "watcher",
        action: "started",
        timestamp: Math.round(Date.now() / 1000)
      }
    )

  console.log(`\n __________ \n \n Listening to contract: ${filter.address} \n __________ \n \n topics: ${filter.topics}`)
  provider.on(filter, (log, event) => {

    const decodedData = ethers.utils.defaultAbiCoder.decode(
      ['uint256', 'address', 'uint256', 'uint256'],
      log.data
    )

    const chain = decodedData[0];
    const contractAddress = decodedData[1];
    const tokenId = decodedData[2];
    const futureExecutionDate = decodedData[3];

    // convert unix timestamp to milliseconds
    const ts_ms = futureExecutionDate * 1000;

    // initialize new Date object
    const date_ob = new Date(ts_ms);

    // year as 4 digits (YYYY)
    const year = date_ob.getFullYear();

    // month as 2 digits (MM)
    const month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // date as 2 digits (DD)
    const date = ("0" + date_ob.getDate()).slice(-2);

    // date as YYYY-MM-DD format
    const futureExecutionDateYYYMMDD = (year + "-" + month + "-" + date);

    console.log(chain)

    console.log(chain == 1)

    try {
      apiCall(contractAddress, tokenId);
      db
        .collection('successLog')
        .insertOne(
          {
            event: "eventCaught",
            chain: chain,
            chainString: chain.toString(),
            contract: contractAddress,
            tokenId: tokenId,
            tokenIdString: tokenId.toString(),
            futureExecutionDate: futureExecutionDate,
            futureExecutionDateString: futureExecutionDate.toString(),
            futureExecutionDateYYYMMDD: futureExecutionDateYYYMMDD,
            log: log
          }
        )
      console.log("Succesfull api call")
    }
    catch (e) {
      db
        .collection('errorLog')
        .insertOne(
          {
            event: "eventCaught",
            chain: chain,
            chainString: chain.toString(),
            contract: contractAddress,
            tokenId: tokenId,
            tokenIdString: tokenId.toString(),
            futureExecutionDate: futureExecutionDate,
            futureExecutionDateString: futureExecutionDate.toString(),
            futureExecutionDateYYYMMDD: futureExecutionDateYYYMMDD,
            log: log
          }
        )
      console.log("Failed api call")
    }

    if (futureExecutionDate != 0) {
      const insertEvent = db
        .collection('futureEvents')
        .insertOne(
          {
            chain: chain,
            chainString: chain.toString(),
            contract: contractAddress,
            tokenId: tokenId,
            tokenIdString: tokenId.toString(),
            futureExecutionDate: futureExecutionDate,
            futureExecutionDateString: futureExecutionDate.toString(),
            futureExecutionDateYYYMMDD: futureExecutionDateYYYMMDD,
          }
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