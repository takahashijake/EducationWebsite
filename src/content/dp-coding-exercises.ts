import type { CodingExercise, CodingTest } from "./coding-types";
import { dpSolutions } from "./dp-solutions";
const check = (
  id: string,
  label: string,
  code: string,
  guidance: string,
): CodingTest => ({
  id: `dp-${id}`,
  label,
  code,
  expectedBehavior: label,
  guidance,
  conceptIds: ["dynamic-programming"],
});
const lab = (
  id: string,
  title: string,
  instructions: string[],
  starter: string,
  tests: CodingTest[],
  hints: string[],
  explanation: string,
  reflection: string,
): CodingExercise => ({
  id: `dp-${id}`,
  topicId: "dynamic-programming",
  title,
  instructions,
  starter,
  tests,
  hints,
  explanation,
  reflection,
  expectedBehavior: instructions[0],
  conceptIds: ["dynamic-programming"],
  revision: 1,
  referenceSolution: dpSolutions[`dp-${id}`],
});
export const dpCodingExercises: CodingExercise[] = [
  lab(
    "repeated",
    "Count repeated staircase states",
    [
      "Implement staircase_naive(n), returning (ways, total_calls, distinct_states) for 0≤n≤15.",
      "Use ways(0)=ways(1)=1 and recurse without a cache to expose repeated work. Count every function invocation and each distinct argument. Reject invalid n with ValueError.",
    ],
    `def staircase_naive(n):
    calls = 0
    seen = set()
    def ways(k):
        nonlocal calls
        calls += 1
        seen.add(k)
        if k == 0: return 0  # bug: empty staircase has one arrangement
        if k == 1: return 1
        return ways(k-1) + ways(k-2)
    return ways(n), calls, len(seen)`,
    [
      check(
        "repeat-base",
        "Empty and one-step base cases",
        `assert staircase_naive(0)==(1,1,1) and staircase_naive(1)==(1,1,1)`,
        "The empty arrangement counts as one; each base call is still an invocation.",
      ),
      check(
        "repeat-overlap",
        "Repeated calls are counted",
        `assert staircase_naive(4)==(5,9,5)`,
        "The recursion tree has nine calls but only five distinct states 0..4.",
      ),
    ],
    [
      "Define what ways(k) returns before instrumenting it.",
      "Count the call on entry; add k to a set; return 1 for both base states.",
    ],
    "Naive recursion repeats smaller states even though it computes only n+1 distinct arguments.",
    "Which argument is recomputed in the ways(4) call tree?",
  ),
  lab(
    "memo",
    "Cache staircase results",
    [
      "Implement staircase_memo(n), returning (ways, total_calls, cache_hits) for 0≤n≤15.",
      "Cache both base and computed states. Count calls on entry and hits when a cached result is reused. Reject invalid n with ValueError.",
    ],
    `def staircase_memo(n):
    cache = {}
    calls = hits = 0
    def ways(k):
        nonlocal calls, hits
        calls += 1
        if k in cache: hits += 1  # bug: continue recomputing
        if k <= 1: return 1
        return ways(k-1) + ways(k-2)
    return ways(n), calls, hits`,
    [
      check(
        "memo-base",
        "Base states cached correctly",
        `assert staircase_memo(0)==(1,1,0) and staircase_memo(1)==(1,1,0)`,
        "The first call computes and stores its base value.",
      ),
      check(
        "memo-hits",
        "Memoization avoids expanded recursion",
        `assert staircase_memo(5)==(8,9,3)`,
        "A hit returns immediately; only distinct states need computation.",
      ),
    ],
    [
      "Check the dictionary before descending into the recurrence.",
      "Store the result for every state, including n=0 and n=1, then return it.",
    ],
    "A cache hit must return the stored value instead of continuing recursion.",
    "Why do calls still exceed distinct stored states?",
  ),
  lab(
    "table",
    "Fill a staircase table",
    [
      "Implement staircase_table(n): return the complete list [ways(0),…,ways(n)] for 0≤n≤15.",
      "Initialize both base states only when they exist, then fill in increasing n. Reject invalid n with ValueError.",
    ],
    `def staircase_table(n):
    table = [0] * (n+1)  # bug: zero is not the empty base value
    for k in range(2,n+1): table[k]=table[k-1]+table[k-2]
    return table`,
    [
      check(
        "table-bases",
        "Zero and one boundaries",
        `assert staircase_table(0)==[1] and staircase_table(1)==[1,1]`,
        "A table of length one contains only ways(0)=1.",
      ),
      check(
        "table-order",
        "Dependencies precede current cell",
        `assert staircase_table(6)==[1,1,2,3,5,8,13]`,
        "Fill left to right after the bases; each dependency must already exist.",
      ),
    ],
    [
      "Allocate n+1 cells and set index 0 to one.",
      "Set index 1 only if n≥1; then loop k from 2 through n.",
    ],
    "Bottom-up order follows recurrence dependencies; the table stores all solved states.",
    "When can two running values replace the entire table?",
  ),
  lab(
    "coin-count",
    "Find a minimum coin count",
    [
      "Implement min_coin_count(coins,target), returning a minimum count or None if unreachable; target zero returns 0.",
      "Coins are 1–6 positive integer entries (duplicates allowed), each at most 20; target is 0..20. Normalize unsorted duplicates, reject invalid input, and allow unlimited reuse of each denomination.",
    ],
    `def min_coin_count(coins,target):
    if target==0: return 0
    coins=sorted(coins,reverse=True)
    count=0
    for coin in coins:  # bug: greedy is not generally optimal
        count+=target//coin
        target%=coin
    return count`,
    [
      check(
        "coin-greedy",
        "Greedy counterexample",
        `assert min_coin_count([4,1,3],6)==2`,
        "Two 3-coins beat greedy 4+1+1.",
      ),
      check(
        "coin-unreachable",
        "Unreachable differs from zero",
        `assert min_coin_count([4,6],7) is None and min_coin_count([6,4],0)==0`,
        "Use None for unreachable; zero amount needs zero coins.",
      ),
    ],
    [
      "Let table[amount] be the minimum count, or None if no route exists.",
      "For each amount, consider all usable coins and table[amount-coin]+1; ignore unreachable predecessors.",
    ],
    "The best first coin depends on the remaining subproblem, so greedy can fail.",
    "Why does None require a separate check before adding one?",
  ),
  lab(
    "coin-solution",
    "Reconstruct minimum coins",
    [
      "Implement min_coin_solution(coins,target), returning an ordered coin list or None if unreachable; target zero returns [].",
      "Use the same bounds as the count lab. Sort and deduplicate denominations. On equal counts keep the first (smaller) coin. Follow saved parent coins until the amount reaches zero.",
    ],
    `def min_coin_solution(coins,target):
    count = [None]*(target+1)
    count[0]=0
    for amount in range(1,target+1):
        for coin in sorted(set(coins)):
            if coin<=amount and count[amount-coin] is not None:
                candidate=count[amount-coin]+1
                if count[amount] is None or candidate<count[amount]: count[amount]=candidate
    return count[target]  # bug: a count is not a valid coin list`,
    [
      check(
        "solution-greedy",
        "Reconstruct counterexample",
        `assert min_coin_solution([1,3,4],6)==[3,3]`,
        "Save the chosen coin for each improved amount, then backtrack.",
      ),
      check(
        "solution-tie",
        "Stable tie and unreachable boundary",
        `assert min_coin_solution([4,2,2],6)==[2,4]
assert min_coin_solution([4,6],7) is None and min_coin_solution([5],0)==[]`,
        "Smaller denomination wins an equal-count tie; zero selects no coins.",
      ),
    ],
    [
      "Store both the best count and the last coin chosen for each amount.",
      "On a strict improvement set parent[amount]; follow it backward until amount is zero.",
    ],
    "An optimal value alone cannot tell the learner which concrete coins produce it.",
    "How can you verify the reconstructed list independently of its count?",
  ),
  lab(
    "knapsack",
    "Build and reconstruct zero-one knapsack",
    [
      "Implement knapsack(items,capacity), returning (maximum_value, selected_item_ids_in_input_order).",
      "Items are (unique string ID, positive integer weight ≤15, nonnegative integer value ≤30), at most six; capacity is 0..15. Each item may be chosen once. Equal include/exclude values exclude the later item. Reject invalid input.",
    ],
    `def knapsack(items,capacity):
    table=[0]*(capacity+1)
    chosen=[]
    for item_id,weight,value in items:
        for c in range(weight,capacity+1):  # bug: ascending update reuses an item
            if table[c-weight]+value>table[c]:
                table[c]=table[c-weight]+value
                chosen.append(item_id)
    return table[capacity],chosen`,
    [
      check(
        "knapsack-once",
        "Cannot reuse one item",
        `assert knapsack([('A',2,3)],4)==(3,['A'])`,
        "Read the previous item row so A cannot be used twice.",
      ),
      check(
        "knapsack-pair",
        "Reconstruct selected identities",
        `assert knapsack([('A',2,3),('B',3,4),('C',4,5)],5)==(7,['A','B'])
assert knapsack([('A',2,3),('B',2,3)],2)==(3,['A'])`,
        "Backtrack through rows and keep an equal-value tie with the earlier item.",
      ),
    ],
    [
      "Define table[i][c] using only the first i items and capacity c.",
      "Compare previous-row exclude with previous-row include; backtrack from (n,capacity), then reverse selected IDs.",
    ],
    "A 2D previous-row dependency enforces the zero-one rule and retains item identities for reconstruction.",
    "Why would a current-row include dependency accidentally allow repeated use?",
  ),
];
