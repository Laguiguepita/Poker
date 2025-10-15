import { createDeck, shuffleDeck, dealCards } from "../models/Decks.js";
import {
    createPlayer, 
    placeBet, 
    fold,
    call,
    raise,
    resetForNewHand,
    getActivePlayers } from "../models/Players.js"
import { dealPlayers, dealTableOneCard, dealTableFlop } from "./DealService.js";
import {getHumanAction, getAIAction} from "./PlayerService.js";
import { bestRank, compareHands } from "./HandEvaluator.js";


export function createNewGame(newPlayers, rlIndex)
{
    const players = newPlayers.map(player => createPlayer(player[0], player[1], 1000));

    return {
        players,
        deck : null,
        tableCard : [],
        pot : 0,
        currentPhase : 'setup',
        currentBet : 0,
        bigBlindPos : 0,
        smallBlindPos : -1,
        smallBlind : 10,
        bigBlind: 20,
        dealDelay: 1000,
        actionDelay: 500,
        rl: rlIndex
    };
}

export function delay(time){
    return new Promise((resolve) => setTimeout(resolve, time));
}

export async function startNewGame(game)
{
    game.players = game.players.map(player => resetForNewHand(player));
    game.tableCard = [];
    game.deck = shuffleDeck(createDeck());
    game.pot = 0;
    game.currentBet = 0;
    game.bigBlindPos = (game.bigBlindPos + 1) % game.players.length;
    game.smallBlindPos = (game.smallBlindPos + 1) % game.players.length;

    await dealPlayers(game);
    await blindBet(game);
    game.currentPhase = 'pre-flop';
    await bettingRound(game);
    if (getActivePlayers(game.players).length <= 1) {
        await resolveWinner(game);
        return game;
    }
    game.currentPhase = 'flop';
    await dealTableFlop(game);
    await bettingRound(game);
    if (getActivePlayers(game.players).length <= 1) {
        await resolveWinner(game);
        return game;
    }
    game.currentPhase = 'turn';
    for (let i = 0; i < 2; i++)
    {
        await dealTableOneCard(game);
        await bettingRound(game);
        if (getActivePlayers(game.players).length <= 1) {
            await resolveWinner(game);
            return game;
        }
        game.currentPhase = 'river';
    }
    await showdown(game);
    return game;
}


async function bettingRound(game) {
    const activePlayers = getActivePlayers(game.players);
    if (activePlayers.length <= 1) return;
    
    let currentIdx = game.currentPhase === 'pre-flop' 
        ? (game.bigBlindPos + 1) % game.players.length
        : (game.smallBlindPos + 1) % game.players.length;
    
    let lastRaiserIdx = -1;
    const playersToAct = new Set(activePlayers.map(p => p.id));
    
    while (playersToAct.size > 0) {
        const player = game.players[currentIdx];
        
        if (player.folded || player.allIn) {
            currentIdx = (currentIdx + 1) % game.players.length;
            continue;
        }
        
        const action = player.isIA 
            ? await getAIAction(game, player)
            : await getHumanAction(game, player);

        
        await processAction(game, player, action, currentIdx);
        
        playersToAct.delete(player.id);
        
        if (action.type === 'raise') {
            lastRaiserIdx = currentIdx;
            activePlayers.forEach(p => {
                const playerToAdd = game.players.find(pl => pl.id === p.id);
                if (p.id !== player.id && !playerToAdd.hasFolded && !playerToAdd.isInAllIn) {
                    playersToAct.add(p.id);
                }
            });
        }
        
        currentIdx = (currentIdx + 1) % game.players.length;
        
        if (getActivePlayers(game.players).length <= 1) break;
        
        await delay(game.actionDelay);
    }
    
    game.players = game.players.map(p => ({ ...p, currentBet: 0 }));
    game.currentBet = 0;
}


async function processAction(game, player, action, playerIdx) {
    switch (action.type) {
        case 'fold':
            game.players[playerIdx] = fold(player);
            break;
            
        case 'check':
            break;
            
        case 'call':
            game.players[playerIdx] = call(player, game.currentBet);
            game.pot += action.amount;
            break;
            
        case 'raise':
            game.players[playerIdx] = raise(player, action.amount);
            game.pot += action.amount - player.currentBet;
            game.currentBet = action.amount;
            break;
    }
}


async function blindBet(game)
{

    //TODO check if not enougth
    game.players[game.bigBlindPos] = placeBet(game.players[game.bigBlindPos], game.bigBlind);
    game.players[game.smallBlindPos] = placeBet(game.players[game.smallBlindPos], game.smallBlind);

    game.pot = game.smallBlind + game.bigBlind;
    game.currentBet = game.bigBlind;

    await delay(game.actionDelay);
}

async function resolveWinner(game) {
    const winner = getActivePlayers(game.players)[0];
    const winnerIdx = game.players.findIndex(p => p.id === winner.id);
    
    // Donne le pot au gagnant
    game.players[winnerIdx] = {
        ...winner,
        chips: winner.chips + game.pot
    };

    console.log(`\nLe gagnant est ${winner.name} qui remporte le pot de ${game.pot} jetons !`);
    
    await delay(game.dealDelay * 2);
}


async function showdown(game) {
    const activePlayers = getActivePlayers(game.players);
    
    const evaluations = activePlayers.map(player => {
        const {cards, rank} = bestRank(player.hand, game.tableCard);
        
        return {
            player,
            bestHand: cards,
            evaluation: { rank },
            cards: cards.map(c => c.toString())
        };
    });
    
    // Trouve le gagnant (simplifié - devrait utiliser compareHands)
    const winner = compareHands(evaluations);
    const winnerIdx = game.players.findIndex(p => p.id === winner.player.id);
    
    game.players[winnerIdx] = {
        ...winner.player,
        chips: winner.player.chips + game.pot
    };
    
    await delay(game.dealDelay * 2);
}




//console.log("1");
//const proms  = delay(2000);
//delay(2000).then(() => console.log("2"));
//proms.then(()=>console.log("4"));
//console.log("3");
