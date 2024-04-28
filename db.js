const {Pool, Client} = require("pg");
const axios = require("axios");
require('dotenv').config();


const pool = new Pool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	password: process.env.DB_PASSWORD,
	user: process.env.DB_USER,
	database: process.env.DB_DATABASE,
    connectionString: process.env.DATABASE_URL,
    ssl:{rejectUnauthorized: false}
});

const client = new Client({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	password: process.env.DB_PASSWORD,
	user: process.env.DB_USER,
	database: process.env.DB_DATABASE
});


const pokeUrl = "https://pokeapi.co/api/v2/";
const pokeGenUrl = pokeUrl+"generation/";
const limit = 10;


async function getMoves(m, genData){
    if(m.current_moves_offset === -1) return;


    // get the api data using off and limit
    for(let i=0;i<limit;i++){
        const currIndex = i + m.current_moves_offset;
        const currentGenData = genData[m.generation - 1];

        if(currIndex >= currentGenData.moves.length) break;

        //FIXED: use ids instead of names
        const opt = {
            method: "GET",
            url: currentGenData.moves[currIndex][1]
        };

        //console.log(currentGenData);

        
        axios.request(opt).then(async (result)=>{

            const id = result.data.id;
            const name = result.data.name;
            const pp = result.data.pp;
            const power = result.data.power;
            const accuracy = result.data.accuracy;
            const type = result.data.type.name;
            const learned_by = result.data.learned_by_pokemon.map(l=>l.name);
            const generation = result.data.generation.name;

            const q = {
                text: 'INSERT INTO move VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
                values: [id, name, pp, power, accuracy, type, learned_by, generation]
            };


            // store data in db
            await pool.query(q);

            // save next_offset to db  
            await pool.query("UPDATE offset_values SET moves_offset = moves_offset + 10 WHERE generation = $1",[m.generation]);


        });
        
    }

    console.log("Saved 10 moves...");

}

async function getSpecies(m, genData){
    if(m.current_species_offset === -1) return;


    // get the api data using off and limit
    for(let i=0;i<limit;i++){
        const currIndex = i + m.current_species_offset;
        const currentGenData = genData[m.generation - 1];

        if(currIndex >= currentGenData.species.length) break;

        //FIXED: use ids instead of names

        const u = currentGenData.species[currIndex][1].split("/");
        const pokemonId = u[u.length-2];

        const opt = {
            method: "GET",
            url: pokeUrl+"pokemon/"+pokemonId
        };

        
        axios.request(opt).then(async (result)=>{

            const id = result.data.id;
            const name = result.data.name;
            const base_experience = result.data.base_experience;
            const height = result.data.height;
            const weight = result.data.weight;
            const abilities = result.data.abilities.map(a=>a.ability.name);
            const moves = result.data.moves.map(mv=>mv.move.name);
            const types = result.data.types.map(t=>t.type.name);
            const img = result.data.sprites.front_default;

            const q = {
                text: 'INSERT INTO pokemon VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                values: [id, name, base_experience, height, weight, abilities, moves, types, img]
            };


            // store data in db
            await pool.query(q);

            // save next_offset to db 
            await pool.query("UPDATE offset_values SET species_offset = species_offset + 10 WHERE generation = $1",[m.generation]);


  
        });
        
    }

    console.log("Saved 10 pokemons...");

}


async function getGenerationsData(){
	//getting all the generations
	const res = await pool.query("SELECT * FROM generation ORDER BY id");

	const genData = [];

	if(res.rows.length != 9){
		console.log("Fetching all the generations data...");

        const axiosRequests = [];

	   for(let id=1;id<=9;id++){

			const opt = {
				method: "GET",
				url: pokeGenUrl+id
			}; 

            axiosRequests.push(axios.request(opt));
	    }

        const responses = await Promise.all(axiosRequests);

        responses.forEach((resp) =>{
            const id = resp.data.id;
            const name = resp.data.name;
            const moves = resp.data.moves.map(moveObj => [moveObj.name, moveObj.url]);
            const species = resp.data.pokemon_species.map(specie => [specie.name, specie.url]);
            const types = resp.data.types.map(type => type.name);

            genData[id-1] = {id,name,moves,species,types};

            const query = {
                text: "INSERT INTO generation VALUES($1, $2, $3, $4, $5)",
                values: [id, name, moves, species, types]
            };

            pool.query(query).catch(ex=>console.error(ex));
			
        });

	}else{
		console.log("All generations data found in db...");
		return res.rows;
	}

	return genData;
}

async function getDataFromDB(gen){
	// get items from db if atleast 10 available (could skip if genData is already a global var)
   const r = await pool.query('SELECT * FROM generation WHERE id=$1', [gen]);
   const currentGenData = r.rows[0];


   const allMoveSet = await pool.query('SELECT * FROM move');
   const allPokemonSet = await pool.query('SELECT * FROM pokemon');


   const currentGenMoveSet = allMoveSet.rows.filter(move => currentGenData.moves.includes(move.name));
   const currentGenPokemonSet = allPokemonSet.rows.filter(poke => currentGenData.species.includes(poke.name));

   return {currentGenMoveSet, currentGenPokemonSet};

}

async function getOffsetValues(){
	return pool.query("SELECT * FROM offset_values ORDER BY generation");
}

module.exports = {pool, client, getMoves, getSpecies, getGenerationsData, getDataFromDB, getOffsetValues}	
