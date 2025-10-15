import { compareCardsRank } from "../models/Cards.js";
import { countByRank } from "../models/Decks.js";

export const HAND_RANKS = {
  HIGH_CARD: 1,
  PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10
}

/**
 * Compute the best 5-card hand rank from player's hole cards plus community cards.
 *
 * Returns the highest-ranking 5-card combination among all possible 5-card subsets.
 *
 * @param {{rank:string, suit:string, value:number}[]} playerCards - The player's two hole cards.
 * @param {{rank:string, suit:string, value:number}[]} tableCards - The community cards on the table.
 * @returns {{cards: {rank:string, suit:string, value:number}[], rank: number}} The best hand (five cards) and its numeric rank.
 */
export function bestRank(playerCards, tableCards)
{
    const allCards = [...playerCards, ...tableCards];
    const allCombinations = getAllCombinations(allCards, 5);
    let bestHand = {
        cards: [],
        rank: 0,
    }
    return allCombinations.reduce((acc, curr) =>
    {
        let newRank = getRank(curr);
        if(acc.rank < newRank)
        {
            acc.cards = curr;
            acc.rank = newRank;
        }
        else if (acc.rank === newRank)
        {
            acc.cards = compareWithSameRank(curr, acc.cards, newRank);
            acc.rank = newRank;
        }
        return acc;
    }, bestHand);
}


/**
 * Compare multiple evaluated hands and return the winning entry.
 *
 * Hands are first sorted by rank (descending). In case of ties on rank,
 * a kicker-style comparison is performed among the tied hands using
 * {@link compareWithSameRank}.
 *
 * @param {{player:Object, bestHand:{rank:string,suit:string,value:number}[], evaluation:{rank:number}}[]} hands
 *  - Array of evaluated hands (each element must include `.bestHand` and `.evaluation.rank`).
 * @returns {{player:Object, bestHand:Object[], evaluation:{rank:number}}} The winning hand entry.
 */
export function compareHands(hands)
{
    hands.sort((a, b) => b.evaluation.rank - a.evaluation.rank);
    let count = hands.reduce((acc, curr) => {
        acc[curr.evaluation.rank] = (acc[curr.evaluation.rank] || 0) + 1;
        return acc;
    }, {});
    let maxKey = Object.keys(count).reduce((a, b) => a > b ? a : b);
    let winner = hands[0];
    if (count[maxKey] > 1)
    {
        let sameRankHands = hands.filter(h => h.evaluation.rank.toString() === maxKey);
        let bestHand = sameRankHands[0];
        for (let i = 1; i < sameRankHands.length; i++)
        {
            bestHand = compareWithSameRank(sameRankHands[i].bestHand, bestHand.bestHand);
        }
        winner = hands.find(h => h.bestHand === bestHand);
    }
    return winner;
}

/**
 * Compare two single-pair poker hands and return the stronger one.
 *
 * Uses {@link countByRank} to find the pair value in each hand and compares them numerically.
 *
 * @param {{rank:string, suit:string, value:number}[]} pairA - First 5-card hand containing a single pair.
 * @param {{rank:string, suit:string, value:number}[]} pairB - Second 5-card hand containing a single pair.
 * @returns {{rank:string, suit:string, value:number}[]|null} The winning hand, or `null` if the pairs are equal.
 */
function comparePairs(pairA, pairB)
{
    const countNew = countByRank(pairA);
    const countBest = countByRank(pairB);
    const pairValueNew = parseInt(Object.keys(countNew).find(key => countNew[key] === 2));
    const pairValueBest = parseInt(Object.keys(countBest).find(key => countBest[key] === 2));
    if (pairValueNew > pairValueBest)
    {
        return pairA;
    }
    else if (pairValueNew < pairValueBest)
    {
        return pairB;
    }
    return null;
}


/**
 * Compare two "two-pair" poker hands and return the stronger one.
 *
 * Both hands are analyzed using {@link countByRank} to identify their two pairs.
 * The comparison proceeds by:
 * 1. Comparing the higher pair value.
 * 2. If tied, comparing the lower pair value.
 * Returns `null` if both two-pair combinations are identical in rank.
 *
 * @param {{rank:string, suit:string, value:number}[]} twoPairA - First 5-card hand containing two pairs.
 * @param {{rank:string, suit:string, value:number}[]} twoPairB - Second 5-card hand containing two pairs.
 * @returns {{rank:string, suit:string, value:number}[]|null} The winning hand, or `null` if fully tied.
 */
function compareTwoPairs(twoPairA, twoPairB)
{
    const countNew = countByRank(twoPairA);
    const countBest = countByRank(twoPairB);
    const pairsNew = Object.keys(countNew).filter(key => countNew[key] === 2).map(v => parseInt(v)).sort((a, b) => b - a);
    const pairsBest = Object.keys(countBest).filter(key => countBest[key] === 2).map(v => parseInt(v)).sort((a, b) => b - a);
    if (pairsNew[0] > pairsBest[0])
    {
        return twoPairA;
    }
    else if (pairsNew[0] < pairsBest[0])
    {
        return twoPairB;
    }
    if (pairsNew[1] > pairsBest[1])
    {
        return twoPairA;
    }
    else if (pairsNew[1] < pairsBest[1])
    {
        return twoPairB;
    }
    return null;
}

/**
 * Compare two "three of a kind" poker hands and return the stronger one.
 *
 * Uses {@link countByRank} to identify the value of the triple in each hand
 * and compares them numerically. Returns `null` if both are equal.
 *
 * @param {{rank:string, suit:string, value:number}[]} threeA - First 5-card hand containing a three of a kind.
 * @param {{rank:string, suit:string, value:number}[]} threeB - Second 5-card hand containing a three of a kind.
 * @returns {{rank:string, suit:string, value:number}[]|null} The stronger hand, or `null` if both triples are equal.
 */
function compareThreeOfKind(threeA, threeB)
{
    const countNew = countByRank(threeA);
    const countBest = countByRank(threeB);
    const pairsNew = Object.keys(countNew).filter(key => countNew[key] === 3).map(v => parseInt(v)).sort((a, b) => b - a);
    const pairsBest = Object.keys(countBest).filter(key => countBest[key] === 3).map(v => parseInt(v)).sort((a, b) => b - a);
    if (pairsNew[0] > pairsBest[0])
    {
        return threeA;
    }
    else if (pairsNew[0] < pairsBest[0])
    {
        return threeB;
    }
    return null;
}


/**
 * Compare two "four of a kind" poker hands and return the stronger one.
 *
 * Uses {@link countByRank} to extract the four-of-a-kind rank for each hand,
 * then compares the quads numerically. Returns `null` if both are identical.
 *
 * @param {{rank:string, suit:string, value:number}[]} fourA - First 5-card hand containing four of a kind.
 * @param {{rank:string, suit:string, value:number}[]} fourB - Second 5-card hand containing four of a kind.
 * @returns {{rank:string, suit:string, value:number}[]|null} The stronger hand, or `null` if both quads are equal.
 */
function compareFourOfKind(fourA, fourB)
{
    const countNew = countByRank(fourA);
    const countBest = countByRank(fourB);
    const pairsNew = Object.keys(countNew).filter(key => countNew[key] === 4).map(v => parseInt(v)).sort((a, b) => b - a);
    const pairsBest = Object.keys(countBest).filter(key => countBest[key] === 4).map(v => parseInt(v)).sort((a, b) => b - a);
    if (pairsNew[0] > pairsBest[0])
    {
        return fourA;
    }
    else if (pairsNew[0] < pairsBest[0])
    {
        return fourB;
    }
    return null;
}

/**
 * Tie-breaker for hands of the same rank.
 *
 * Sorts both 5-card arrays ascending by value and compares card by card.
 * Returns the array corresponding to the higher sequence at the first difference;
 * if fully equal, returns `bestRank` (the current best).
 *
 * @private
 * @param {{rank:string, suit:string, value:number}[]} newRank - Candidate hand to compare.
 * @param {{rank:string, suit:string, value:number}[]} bestRank - Current best hand at same rank.
 * @param {number} rank - Current rank the hands are equals.
 * @returns {{rank:string, suit:string, value:number}[]} The winning hand between the two inputs.
 */
function compareWithSameRank(newRank, bestRank, rank)
{
    if (rank === HAND_RANKS.PAIR)
    {
        const comp = comparePairs(newRank, bestRank);
        if (comp !== null)
        {
            return comp;
        }
    }
    if (rank === HAND_RANKS.TWO_PAIR)
    {
        const comp = compareTwoPairs(newRank, bestRank);
        if (comp !== null)
        {
            return comp;
        }
    }
    if (rank === HAND_RANKS.THREE_OF_KIND)
    {
        const comp = compareThreeOfKind(newRank, bestRank);
        if (comp !== null)
        {
            return comp;
        }
    }
    if (rank === HAND_RANKS.FOUR_OF_KIND)
    {
        const comp = compareFourOfKind(newRank, bestRank);
        if (comp !== null)
        {
            return comp;
        }
    }
    newRank.sort((a, b) => b.value - a.value);
    bestRank.sort((a, b) => b.value - a.value);

    for (let i = 0; i < newRank.length; i++)
    {
        if (newRank[i].value - bestRank[i].value > 0)
        {
            return newRank;
        }
        else if (newRank[i].value - bestRank[i].value < 0)
        {
            return bestRank;
        }
    }

    return bestRank;
}

/**
 * Generate all k-combinations from an array of cards.
 *
 * Functional approach: does not mutate the input array.
 *
 * @param {{rank:string, suit:string, value:number}[]} cards - Source cards.
 * @param {number} combinationLength - Size of each combination (k).
 * @returns {{rank:string, suit:string, value:number}[][]} An array of combinations (each is an array of k cards).
 */
export function getAllCombinations(cards, combinationLength){
    let head, tail, result = [];
    if (combinationLength > cards.length || combinationLength < 1)
    {
        return [];
    }
    if (combinationLength === cards.length)
    {
        return [cards];
    }
    if (combinationLength === 1)
    {
        return cards.map(card => [card]);
    }
    for (let i = 0; i < cards.length - combinationLength + 1; i++)
    {
        head = cards.slice(i,i+1);
        tail = getAllCombinations(cards.slice(i+1), combinationLength -1);
        for (let j = 0; j < tail.length; j++)
        {
            result.push(head.concat(tail[j]));
        }
    }
    return result;
}

/**
 * Evaluate a 5-card hand and return its rank.
 *
 * The check order goes from strongest (Royal Flush) to weakest (High Card).
 *
 * @param {{rank:string, suit:string, value:number}[]} cards - Exactly five cards to evaluate.
 * @returns {number} A numeric rank from {@link HAND_RANKS}.
 */
export function getRank(cards)
{
    let AreStraight = isStraight(cards);
    let AreFlush = isFlush(cards);
    const counts = countByRank(cards);
    if (AreStraight && AreFlush && isFlushRoyal(cards))
    {
        return HAND_RANKS.ROYAL_FLUSH;
    }
    if (AreStraight && AreFlush)
    {
        return HAND_RANKS.STRAIGHT_FLUSH;
    }
    if (isOfKind(4, counts))
    {
        return HAND_RANKS.FOUR_OF_KIND;
    }
    if (isFullHouse(cards, counts))
    {
        return HAND_RANKS.FULL_HOUSE;
    }
    if (AreFlush)
    {
        return HAND_RANKS.FLUSH;
    }
    if (AreStraight)
    {
        return HAND_RANKS.STRAIGHT;
    }
    if (isOfKind(3, counts))
    {
        return HAND_RANKS.THREE_OF_KIND;
    }
    if (Object.values(counts).filter(el => el === 2).length === 2)
    {
        return HAND_RANKS.TWO_PAIR;
    }
    if (Object.values(counts).filter(el => el === 2).length === 1)
    {
        return HAND_RANKS.PAIR;
    }
    return HAND_RANKS.HIGH_CARD;
}

/**
 * Check whether five cards form a straight (5 sequential values).
 *
 * This function sorts the input array in-place using {@link compareCardsRank}.
 * Handles the Ace-low straight (A-2-3-4-5) as a special case.
 *
 * @param {{rank:string, suit:string, value:number}[]} cards - Exactly five cards.
 * @returns {boolean} True if the hand is a straight, otherwise false.
 */
export function isStraight(cards)
{
    cards.sort(compareCardsRank);
    let isStraight = cards.every((card, idx, arr) => {
        if (idx === 0)
        {
            return true;
        }
        return (card.value - arr[idx - 1].value) === 1
    });
    if (cards[0].value === 2 &&
        cards[1].value === 3 &&
        cards[2].value === 4 &&
        cards[3].value === 5 &&
        cards[4].value === 14)
    {
        isStraight = true;
    }
    return isStraight;
}


/**
 * Check whether five cards share the same suit (flush).
 *
 * @param {{rank:string, suit:string, value:number}[]} cards - Exactly five cards.
 * @returns {boolean} True if all cards have the same suit, otherwise false.
 */
export function isFlush(cards)
{
    return cards.every((card, idx, arr) =>{
        if (idx === 0)
        {
            return true;
        }
        return card.suit === arr[idx - 1].suit;
    })
}

/**
 * Check whether the hand is a full house (three of a kind + a pair).
 *
 * @param {{rank:string, suit:string, value:number}[]} cards - Exactly five cards.
 * @param {Object.<number, number>} count - Frequency map produced by {@link countByRank}.
 * @returns {boolean} True if the hand is a full house, otherwise false.
 */
export function isFullHouse(cards, count)
{
    let keys = Object.keys(count);
    if ((count[keys[0]] === 2 && count[keys[1]] === 3) || 
        count[keys[0]] === 3 && count[keys[1]] === 2
    )
    {
        return true;
    }
    return false;
}

/**
 * Generic helper to check for "N of a kind".
 *
 * @param {number} number - The target multiplicity (e.g., 3 for trips, 4 for quads).
 * @param {Object.<number, number>} count - Frequency map produced by {@link countByRank}.
 * @returns {boolean} True if the maximum frequency equals the target, otherwise false.
 */
export function isOfKind(number, count)
{
    let max = Math.max(...Object.values(count))
    if (max === number)
    {
        return true;
    }
    return false;
}


/**
 * Check whether a straight flush is a royal flush (10 through Ace).
 *
 * Assumes the hand is already a straight and a flush.
 *
 * @param {{rank:string, suit:string, value:number}[]} cards - Exactly five cards (ideally sorted ascending by value).
 * @returns {boolean} True if the straight flush runs 10–A, otherwise false.
 */
export function isFlushRoyal(cards)
{
    if (cards[0].value === 10 && cards[4].value === 14)
    {
        return true;
    }
    return false
}