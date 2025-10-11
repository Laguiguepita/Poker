/**
 * Gestion du paquet de cartes
 * 
 * CHOIX DE CONCEPTION :
 * - Approche fonctionnelle : les opérations retournent de nouveaux decks
 * - Utilisation intensive de map/filter/reduce : démontre la maîtrise de ces méthodes
 * - Algorithme de Fisher-Yates pour le mélange : standard de l'industrie
 */

import { createCard, SUITS, RANKS } from './Cards.js';

/**
 * Create a standard 52-card deck
 * 
 * @returns {Object} An immutable deck object with cards and remaining count
 * 
 */
export function createDeck() {
  const cards = SUITS.flatMap(suit =>
    RANKS.map(rank => createCard(rank, suit))
  );
  
  return Object.freeze({
    cards,
    remaining: cards.length
  });
}


/**
 * Shuffle deck with Fisher-Yates algorithm
 * 
 * @param {Object} deck - The deck to shuffle
 * @returns {Object} A new shuffled deck
 *
 */
export function shuffleDeck(deck) {
    //I can copy the array because there are only 52 cards, so performance is not an issue
    //If there were thousands of cards, I would consider an in-place shuffle to save memory
    //But that would break immutability, so I would need to document that clearly
    const shuffledCards = [...deck.cards];
  
    for (let i = shuffledCards.length - 1; i >= 1; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
    }

    return Object.freeze({
        cards: shuffledCards,
        remaining: shuffledCards.length
    });
}

/**
 * Deal a number of cards from the top of the deck.
 *
 * Functional style: does not mutate the original deck. Returns the dealt cards and a new remaining deck.
 *
 * @param {{cards: Object[], remaining: number}} deck - The source deck.
 * @param {number} count - Number of cards to deal.
 * @returns {{dealtCards: Object[], remainingDeck: {cards: Object[], remaining: number}}} The dealt cards and the new deck state.
 * @throws {Error} If the requested count exceeds the remaining cards.
 * 
 */
export function dealCards(deck, count) {
  if (count > deck.remaining) {
    throw new Error(`Impossible de distribuer ${count} cartes, il n'en reste que ${deck.remaining}`);
  }
  
  const dealtCards = deck.cards.slice(0, count);
  const remainingCards = deck.cards.slice(count);
  
  return {
    dealtCards,
    remainingDeck: Object.freeze({
      cards: remainingCards,
      remaining: remainingCards.length
    })
  };
}

/**
 * Filter cards by suit.
 *
 * @param {{cards: Object[]}} deck - The deck to filter.
 * @param {string} suit - The suit to keep (e.g., one of SUITS).
 * @returns {Object[]} The list of cards matching the given suit.
 *
 */
export function filterBySuit(deck, suit) {
  const filteredCards = deck.cards.filter(card => card.suit === suit);
  return filteredCards;
}

/**
 * Filter cards by rank.
 *
 * @param {{cards: Object[]}} deck - The deck to filter.
 * @param {string|number} rank - The rank to match (e.g., 'A', 'K', 'Q', 'J', or numeric values).
 * @returns {Object[]} The list of cards with the specified rank.
 */
export function filterByRank(deck, rank) {
  return deck.cards.filter(card => card.rank === rank);
}

/**
 * Count cards by suit.
 *
 * This is a very common interview pattern: use reduce to build a frequency map.
 *
 * @param {Object[]} cards - A list of card objects.
 * @returns {Object.<string, number>} An object mapping suit => count.
 *
 */
export function countBySuit(cards) {
  return cards.reduce((acc, card) => {
    acc[card.suit] = (acc[card.suit] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Count the number of occurrences of each rank (value) in a set of cards.
 *
 * @param {{ value: number, suit: string }[]} cards - The list of cards to analyze.
 * @returns {Object.<number, number>} An object mapping each card value to its count.
 */
export function countByRank(cards) {
    return cards.reduce((acc, card) => {
    acc[card.value] = (acc[card.value] || 0) + 1;
    return acc;
    }, {});
}
