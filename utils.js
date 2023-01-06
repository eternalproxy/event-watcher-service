import axios from "axios";
import { config } from "dotenv";
    config({ path: process.ENV })
    
const hexToAddress = (hexValue) => {
    return `0x${hexValue.slice(26)}`;
}

const hexToNumber = (hexValue) => {
    return parseInt(hexValue, 16);
}

const isTimestampReady = (eventLog) => {
    
    let now = Math.round(Date.now()/1000);
    if (hexToNumber(eventLog.topics[3]) >= now){
        return false;
    } else{
        return true;
    }
}

const openSeaKey = process.env.OPEN_SEA_API_KEY;

const apiCall = (contractAddress, tokenId) =>{
    return axios.get(`https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`, { headers: {'X-API-KEY': openSeaKey} })
        .then((res) => {
                
            try{
                const insertSuccessEvent = db
                    .collection('succesLog')
                    .insertOne(
                        log 
                    )
                    console.log(`Succesfull api call made to: https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`)
                        return true;
                }
            catch(e){ 
                const insertErrorEvent = db
                    .collection('errorLog')
                    .insertOne(
                        log
                    )
                    console.log(`Failed api call made to: https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`)
                        return false;
                } 
        
        });
}

export { hexToAddress, hexToNumber, isTimestampReady, apiCall }