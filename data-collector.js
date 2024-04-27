const app = require("express")()
const amqp = require('amqplib')
const {getMoves, getSpecies, getGenerationsData} = require("./db.js");
require('dotenv').config();


const port = process.env.DATA_COLLECTOR_PORT;
const pokeUrl = "https://pokeapi.co/api/v2/";

async function main(){
    
    app.listen(port, async ()=>{
        getGenerationsData().then(async (genData)=>{
           
            //console.log(genData);

            try{
                const channel = await connectToMQ();
                await getMessageFromDataAnalyzer(channel, genData);
            }catch(ex){
                console.log(ex);
            }
        }).catch(ex=>console.log(ex));
       
        console.log(`Data collector listening at port ${port}...`)
    });
}

main().catch(ex=>console.error(ex));



async function getMessageFromDataAnalyzer(channel, genData){
  
    try{
        await channel.consume("atc", async (msg)=>{
            
            const m = JSON.parse(msg.content);

            console.log(`Got msg to collect data...`);
            console.log(m);

            await getMoves(m, genData);
            await getSpecies(m, genData);

        
            channel.publish("ex","data",Buffer.from(JSON.stringify({
                next_moves_offset: m.current_moves_offset + 10,
                next_species_offset: m.current_species_offset + 10,
                generation: m.generation
            })));

            channel.ack(msg);
            
        });
    }catch(ex){
        console.log(ex);
    }

    console.log("Waiting for msgs...");

}


async function connectToMQ(){
    try{
        const amqp_connection = await amqp.connect(process.env.MQ_URL || process.env.CLOUDAMQP_URL);
        const channel = await amqp_connection.createChannel();
        
        await channel.assertExchange("ex","direct",{durable: false});

        //await channel.assertQueue("cta");
        await channel.assertQueue("atc");


        // await channel.bindQueue("cta", "ex", "data");
        // await channel.bindQueue("atc", "ex", "collect");

        return channel;

    }catch(ex){
        console.log(ex);
    }
}

