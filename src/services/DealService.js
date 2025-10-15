import { dealCards } from "../models/Decks.js";
import { giveCard } from "../models/Players.js";
import { delay } from "./GameService.js"


/**
 * Deal two hole cards to each player in the game, with a delay between rounds.
 *
 * Side effects:
 * - Mutates `game.deck` as cards are dealt.
 * - Replaces player instances in `game.players` with updated immutable versions returned by `giveCard`.
 *
 * @async
 * @param {Object} game - The game state container.
 * @param {{players:Object[], deck:Object, dealDelay:number}} game - Game state (players, deck, timings).
 * @returns {Promise<void>} Resolves when both dealing rounds are completed.
 */
export async function dealPlayers(game)
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


/**
 * Burn one card, then deal the flop (three community cards).
 *
 * Side effects:
 * - Mutates `game.deck` and appends three cards to `game.tableCard`.
 * - Logs human-readable output to the console.
 *
 * @async
 * @param {{deck:Object, tableCard:Object[], actionDelay:number}} game - Game state with deck and table.
 * @returns {Promise<void>} Resolves after logging and applying `actionDelay`.
 */
export async function dealTableFlop(game)
{
    const {dealtCards, remainingDeck} = dealCards(game.deck, 1);
    game.deck = remainingDeck;

    for (let i = 0; i < 3; i++)
    {
        const {dealtCards, remainingDeck} = dealCards(game.deck, 1);
        game.deck = remainingDeck;
        game.tableCard = [...game.tableCard, dealtCards[0]];
    }

    // For more understandable dealing
    console.log('\n' + '='.repeat(60));
    console.log('Distribution du flop...');
    console.log(`Table: ${game.tableCard.map(c => c.toString()).join(' ')}`);
    console.log('\n' + '='.repeat(60));
    await delay(game.actionDelay);
}


/**
 * Burn one card, then deal a single community card (turn or river).
 *
 * Also resets `game.currentBet` for the new betting round and logs the state.
 *
 * Side effects:
 * - Mutates `game.deck`, `game.tableCard`, and resets `game.currentBet` to 0.
 *
 * @async
 * @param {{deck:Object, tableCard:Object[], currentPhase:string, currentBet:number, actionDelay:number}} game - Game state.
 * @returns {Promise<void>} Resolves after logging and applying `actionDelay`.
 */
export async function dealTableOneCard(game){
    game.currentBet = 0;
    let {dealtCards, remainingDeck} = dealCards(game.deck, 1);
    game.deck = remainingDeck;

    ({dealtCards, remainingDeck} = dealCards(game.deck, 1));
    game.deck = remainingDeck;
    game.tableCard = [...game.tableCard, dealtCards[0]];
    // For more understandable dealing
    console.log('\n' + '='.repeat(60));
    console.log(`Distribution du/de la ${game.currentPhase}...`);
    console.log(`Table: ${game.tableCard.map(c => c.toString()).join(' ')}`);
    console.log('\n' + '='.repeat(60));
    await delay(game.actionDelay);
}