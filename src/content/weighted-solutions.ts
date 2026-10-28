/** Python references use nonnegative integer weights and sorted labels. */
export const weightedSolutions: Record<string, string> = {
  "weighted-adjacency": `def weighted_adjacency(vertices, edges, directed=False):
    graph = {v: {} for v in vertices}
    for a, b, weight in edges:
        if a not in graph or b not in graph or type(weight) is not int or weight < 0:
            raise ValueError("invalid edge")
        if b in graph[a] or (not directed and a in graph[b]):
            raise ValueError("duplicate edge")
        graph[a][b] = weight
        if not directed:
            graph[b][a] = weight
    return {v: [(n, graph[v][n]) for n in sorted(graph[v])] for v in sorted(graph)}`,
  "weighted-route-cost": `def route_cost(adjacency, path):
    if not path or path[0] not in adjacency:
        return None
    total = 0
    for a, b in zip(path, path[1:]):
        weight = dict(adjacency.get(a, []))
        if b not in weight:
            return None
        total += weight[b]
    return total`,
  "weighted-select": `def select_minimum(distances, settled):
    available = [(distance, vertex) for vertex, distance in distances.items()
                 if vertex not in settled and distance is not None]
    return min(available)[1] if available else None`,
  "weighted-relax": `def relax(distances, predecessors, source, target, weight):
    if type(weight) is not int or weight < 0:
        raise ValueError("nonnegative integer weight required")
    if distances[source] is None:
        return False
    candidate = distances[source] + weight
    if distances[target] is None or candidate < distances[target]:
        distances[target] = candidate
        predecessors[target] = source
        return True
    return False`,
  "weighted-dijkstra": `import heapq

def dijkstra(adjacency, start):
    if start not in adjacency:
        raise ValueError("unknown start")
    for edges in adjacency.values():
        for neighbor, weight in edges:
            if neighbor not in adjacency or type(weight) is not int or weight < 0:
                raise ValueError("invalid edge")
    distances = {v: None for v in adjacency}
    predecessors = {v: None for v in adjacency}
    distances[start] = 0
    heap = [(0, start)]
    settled = set()
    while heap:
        distance, vertex = heapq.heappop(heap)
        if vertex in settled or distance != distances[vertex]:
            continue
        settled.add(vertex)
        for neighbor, weight in sorted(adjacency[vertex]):
            candidate = distance + weight
            old = distances[neighbor]
            if neighbor not in settled and (old is None or candidate < old):
                distances[neighbor] = candidate
                predecessors[neighbor] = vertex
                heapq.heappush(heap, (candidate, neighbor))
    return distances, predecessors`,
  "weighted-reconstruct": `def reconstruct_path(predecessors, distances, start, target):
    if start not in distances or target not in distances or distances[target] is None:
        return None
    path, seen = [], set()
    current = target
    while current is not None and current not in seen:
        seen.add(current)
        path.append(current)
        if current == start:
            return path[::-1]
        current = predecessors.get(current)
    return None`,
};
