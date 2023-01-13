import { MongoClient, ServerApiVersion } from "mongodb";
import axios from "axios";

import { config } from "dotenv";

config({ path: process.ENV })

const uri = `${process.env.MONGO_DB_URI}`;

const isTimestampReady = (futureExecutionDate) => {

  let now = Math.round(Date.now() / 1000);
  console.log(futureExecutionDate, now);
  if (futureExecutionDate >= now) {
    return false;
  } else {
    return true;
  }
}

const apiCall = (contractAddress, tokenId, chain) => {
  //return axios.get(`https://testnets-api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`, { headers: {'X-API-KEY': openSeaKey} })
  let url;
  if (chain == 1) {
    url = `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`;
  } else {
    url = `https://testnets-api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`;
  }
  return axios.get(url);
}


async function main() {
  console.log("\n Old events checker")
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
  const db = client.db("eps-event-watcher");

  db
  .collection('activityLog')
  .insertOne(
    {
      service: "rerun",
      action: "started",
      timestamp: Math.round(Date.now() / 1000)
    }
  )

  console.log(`\n __________ \n \n Checking database for refresh events.\n __________ \n \n`)

  let resArray = [];
  let i = 1;
  var myCursor = await db.collection("futureEvents").find({});
  let count = 0;
  while (i != 0) {
    var document = await myCursor.hasNext() ? await myCursor.next() : i--;

    if (document != 1) {

      if (isTimestampReady(document.futureExecutionDateString)) {

        try {
          apiCall(document.contract, document.tokenIdString, document.chain);
          db
            .collection('successLog')
            .insertOne(
              {
                event: "rerunCall",
                chain: document.chain,
                chainString: document.chainString,
                contract: document.contract,
                tokenId: document.tokenId,
                tokenIdString: document.tokenIdString,
                futureExecutionDate: document.futureExecutionDate,
                futureExecutionDateString: document.futureExecutionDateString
              }
            )
          console.log("Succesfull rerun api call")

          const deleteAction = await db.collection("futureEvents").deleteOne(document)
          console.log(deleteAction);

        }
        catch (e) {
          db
            .collection('errorLog')
            .insertOne(
              {
                event: "rerunCall",
                chain: document.chain,
                chainString: document.chain.toString(),
                contract: document.contract,
                tokenId: document.tokenId,
                tokenIdString: document.tokenIdString,
                futureExecutionDate: document.futureExecutionDate,
                futureExecutionDateString: document.futureExecutionDateString
              }
            )
          console.log("Failed api call")
        }

      }
      count++;
    }
  }
  console.log(`Succesfully checked ${count} documents`)
  console.log('Waiting 5 before new checks')
  setTimeout(function () { console.log('Reestarting checks'); main(); }, 300000);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});