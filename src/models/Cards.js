/**
 * Represents a poker card
 *
 * DESIGN CHOICES:
 * - Immutable object (freeze) : ensures that a card cannot be modified
 * - Factory function over class 
 * - Strict validation : ensures that only valid cards can be created
 */

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Create a new card object
 * @param {string} rank - The rank of the card (2-10, J, Q, K, A)
 * @param {string} suit - The suit of the card (♠♥♦♣)
 * @returns {Object} An immutable card object
 * @throws {Error} If rank or suit is invalid
 */
export function createCard(rank, suit) {
  if (!RANKS.includes(rank)) {
    throw new Error(`Rank invalide: ${rank}. Doit être parmi ${RANKS.join(', ')}`);
  }
  if (!SUITS.includes(suit)) {
    throw new Error(`Suit invalide: ${suit}. Doit être parmi ${SUITS.join(', ')}`);
  }

  // Froze to make the card immutable
  return Object.freeze({
    rank,
    suit,
    value: RANKS.indexOf(rank) + 2,
    toString() {
      return `${rank}${suit}`;
    }
  });
}

/**
 * Compare two cards based on their numeric value.
 *
 * Used primarily for sorting or ranking purposes.
 *
 * @param {{ value: number }} a - The first card to compare.
 * @param {{ value: number }} b - The second card to compare.
 * @returns {number} A negative number if `a` is lower, positive if `a` is higher, or 0 if equal.
 */
export function compareCardsRank(a, b)
{
    return a.value - b.value;
}
export { SUITS, RANKS };