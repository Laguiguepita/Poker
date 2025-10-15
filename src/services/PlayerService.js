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
