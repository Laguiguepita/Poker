/**
 * Represents a poker card
 *
 * DESIGN CHOICES:
 * - Immutable object (freeze) : ensures that a card cannot be modified
 * - Factory function over class :
 *  Benefits of using Factory Functions over Classes in javascript
 *
 *    There is no use of this keyword when instantiating variables. It is only used inside methods. This reduces the confusion of the this keyword.
 *
 *    There is no use of the new keyword which is often forgotten when creating objects using classes.
 *
 *    It is easier to setup since it looks quite similar to regular functions.
 *
 *    Simplicity - Factory functions provide a more straightforward and flexible way to create objects. They don't have the syntactic complexities that come with class declarations and prototypes, making them more approachable for developers who prefer a simpler syntax.
 *
 *    Encapsulation with Closures: It is easy to encapsulate private variables and objects with Factory functions since is natural to them.This enhances data privacy and abstraction.
 *
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

export { SUITS, RANKS };