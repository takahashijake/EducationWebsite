/** Browser Python reference programs; public checks remain formative. */
export const bellmanSolutions: Record<string, string> = {
  "bellman-adjacency": `def signed_adjacency(vertices, edges):
    if any(type(v) is not str or not v for v in vertices) or len(set(vertices)) != len(vertices):
        raise ValueError("invalid vertex")
    graph = {v: [] for v in vertices}
    seen = set()
    for u, v, weight in edges:
        if u not in graph or v not in graph or type(weight) is not int or not -20 <= weight <= 20 or (u, v) in seen:
            raise ValueError("invalid directed edge")
        seen.add((u, v))
        graph[u].append((v, weight))
    return {v: sorted(graph[v]) for v in sorted(graph)}`,
  "bellman-relax": `def strict_relax(distance, parent, u, v, weight):
    if u not in distance or v not in distance or type(weight) is not int:
        raise ValueError("invalid edge")
    if distance[u] is None:
        return False
    candidate = distance[u] + weight
    if distance[v] is None or candidate < distance[v]:
        distance[v] = candidate
        parent[v] = u
        return True
    return False`,
  "bellman-passes": `def relaxation_passes(vertices, edges, start):
    if start not in vertices:
        raise ValueError("unknown source")
    distance = {v: None for v in vertices}
    parent = {v: None for v in vertices}
    distance[start] = 0
    passes = 0
    for _ in range(len(vertices) - 1):
        changed = False
        passes += 1
        for u, v, weight in sorted(edges):
            if distance[u] is None:
                continue
            candidate = distance[u] + weight
            if distance[v] is None or candidate < distance[v]:
                distance[v], parent[v] = candidate, u
                changed = True
        if not changed:
            break
    return distance, parent, passes`,
  "bellman-detect": `def relaxable_targets(vertices, edges, distance):
    targets = set()
    for u, v, weight in edges:
        if u not in distance or v not in distance:
            raise ValueError("unknown endpoint")
        if distance[u] is not None:
            candidate = distance[u] + weight
            if distance[v] is None or candidate < distance[v]:
                targets.add(v)
    return targets`,
  "bellman-impact": `def cycle_impact(vertices, edges, seeds):
    known = set(vertices)
    if not set(seeds) <= known:
        raise ValueError("unknown seed")
    affected = set(seeds)
    while True:
        more = {v for u, v, _ in edges if u in affected} - affected
        if not more:
            return affected
        affected |= more`,
  "bellman-integrate": `def bellman_paths(vertices, edges, start):
    if any(type(v) is not str or not v for v in vertices) or len(set(vertices)) != len(vertices) or start not in vertices:
        raise ValueError("invalid vertices or source")
    distance = {v: None for v in vertices}
    parent = {v: None for v in vertices}
    seen_edges = set()
    for u, v, weight in edges:
        if u not in distance or v not in distance or type(weight) is not int or not -20 <= weight <= 20 or (u,v) in seen_edges:
            raise ValueError("invalid edge")
        seen_edges.add((u,v))
    edges = sorted(edges)
    distance[start] = 0
    for _ in range(len(vertices)-1):
        changed = False
        for u, v, weight in edges:
            if distance[u] is None:
                continue
            candidate = distance[u] + weight
            if distance[v] is None or candidate < distance[v]:
                distance[v], parent[v] = candidate, u
                changed = True
        if not changed:
            break
    affected = {v for u,v,w in edges if distance[u] is not None and (distance[v] is None or distance[u]+w < distance[v])}
    while True:
        more = {v for u,v,_ in edges if u in affected} - affected
        if not more:
            break
        affected |= more
    result = {}
    for target in vertices:
        if target in affected:
            result[target] = ('unbounded', None, None)
        elif distance[target] is None:
            result[target] = ('unreachable', None, None)
        else:
            path, visited, current = [], set(), target
            while current is not None and current not in visited and current in distance:
                visited.add(current)
                path.append(current)
                if current == start:
                    break
                current = parent[current]
            if not path or path[-1] != start:
                raise ValueError("invalid predecessor chain")
            result[target] = ('finite', distance[target], path[::-1])
    return result`,
};
