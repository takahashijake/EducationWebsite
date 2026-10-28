/** Python contracts use sorted labels and neighbors; edges are (source, destination). */
export const graphSolutions: Record<string, string> = {
  "graph-adjacency": `def build_adjacency(vertices, edges, directed=False):
    result = {v: set() for v in vertices}
    for a, b in edges:
        result[a].add(b)
        if not directed:
            result[b].add(a)
    return {v: sorted(result[v]) for v in sorted(result)}`,
  "graph-bfs": `from collections import deque

def bfs_order(adjacency, start):
    if start not in adjacency:
        return []
    queue = deque([start])
    seen = {start}
    order = []
    while queue:
        vertex = queue.popleft()
        order.append(vertex)
        for neighbor in sorted(adjacency[vertex]):
            if neighbor not in seen:
                seen.add(neighbor)
                queue.append(neighbor)
    return order`,
  "graph-shortest": `from collections import deque

def shortest_path(adjacency, start, target):
    if start not in adjacency or target not in adjacency:
        return None
    queue = deque([start])
    parent = {start: None}
    while queue:
        vertex = queue.popleft()
        if vertex == target:
            path = []
            while vertex is not None:
                path.append(vertex)
                vertex = parent[vertex]
            return path[::-1]
        for neighbor in sorted(adjacency[vertex]):
            if neighbor not in parent:
                parent[neighbor] = vertex
                queue.append(neighbor)
    return None`,
  "graph-dfs": `def dfs_order(adjacency, start):
    if start not in adjacency:
        return []
    seen, order = set(), []
    def visit(vertex):
        seen.add(vertex)
        order.append(vertex)
        for neighbor in sorted(adjacency[vertex]):
            if neighbor not in seen:
                visit(neighbor)
    visit(start)
    return order`,
  "graph-components": `def connected_components(adjacency):
    seen, components = set(), []
    for start in sorted(adjacency):
        if start in seen:
            continue
        component, stack = [], [start]
        seen.add(start)
        while stack:
            vertex = stack.pop()
            component.append(vertex)
            for neighbor in sorted(adjacency[vertex], reverse=True):
                if neighbor not in seen:
                    seen.add(neighbor)
                    stack.append(neighbor)
        components.append(sorted(component))
    return components`,
  "graph-schedule": `import heapq

def schedule_tasks(tasks, prerequisites):
    outgoing = {task: set() for task in tasks}
    indegree = {task: 0 for task in tasks}
    for before, after in prerequisites:
        if after not in outgoing[before]:
            outgoing[before].add(after)
            indegree[after] += 1
    ready = [task for task in tasks if indegree[task] == 0]
    heapq.heapify(ready)
    result = []
    while ready:
        task = heapq.heappop(ready)
        result.append(task)
        for next_task in sorted(outgoing[task]):
            indegree[next_task] -= 1
            if indegree[next_task] == 0:
                heapq.heappush(ready, next_task)
    return result if len(result) == len(indegree) else None`,
};
