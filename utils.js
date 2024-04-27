function analyzeData(currentGenMoveSet, currentGenPokemonSet){
    const topTenMovesPower = currentGenMoveSet.toSorted((a,b)=>b.power-a.power).slice(0,10);
                        
    const topTenMovesAccuracy = currentGenMoveSet.toSorted((a,b)=>b.accuracy - a.accuracy).slice(0,10);

    const topTenMovesAgainstHighSpeed = currentGenMoveSet.toSorted((a,b)=> (0.5*b.accuracy + 0.3*b.power + 0.2*b.pp) - (0.5*a.accuracy + 0.3*a.power + 0.2*a.pp)).slice(0,10);

    const topTenMovesAgainstHighDefense = currentGenMoveSet.toSorted((a,b)=> (0.3*b.accuracy + 0.4*b.power + 0.3*b.pp) - (0.3*a.accuracy + 0.4*a.power + 0.3*a.pp)).slice(0,10);

    const topTenMovesAgainstHighHP = currentGenMoveSet.toSorted((a,b)=> (0.2*b.accuracy + 0.5*b.power + 0.3*b.pp) - (0.2*a.accuracy + 0.5*a.power + 0.3*a.pp)).slice(0,10);
    
    const typeCount = {};

    currentGenPokemonSet.forEach(pokemon => {
        pokemon.types.forEach(type => {
            if(typeCount[type]) typeCount[type]++; 
            else typeCount[type] = 1;
        });
    });

    return {topTenMovesAccuracy, topTenMovesAgainstHighDefense, topTenMovesAgainstHighHP, topTenMovesAgainstHighSpeed, topTenMovesPower, typeCount};
}

module.exports = {analyzeData};