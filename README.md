# Node.js event listener with MongoDB integration.

To run:

Event watch:

npm install pm2 -g; git clone https://github.com/eternalproxy/event-watcher-service && cd event-watcher-service; npm install; pm2 start watcher.js --max-memory-restart 300M; pm2 start watcher-goerli.js --max-memory-restart 300M;

Rerun:

npm install pm2 -g; git clone https://github.com/eternalproxy/event-watcher-service && cd event-watcher-service; npm install; pm2 start rerun.js --max-memory-restart 600M;


List running services: pm2 list



## Brief Description

This application is comprised of two features. The first one is the live block catcher. It is a websocket that sees new events and evaluates
whether the event's futureExecutionDate is smaller or equal to now. 
If it is, it does the api call and adds the event to the succesLog.
    If the api call fails, the event is added to the errorLog.
If futureExecutionDate is bigger than now, the event gets stored in the futureEvents table.

The second feature is the review.js application. It iterates with all futureEvents table rows looking for ones where the futureExecutionDate is smaller or equal to now.
In case it finds one, it attempts to do the api call and only deletes the table row if the call is succesfull.

## Get Started

```
npm install  
```
Create a .env file with your KEYS and relevant parameters. You can follow .env.example.

Open two terminal instances
In the first one run:
```
node index.js
```

At the second:
```
node review.js
```

Voilà! The event listener is live.
I do not recommend trying to run both applications in a single program as their working logic is fundamentally different. The first one is based on WebSockets and the second on recursion, so there's a much higher risk of encountering faulty runtime edge-cases. 

## How to get the keys:
ALCHEMY_API_KEY: https://docs.alchemy.com/docs/alchemy-quickstart-guide

OPEN_SEA_API_KEY: https://docs.opensea.io/reference/request-an-api-key

MONGO_DB_URI: https://www.mongodb.com/basics/get-started

## Visualizing your Data:
Download MongoDB compass: https://www.mongodb.com/try/download/compass
Paste the connection URI at the URI field. Click the connect button.


