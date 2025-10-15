import { createNewGame, startNewGame } from './services/GameService.js';
import * as readline from 'readline';


function displayLogo() {
  console.clear();
  console.log('\n' + '='.repeat(70));
  console.log(`
  ♠♥♦♣  POKER TEXAS HOLD'EM - Mode Interactive  ♠♥♦♣
  
  `);
  console.log('='.repeat(70) + '\n');
}


function displayGameState(game) {
  console.log('\n' + '─'.repeat(70));
  console.log('ÉTAT DE LA PARTIE');
  console.log('─'.repeat(70));
  
  game.players.forEach((player, idx) => {
    const indicator = player.isHuman ? '👤' : '🤖';
    const status = player.folded ? ' (couché)' : player.allIn ? ' (all-in)' : '';
    const dealer = idx === game.bigBlindPos ? ' [D]' : '';
    
    console.log(
      `${indicator} ${player.name}${dealer}: ${player.chips} jetons${status}`
    );
  });
  
  console.log(`\nPot: ${game.pot} jetons`);
  console.log('─'.repeat(70) + '\n');
}


async function askPlayAgain(rl) {
  return new Promise((resolve) => {
    rl.question('\n🎲 Jouer une autre main ? (o/n): ', (answer) => {
      resolve(answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui');
    });
  });
}


async function setupGame(rl) {
  return new Promise((resolve) => {
    console.log('CONFIGURATION DE LA PARTIE\n');
    
    rl.question('Votre nom de joueur : ', (playerName) => {
      rl.question('Nombre d\'adversaires IA (1-8) : ', (nbAI) => {
        const numAI = Math.max(1, Math.min(8, parseInt(nbAI) || 3));
        
        const players = [
          [playerName || 'Vous', false] 
        ];
        
        const aiNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
        for (let i = 0; i < numAI; i++) {
          players.push([aiNames[i], true]);
        }
        
        resolve(players);
      });
    });
  });
}


async function main() {
  displayLogo();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
    const players = await setupGame(rl);
    
    const game = createNewGame(players, rl);
    
    let keepPlaying = true;
    let handNumber = 1;
    
    while (keepPlaying) {
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`  MAIN #${handNumber}`);
      console.log('═'.repeat(70));
      
      displayGameState(game);
      
      await startNewGame(game, rl);
      
      displayGameState(game);
      
      const playersWithChips = game.players.filter(p => p.chips > 0);
      
      if (playersWithChips.length < 2) {
        console.log('\nPARTIE TERMINÉE - Plus assez de joueurs !');
        break;
      }
      
      const humanPlayer = game.players.find(p => !p.isIA);
      if (!humanPlayer || humanPlayer.chips === 0) {
        console.log('\nVous n\'avez plus de jetons ! Game Over.');
        break;
      }
      
      keepPlaying = await askPlayAgain(rl);
      handNumber++;
      
      game.players = game.players.filter(p => p.chips > 0);
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('  RÉSULTATS FINAUX');
    console.log('═'.repeat(70));
    
    const sortedPlayers = [...game.players].sort((a, b) => b.chips - a.chips);
    sortedPlayers.forEach((player, idx) => {
      const medal = ['🥇', '🥈', '🥉'][idx] || '  ';
      const indicator = player.isIA ? '🤖' : '👤';
      console.log(`${medal} ${indicator} ${player.name}: ${player.chips} jetons`);
    });
    
    console.log('\nMerci d\'avoir joué ! À bientôt !\n');
    
    rl.close();
}

main();

export { main };