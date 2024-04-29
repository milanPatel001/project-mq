const amqp = require('amqplib');
const {getDataFromDB, getOffsetValues} = require("./db.js");
const {analyzeData} = require("./utils.js");
const cors = require("cors");
require('dotenv').config();

const port = process.env.PORT || process.env.DATA_ANALYZER_PORT;
let offsets = [];

async function main(){

    //get offset table
    getOffsetValues().then(async (r)=>{
        console.log("Got all the offsets....");
        offsets = r.rows.slice();

        connectToMQ().then(async (channel)=>  {
            await getMessagesFromDataCollector(channel);

            const app = require("express")();

            app.use(cors());

            app.get("/:gen", async (req,res)=>{

                const gen =  Number(req.params.gen);

                if(gen < 1 || gen > 9) {
                    return res.status(404).send(`There's no generation ${gen} in pokemon...`);
                }else{

                    const offsetObj = offsets[gen-1];

                    if(offsetObj){
                        //console.log(offsetObj);
        
                        const collectMsg = {
                            current_moves_offset: (offsetObj.moves_offset < offsetObj.moves_offset_limit) ?  offsetObj.moves_offset : -1,
                            current_species_offset: (offsetObj.species_offset < offsetObj.species_offset_limit) ? offsetObj.species_offset : -1,
                            generation: offsetObj.generation
                        };
                        
                        
                        //send msg to dc if offset not reached {current_specie_offset ,current_move_offset, id, generation}
                        if((offsetObj.moves_offset !== -1 &&  offsetObj.moves_offset < offsetObj.moves_offset_limit) || (offsetObj.species_offset !== -1 && offsetObj.species_offset < offsetObj.species_offset_limit)){
                            channel.publish("ex", "collect", Buffer.from(JSON.stringify(collectMsg)));
        
                        }
        
                        // if its first offset, just send wait status to frontend
                        if(offsetObj.moves_offset === 0 && offsetObj.species_offset === 0){
                            return res.status(200).send({wait: true});
                        }
                                
        
                        // get items from db if atleast 10 available (could skip if genData is already a global var)
                        
                        try{

                            const {currentGenMoveSet, currentGenPokemonSet} = await getDataFromDB(gen);
                            //analyze the data
                            const analyzedData = analyzeData(currentGenMoveSet, currentGenPokemonSet);
                            
                            return res.status(200).send(analyzedData);
                        
                            
                        }catch(ex){
                            return res.status(500);
                        }

                    }
                
                }
            
            });
            
            
            app.listen(port, async ()=>{
                console.log(`Data collector listening at port ${port}...`);
            });

        });
    }).catch(ex=>console.log(ex));
    
}

main().catch(ex=>console.error(ex));


async function getMessagesFromDataCollector(channel){
    try{
           
        await channel.consume("cta", (msg)=>{
            const nextOffsetMsg = JSON.parse(msg.content);

            console.log(`Got msg from DC:`);
            console.log(nextOffsetMsg);

            offsets[nextOffsetMsg.generation-1].moves_offset = nextOffsetMsg.next_moves_offset;
            offsets[nextOffsetMsg.generation-1].species_offset = nextOffsetMsg.next_species_offset;

            console.log(offsets[nextOffsetMsg.generation-1]);

            channel.ack(msg);
        });

    }catch(ex){
        console.error(ex);
    }

}

async function connectToMQ(){
    try{

        const amqp_connection = await amqp.connect(process.env.MQ_URL || process.env.CLOUDAMQP_URL);
        const channel = await amqp_connection.createChannel();
        
        await channel.assertExchange("ex","direct",{durable: false});

        await channel.assertQueue("cta");
        await channel.assertQueue("atc");


        await channel.bindQueue("cta", "ex", "data");
        await channel.bindQueue("atc", "ex", "collect");

        return channel;

    }catch(ex){
        console.log(ex);
    }
}

