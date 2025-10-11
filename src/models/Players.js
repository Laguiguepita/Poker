
/**
 * Create a player object
 * @param {string} name - The name of the player
 * @param {number} chips - The initial amount of chips for the player
 * @returns {Object} A new player object
 */
export function createPlayer(name, chips = 1000) {
    return Object.freeze({
        id: crypto.randomUUID(),
        name,
        chips,
        hand: [],
        currentBet: 0,
        hasFolded: false,
        isInAllIn: false,
        toString() {
            return `${name} (${chips} chips)`;
        }
    })
}


/**
 * Give a card to a player
 * @param {Object} card - The card to be given
 * @param {Object} player - The player who receives the card
 * @returns {Object} A new player object with the updated hand
 */
export function giveCard(card, player){
    return Object.freeze({
        ...player,
        hand: [...player.hand, card]
    })
}


/**
 * Place a bet for a player
 * @param {Object} player - The player placing the bet
 * @param {number} amount - The amount of chips to bet
 * @returns {Object} A new player object with updated chips and bet status
 * @throws {Error} If the player has folded or doesn't have enough chips
 */
export function placeBet(player, amount){
    if (player.hasFolded)
    {
        throw new Error(`${player.name} has already folded !`);
    }
    if (amount > player.chips){
        throw new Error(`${player.name} has not enougth money to bet ${amount}`);
    }
    if (player.chips === amount)
    {
        player.isInAllIn = true;
    }
    return Object.freeze({
        ...player,
        chips: player.chips - amount,
        isInAllIn: player.isInAllIn,
        currentBet: player.currentBet + amount
    })
}


/**
 * Fold a player's hand
 * @param {Object} player - The player who decides to fold
 * @returns {Object} A new player object with hasFolded set to true
 * @throws {Error} If the player has already folded
 */
export function fold(player)
{
    if (player.hasFolded)
    {
        throw new Error(`${player.name} has already folded !`);
    }
    return Object.freeze({
        ...player,
        hasFolded: true
    })
}

/**
 * Make a player call the current bet
 * @param {Object} player - The player calling
 * @param {number} currentCall - The current amount to match
 * @returns {Object} A new player object with updated bet
 */
export function call(player, currentCall)
{
    const moneyToAdd = currentCall - player.currentBet;
    return placeBet(player, moneyToAdd);
}


/**
 * Make a player raise the current bet
 * @param {Object} player - The player raising
 * @param {number} raise - The total amount after the raise
 * @returns {Object} A new player object with updated bet
 */
export function raise(player, raise)
{
    const amountToRaise = raise - player.currentBet;
    return placeBet(player, amountToRaise);
}


/**
 * Reset a player for a new hand
 * @param {Object} player - The player to reset
 * @returns {Object} A new player object with reset hand and bet status
 */
export function resetForNewHand(player){
    return Object.freeze({
        ...player,
        currentBet: 0,
        hasFolded: false,
        isInAllIn: false,
        hand: []
    })
}


/**
 * Add winnings to a player's chips
 * @param {Object} player - The player who won the pot
 * @param {number} money - The amount of chips to add
 * @returns {Object} A new player object with updated chip count
 */
export function addWiningMoney(player, money)
{
    return Object.freeze({
        ...player,
        chips: player.chips + money
    })
}

/**
 * Get all active players (those who haven't folded)
 * @param {Object[]} players - The list of all players
 * @returns {Object[]} A list of players who are still active in the round
 */
export function getActivePlayers(players)
{
    return players.filter(player => !player.hasFolded);
}


/**
 * Get the player with the most chips
 * @param {Object[]} players - The list of all players
 * @returns {Object} The player with the highest chip count
 */
export function getLeader(players){
    return players.reduce((acc, cur) => 
        acc = Math.max(acc.chips, cur.chips))
}


/**
 * Calculate the total pot based on current bets
 * @param {Object[]} players - The list of all players
 * @returns {number} The total amount of chips in the pot
 */
export function getPot(players){
    return players.reduce((acc, currPlayer) => 
        acc += currPlayer.currentBet, 0)
}