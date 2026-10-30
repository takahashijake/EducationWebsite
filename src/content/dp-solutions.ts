/** Trusted browser Python references; authored assertions validate each contract. */
export const dpSolutions: Record<string, string> = {
  "dp-repeated": `def staircase_naive(n):
    if type(n) is not int or not 0 <= n <= 15:
        raise ValueError("n must be 0..15")
    calls = 0
    seen = set()
    def ways(k):
        nonlocal calls
        calls += 1
        seen.add(k)
        if k <= 1:
            return 1
        return ways(k-1) + ways(k-2)
    result = ways(n)
    return result, calls, len(seen)`,
  "dp-memo": `def staircase_memo(n):
    if type(n) is not int or not 0 <= n <= 15:
        raise ValueError("n must be 0..15")
    cache = {}
    calls = hits = 0
    def ways(k):
        nonlocal calls, hits
        calls += 1
        if k in cache:
            hits += 1
            return cache[k]
        cache[k] = 1 if k <= 1 else ways(k-1) + ways(k-2)
        return cache[k]
    result = ways(n)
    return result, calls, hits`,
  "dp-table": `def staircase_table(n):
    if type(n) is not int or not 0 <= n <= 15:
        raise ValueError("n must be 0..15")
    table = [1] * (n + 1)
    for k in range(2, n + 1):
        table[k] = table[k-1] + table[k-2]
    return table`,
  "dp-coin-count": `def min_coin_count(coins, target):
    if type(target) is not int or not 0 <= target <= 20 or not coins or len(coins) > 6 or any(type(c) is not int or c <= 0 or c > 20 for c in coins):
        raise ValueError("invalid coin problem")
    coins = sorted(set(coins))
    table = [None] * (target + 1)
    table[0] = 0
    for amount in range(1, target + 1):
        for coin in coins:
            prior = amount - coin
            if prior >= 0 and table[prior] is not None:
                candidate = table[prior] + 1
                if table[amount] is None or candidate < table[amount]:
                    table[amount] = candidate
    return table[target]`,
  "dp-coin-solution": `def min_coin_solution(coins, target):
    if type(target) is not int or not 0 <= target <= 20 or not coins or len(coins) > 6 or any(type(c) is not int or c <= 0 or c > 20 for c in coins):
        raise ValueError("invalid coin problem")
    coins = sorted(set(coins))
    table = [None] * (target + 1)
    parent = [None] * (target + 1)
    table[0] = 0
    for amount in range(1, target + 1):
        for coin in coins:
            prior = amount - coin
            if prior >= 0 and table[prior] is not None:
                candidate = table[prior] + 1
                if table[amount] is None or candidate < table[amount]:
                    table[amount], parent[amount] = candidate, coin
    if table[target] is None:
        return None
    chosen = []
    while target:
        coin = parent[target]
        if coin is None:
            raise ValueError("broken predecessor")
        chosen.append(coin)
        target -= coin
    return chosen`,
  "dp-knapsack": `def knapsack(items, capacity):
    if type(capacity) is not int or not 0 <= capacity <= 15 or len(items) > 6:
        raise ValueError("invalid capacity or item count")
    ids = set()
    for item_id, weight, value in items:
        if type(item_id) is not str or not item_id or item_id in ids or type(weight) is not int or not 1 <= weight <= 15 or type(value) is not int or not 0 <= value <= 30:
            raise ValueError("invalid item")
        ids.add(item_id)
    table = [[0] * (capacity + 1) for _ in range(len(items) + 1)]
    for i, (_, weight, value) in enumerate(items, 1):
        for c in range(1, capacity + 1):
            exclude = table[i-1][c]
            include = value + table[i-1][c-weight] if weight <= c else None
            table[i][c] = include if include is not None and include > exclude else exclude
    chosen = []
    c = capacity
    for i in range(len(items), 0, -1):
        if table[i][c] != table[i-1][c]:
            item_id, weight, _ = items[i-1]
            chosen.append(item_id)
            c -= weight
    chosen.reverse()
    return table[-1][capacity], chosen`,
};
