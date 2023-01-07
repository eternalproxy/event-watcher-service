import ethers from "ethers";
import { MongoClient, ServerApiVersion } from "mongodb";
import { config } from "dotenv";
import axios from "axios";

config({ path: process.ENV })

const uri = `${process.env.MONGO_DB_URI}`;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
const db = client.db("event-watcher");

const apiCall = (contractAddress, tokenId, chain, log, futureExecutionDate) => {
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
  console.log("\n Event listener starting")
  const provider = new ethers.providers.AlchemyProvider('goerli', process.env.ALCHEMY_API_KEY);

  const filter = {
    address: process.env.CONTRACT_ADDRESS,
    topics: [
      process.env.TOPIC_HEX_CODE
    ]
  }
  console.log(`\n __________ \n \n Listening to contract: ${filter.address} \n __________ \n \n topics: ${filter.topics}`)
  provider.on(filter, (log, event) => {

    console.log(log);

    const decodedData = ethers.utils.defaultAbiCoder.decode(
      ['uint256', 'address', 'uint256', 'uint256'],
      log.data
    )

    console.log(decodedData);

    const chain = decodedData[0];
    const contractAddress = decodedData[1];
    const tokenId = decodedData[2];
    const futureExecutionDate = decodedData[3];

    try {
      apiCall(contractAddress, tokenId, chain, futureExecutionDate, log);
      db
        .collection('successLog')
        .insertOne(
          { chain: chain, 
            chainString: chain.toString(), 
            contract: contractAddress, 
            tokenId: tokenId, 
            tokenIdString: tokenId.toString(), 
            futureExecutionDate: futureExecutionDate, 
            futureExecutionDateString: futureExecutionDate.toString(), 
            log: log }
        )
      console.log("Succesfull api call")
    }
    catch (e) {
      db
        .collection('errorLog')
        .insertOne(
          { chain: chain, 
            chainString: chain.toString(), 
            contract: contractAddress, 
            tokenId: tokenId, 
            tokenIdString: tokenId.toString(), 
            futureExecutionDate: futureExecutionDate, 
            futureExecutionDateString: futureExecutionDate.toString(),
            log: log }
        )
      console.log("Failed api call")
    }

    if (futureExecutionDate != 0) {
      const insertEvent = db
        .collection('futureEventsLog')
        .insertOne(
          { chain: chain, 
            chainString: chain.toString(), 
            contract: contractAddress, 
            tokenId: tokenId, 
            tokenIdString: tokenId.toString(), 
            futureExecutionDate: futureExecutionDate, 
            futureExecutionDateString: futureExecutionDate.toString() }
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