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


/**
 * Create and initialize a new game state.
 *
 * @param {Array<[string, number]>} newPlayers - Array of tuples [name, startingChips].
 * @param {number} rlIndex - Index/handle to an external readline (or UI) resource.
 * @returns {Object} The initialized game object.
 */
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


/**
 * Promise-based delay helper.
 *
 * @param {number} time - Delay in milliseconds.
 * @returns {Promise<void>} Resolves after the specified delay.
 */
export function delay(time){
    return new Promise((resolve) => setTimeout(resolve, time));
}


/**
 * Start a new hand: reset players, shuffle, deal, run betting rounds and showdown.
 *
 * Flow:
 * - Reset players & deck
 * - Deal hole cards + blinds + pre-flop betting
 * - Flop + betting
 * - Turn + betting
 * - River + betting
 * - Showdown / early winner resolution
 *
 * @async
 * @param {Object} game - The current game state (mutated throughout the flow).
 * @returns {Promise<Object>} The updated game state after the hand completes.
 */
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

/**
 * Execute a full betting round for the current phase.
 *
 * Turn order:
 * - Pre-flop: starts left of big blind
 * - Otherwise: starts left of small blind
 *
 * Terminates when all active players have acted and no pending calls remain.
 *
 * @async
 * @param {Object} game - Game state; reads/modifies players, currentBet, etc.
 * @returns {Promise<void>} Resolves when the betting round is complete.
 */
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

/**
 * Apply a player's action to the game state (fold/check/call/raise).
 *
 * Side effects:
 * - Mutates `game.players[playerIdx]`, `game.pot`, and possibly `game.currentBet`.
 *
 * @async
 * @param {Object} game - Game state object.
 * @param {Object} player - Player taking the action (snapshot before mutation).
 * @param {{type:'fold'|'check'|'call'|'raise', amount?:number}} action - Action descriptor.
 * @param {number} playerIdx - Index of the acting player in `game.players`.
 * @returns {Promise<void>} Resolves after the action is processed.
 */
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

/**
 * Post small blind and big blind at the start of the hand.
 *
 * Side effects:
 * - Deducts chips from blind players
 * - Updates `game.pot` and `game.currentBet`
 *
 * @async
 * @param {Object} game - Game state with blind positions and amounts.
 * @returns {Promise<void>} Resolves after applying the blind delay.
 */
async function blindBet(game)
{

    // TODO: check if not enough chips
    game.players[game.bigBlindPos] = placeBet(game.players[game.bigBlindPos], game.bigBlind);
    game.players[game.smallBlindPos] = placeBet(game.players[game.smallBlindPos], game.smallBlind);

    game.pot = game.smallBlind + game.bigBlind;
    game.currentBet = game.bigBlind;

    await delay(game.actionDelay);
}



/**
 * Resolve the winner when only one player remains active (no showdown).
 *
 * @async
 * @param {Object} game - Game state.
 * @returns {Promise<void>} Resolves after awarding chips and applying a delay.
 */
async function resolveWinner(game) {
    const winner = getActivePlayers(game.players)[0];
    const winnerIdx = game.players.findIndex(p => p.id === winner.id);
    
    game.players[winnerIdx] = {
        ...winner,
        chips: winner.chips + game.pot
    };

    console.log(`\nLe gagnant est ${winner.name} qui remporte le pot de ${game.pot} jetons !`);
    
    await delay(game.dealDelay * 2);
}

/**
 * Showdown: reveal hands of all active players, evaluate, and award the pot.
 *
 * Uses `bestRank` to evaluate each player's best 5-card combo and `compareHands` to pick the winner.
 *
 * @async
 * @param {Object} game - Game state containing players and `tableCard`.
 * @returns {Promise<void>} Resolves after awarding chips and applying a delay.
 */
async function showdown(game) {
    const activePlayers = getActivePlayers(game.players);
    activePlayers.forEach(p => {
        console.log(`${p.name} révèle ses cartes: ${p.hand.map(c => c.toString()).join(' ')}`);
    });
    
    await delay(game.dealDelay);
    
    const evaluations = activePlayers.map(player => {
        const {cards, rank} = bestRank(player.hand, game.tableCard);
        
        return {
            player,
            bestHand: cards,
            evaluation: { rank },
            cards: cards.map(c => c.toString()).join(' ')
        };
    });
    
    const winner = compareHands(evaluations);
    console.log(`\nLe gagnant est ${winner.player.name} avec ${winner.cards} (${winner.evaluation.rank}) qui remporte le pot de ${game.pot} jetons !`);
    const winnerIdx = game.players.findIndex(p => p.id === winner.player.id);
    
    game.players[winnerIdx] = {
        ...winner.player,
        chips: winner.player.chips + game.pot
    };
    
    await delay(game.dealDelay * 2);
}