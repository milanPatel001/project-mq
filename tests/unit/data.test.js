const {pool, getDataFromDB, getOffsetValues, getGenerationsData} = require("../../db.js");
const {analyzeData}  = require("../../utils.js");
const axios = require("axios");

jest.mock("axios");

describe('Getting data from db ', ()=>{

    it('should get offset values', async () => {
        pool.query = jest.fn().mockResolvedValue([{generation: 1,moves_offset: 0, species_offset: 0, moves_offset_limit: 165, species_offset_limit: 151}]);
        const data = await getOffsetValues();

        expect(data).toContainEqual({generation: 1,moves_offset: 0, species_offset: 0, moves_offset_limit: 165, species_offset_limit: 151});
    });

    it('should get current gen data', async () => {
        pool.query = jest.fn().mockImplementation((text, ...values)=>{
            if(text == "SELECT * FROM generation WHERE id=$1" && values[0]==1){
                return Promise.resolve({
                    rows: [{
                        moves: ["air kick", "jet storm", "ice punch"],
                        species: ["pikachu", "raichu", "pichu"]
                    }]
                });
            }else if(text == "SELECT * FROM move"){
                return Promise.resolve({
                    rows: [ {name: "air kick"}, 
                            {name: "thunder punch"}, 
                            {name: "ice punch"}, 
                            {name: "jet storm"}, 
                            {name: "pound"}]
                });
            }else if(text == "SELECT * FROM pokemon"){
                return Promise.resolve({
                    rows: [{name: "raichu"}, 
                           {name: "bulbasaur"}, 
                           {name: "pichu"}, 
                           {name: "pikachu"}, 
                           {name: "arceus"}]
                });
            }
        });

        const {currentGenMoveSet, currentGenPokemonSet} = await getDataFromDB(1);

        expect(currentGenMoveSet).toContainEqual({name: "ice punch"});
        expect(currentGenPokemonSet).toContainEqual({name: "raichu"});
    })

    it('should get all the generations data', async ()=>{
        pool.query = jest.fn().mockResolvedValue({
                rows: [1,2,3,4]
        });

        axios.request = jest.fn().mockImplementation((opt)=>{
            const s = opt.url.split("/");
            const id = s[s.length - 1];

            return Promise.resolve({data: {
                    id,
                    name: "generation"+id,
                    moves: [{name: "move"+id}],
                    pokemon_species: [{name: "specie"+id}],
                    types: [{name: "type"+id}],
                }
            });
        })

        const genData = await getGenerationsData();

        expect(genData[1].id).toBe("2");
        expect(genData[5].name).toBe("generation6");
        expect(genData[3].moves[0][0]).toBe("move4");
    });
 
});

describe('Analyzing the data', ()=>{
    it('should return correct analyzed data', ()=>{
        const currentGenMoveSet = [
            {power: 28, accuracy: 100, pp: 20},
            {power: 74, accuracy: 22, pp: 10},
            {power: 56, accuracy: 58, pp: 17},
            {power: 92, accuracy: 77, pp: 15},
        ];
        
        const currentGenPokemonSet = [
            {name: "Goldot", types: ["psychic","normal"]},
            {name: "Triquil", types: ["grass", "normal"]},
            {name: "Axio", types: ["psychic","normal","dragon"]},
        ];

        const {topTenMovesAccuracy, topTenMovesAgainstHighDefense, topTenMovesAgainstHighHP, topTenMovesAgainstHighSpeed, topTenMovesPower, typeCount} = analyzeData(currentGenMoveSet, currentGenPokemonSet);
    
        expect(topTenMovesAccuracy[0].accuracy).toBe(100);
        expect(topTenMovesPower[1].power).toBe(74);
        expect(topTenMovesAgainstHighDefense[1].power).toBe(28);
        expect(topTenMovesAgainstHighHP[0].power).toBe(92);
        expect(topTenMovesAgainstHighSpeed[0].accuracy).toBe(77);
        expect(typeCount["psychic"]).toBe(2);
    
    })
});