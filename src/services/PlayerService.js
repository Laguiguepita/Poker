/**
 * Generate an AI player's action based on simple probability and game context.
 *
 * The AI evaluates whether to fold, call, raise, or check depending on:
 * - The cost to call (`amountToCall`)
 * - The player's remaining chips
 * - Random probability thresholds
 *
 * Behavior:
 * - 30% chance to fold if the amount to call > 50% of chips
 * - 15% chance to raise if the player has enough chips
 * - Otherwise calls or checks depending on the situation
 *
 * @async
 * @param {Object} game - The current game state.
 * @param {{name:string, chips:number, currentBet:number}} player - The AI player object.
 * @returns {Promise<{type:'fold'|'call'|'raise'|'check', amount?:number}>} The chosen AI action.
 */
export async function getAIAction(game, player) {
    const amountToCall = game.currentBet - player.currentBet;
    const random = Math.random();
    
    // No reflexion only probabilities
    if (amountToCall > player.chips * 0.5 && random < 0.3) {
        console.log(`${player.name} se couche.`);
        return { type: 'fold' };
    } else if (random < 0.15 && player.chips > game.currentBet * 2) {
        const raiseAmount = game.currentBet + game.bigBlind * Math.floor(Math.random() * 3 + 2);
        console.log(`${player.name} relance à ${Math.min(raiseAmount, player.chips + player.currentBet)}.`);
        return { type: 'raise', amount: Math.min(raiseAmount, player.chips + player.currentBet) };
    } else if (amountToCall > 0) {
        console.log(`${player.name} suit.`);
        return { type: 'call', amount: amountToCall };
    } else {
        console.log(`${player.name} checke.`);
        return { type: 'check' };
    }
}


/**
 * Ask a human player for an action via command-line input.
 *
 * Displays the current game state (chips, cards, pot, etc.) and prompts
 * the player for one of several possible actions, depending on the situation:
 * - If `amountToCall > 0`: follow, raise, or fold.
 * - Otherwise: check or bet.
 *
 * Uses `game.rl` (Node.js `readline` interface) for synchronous question/response flow.
 *
 * @async
 * @param {Object} game - The current game state, including the readline interface.
 * @param {{name:string, chips:number, hand:Object[], currentBet:number}} player - The human player.
 * @returns {Promise<{type:'fold'|'call'|'raise'|'check', amount?:number}>} The selected player action.
 */
export async function getHumanAction(game, player) {
    const amountToCall = game.currentBet - player.currentBet;
    
    return new Promise((resolve) => {
        console.log('\n' + '='.repeat(60));
        console.log(`À vous de jouer, ${player.name} !`);
        console.log(`Vos jetons: ${player.chips}`);
        console.log(`Vos cartes: ${player.hand.map(c => c.toString()).join(' ')}`);
        console.log(`Table: ${game.tableCard.map(c => c.toString()).join(' ')}`);
        console.log(`Pot actuel: ${game.pot}`);
        console.log(`Mise actuelle: ${game.currentBet}`);
        console.log(`À suivre: ${amountToCall}`);
        console.log('='.repeat(60));
        
        const availableActions = [];
        if (amountToCall > 0) {
            availableActions.push(`1. Suivre (${amountToCall} jetons)`);
            availableActions.push(`2. Relancer`);
            availableActions.push(`3. Se coucher`);
        } else {
            availableActions.push(`1. Checker`);
            availableActions.push(`2. Miser`);
        }
        
        console.log('\nActions disponibles:');
        availableActions.forEach(action => console.log(action));
        
        game.rl.question('\nVotre choix (1-3): ', (answer) => {
            const choice = parseInt(answer);
            
            if (amountToCall > 0) {
                if (choice === 1) {
                    resolve({ type: 'call', amount: amountToCall });
                } else if (choice === 2) {
                    game.rl.question('Montant de la relance: ', (raiseAmount) => {
                        const amount = parseInt(raiseAmount);
                        resolve({ type: 'raise', amount: amount });
                    });
                } else if (choice === 3) {
                    resolve({ type: 'fold' });
                } else {
                    console.log('Choix invalide, je passe pour vous.');
                    resolve({ type: 'fold' });
                }
            } else {
                if (choice === 1) {
                    resolve({ type: 'check' });
                } else if (choice === 2) {
                    game.rl.question('Montant de la mise: ', (betAmount) => {
                        const amount = parseInt(betAmount);
                        resolve({ type: 'raise', amount: amount });
                    });
                } else {
                    console.log('Choix invalide, je checke pour vous.');
                    resolve({ type: 'check' });
                }
            }
        });
    });
}
