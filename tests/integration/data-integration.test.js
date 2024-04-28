const {client} = require("../../db");
const axios = require("axios");


describe("Data analyzer integration tests", ()=>{

    it('should get all the offsets', async ()=>{
       
            await client.connect();

            client.query("SELECT * FROM offset_values").then(async (offsetVals) => {
                expect(offsetVals.rows).toContainEqual(expect.objectContaining({ generation: 4 }));
                expect(offsetVals.rows).toContainEqual(expect.objectContaining({ moves_offset_limit: 165 }));
                expect(offsetVals.rows).toContainEqual(expect.objectContaining({ species_offset_limit: 151 }));
    
    
                await client.end();
           
            });
     
    });

    it('should return correct generation data from pokeApi server', async ()=>{
        const pokeUrl = "https://pokeapi.co/api/v2/";
        const pokeGenUrl = pokeUrl+"generation/1";

        const opt = {
            method: "GET",
            url: pokeGenUrl
        }; 

        axios.request(opt).then(res=>{
            expect(res.data).toMatchObject({id: 1, name: "generation-i"});
        });  
    });


});