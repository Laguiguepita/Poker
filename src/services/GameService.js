import { createDeck, shuffleDeck, dealCards } from "../models/Decks.js";
import {
    createPlayer, 
    giveCard, 
    placeBet, 
    fold,
    call,
    raise,
    resetForNewHand,
    getLeader,
    getActivePlayers,
    getPot } from "../models/Players.js"


export function createNewGame(newPlayers)
{
    const players = newPlayers.map(player => createPlayer(player, 1000));

    return {
        players,
        deck : null,
        tableCard : [],
        pot : 0,
        currentPhase : 'setup',
        currentBet : 0,
        smallBlind : 10,
        bigBlind: 20,
        dealDelay: 1000,
        actionDelay: 500,
        onEvent : null
    };
}

function delay(time){
    return new Promise((resolve) => setTimeout(resolve, time));
}

export async function startNewGame(game)
{
    game.players = game.players.map(player => resetForNewHand(player));
    game.tableCard = [];
    game.deck = shuffleDeck(createDeck());
    game.pot = 0;
    game.currentBet = 0;
    await deal(game);
}


async function deal(game)
{
    for (let i = 0; i < 2; i++)
    {
        game.players.forEach(player => {
            const {dealtCards, remainingDeck} = dealCards(game.deck, 1);
            game.deck = remainingDeck;
            const newPlayer = giveCard(dealtCards, player);
            if (newPlayer && newPlayer !== player)
            {
                const idx = game.players.indexOf(player);
                if (idx >= 0)
                {
                    game.players[idx] = newPlayer;
                }
            }
        })
        await delay(game.dealDelay);
    }


}
//console.log("1");
//const proms  = delay(2000);
//delay(2000).then(() => console.log("2"));
//proms.then(()=>console.log("4"));
//console.log("3");

let game = createNewGame(['Alice', 'Bob', 'Charlie']);
await startNewGame(game);
