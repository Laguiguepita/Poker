import { dealCards } from "../models/Decks.js";
import { giveCard } from "../models/Players.js";
import { delay } from "./GameService.js"

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