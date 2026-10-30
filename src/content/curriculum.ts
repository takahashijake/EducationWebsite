import type { Section, Topic } from "./types";

export const sections: Section[] = [
  {
    id: "programming",
    title: "Programming Fundamentals",
    description:
      "Learn to express ideas in code, one building block at a time.",
    order: 1,
    icon: "code",
  },
  {
    id: "discrete-math",
    title: "Discrete Mathematics",
    description: "Build the mathematical language behind computer science.",
    order: 2,
    icon: "logic",
  },
  {
    id: "data-structures",
    title: "Data Structures",
    description:
      "Understand how organizing data changes what you can do with it.",
    order: 3,
    icon: "layers",
  },
  {
    id: "algorithms",
    title: "Algorithms",
    description:
      "Find solutions, compare approaches, and reason about efficiency.",
    order: 4,
    icon: "route",
  },
  {
    id: "architecture",
    title: "Computer Architecture",
    description: "Look beneath your code, from individual bits to the CPU.",
    order: 5,
    icon: "cpu",
  },
  {
    id: "operating-systems",
    title: "Operating Systems",
    description: "Discover how computers manage resources and run programs.",
    order: 6,
    icon: "terminal",
  },
  {
    id: "networks",
    title: "Computer Networks",
    description:
      "Follow information as it travels between connected computers.",
    order: 7,
    icon: "network",
  },
  {
    id: "software",
    title: "Databases and Software Engineering",
    description:
      "Store information and build software that others can rely on.",
    order: 8,
    icon: "database",
  },
];

// IDs and slugs are explicit: changing a display title never breaks a URL or saved progress.
export const topics: Topic[] = [
  {
    id: "variables-data-types",
    slug: "variables-data-types",
    sectionId: "programming",
    title: "Variables and Data Types",
    description:
      "Give values names and understand numbers, strings, and booleans.",
    order: 1,
    status: "available",
  },
  {
    id: "operators-expressions",
    slug: "operators-expressions",
    sectionId: "programming",
    title: "Operators and Expressions",
    description:
      "Combine values with arithmetic, comparison, and logical operators.",
    order: 2,
    status: "available",
    prerequisites: ["variables-data-types"],
  },
  {
    id: "conditionals",
    slug: "conditionals",
    sectionId: "programming",
    title: "Conditionals",
    description:
      "Choose which instructions run using if, else, and boolean conditions.",
    order: 3,
    status: "available",
    prerequisites: ["operators-expressions"],
  },
  {
    id: "loops",
    slug: "loops",
    sectionId: "programming",
    title: "Loops",
    description:
      "Repeat work with for and while loops, and recognize stopping conditions.",
    order: 4,
    status: "available",
    prerequisites: ["conditionals"],
  },
  {
    id: "functions",
    slug: "functions",
    sectionId: "programming",
    title: "Functions",
    description:
      "Break programs into reusable operations with parameters and return values.",
    order: 5,
    status: "available",
    prerequisites: ["loops"],
  },
  {
    id: "recursion",
    slug: "recursion",
    sectionId: "programming",
    title: "Recursion",
    description:
      "Solve a problem through smaller calls to the same function and a base case.",
    order: 6,
    status: "available",
    prerequisites: ["functions"],
  },
  {
    id: "debugging",
    slug: "debugging",
    sectionId: "programming",
    title: "Basic Debugging",
    description:
      "Reproduce bugs, inspect program state, and test a focused fix.",
    order: 7,
    status: "available",
    prerequisites: ["functions"],
  },
  {
    id: "propositional-logic",
    slug: "propositional-logic",
    sectionId: "discrete-math",
    title: "Propositional Logic",
    description:
      "Reason about statements using truth tables, implication, and equivalence.",
    order: 1,
    status: "planned",
  },
  {
    id: "sets-relations",
    slug: "sets-relations",
    sectionId: "discrete-math",
    title: "Sets and Relations",
    description:
      "Describe collections, set operations, and relationships between elements.",
    order: 2,
    status: "planned",
  },
  {
    id: "mathematical-functions",
    slug: "mathematical-functions",
    sectionId: "discrete-math",
    title: "Functions",
    description:
      "Explore mappings, domains, ranges, and one-to-one correspondences.",
    order: 3,
    status: "planned",
  },
  {
    id: "proof-techniques",
    slug: "proof-techniques",
    sectionId: "discrete-math",
    title: "Proof Techniques",
    description:
      "Justify claims using direct proof, contradiction, and induction.",
    order: 4,
    status: "planned",
  },
  {
    id: "combinatorics",
    slug: "combinatorics",
    sectionId: "discrete-math",
    title: "Combinatorics",
    description:
      "Count possibilities with permutations, combinations, and counting rules.",
    order: 5,
    status: "planned",
  },
  {
    id: "graph-theory",
    slug: "graph-theory",
    sectionId: "discrete-math",
    title: "Graph Theory Fundamentals",
    description: "Model connections with vertices, edges, paths, and cycles.",
    order: 6,
    status: "planned",
  },
  {
    id: "arrays-strings",
    slug: "arrays-strings",
    sectionId: "data-structures",
    title: "Arrays and Strings",
    description:
      "Access indexed sequences and understand common traversal operations.",
    order: 1,
    status: "available",
    prerequisites: ["loops"],
  },
  {
    id: "linked-lists",
    slug: "linked-lists",
    sectionId: "data-structures",
    title: "Linked Lists",
    description:
      "Connect nodes with references and compare insertion with indexed access.",
    order: 2,
    status: "available",
    prerequisites: ["arrays-strings", "big-o-notation"],
  },
  {
    id: "stacks-queues",
    slug: "stacks-queues",
    sectionId: "data-structures",
    title: "Stacks and Queues",
    description:
      "Manage work in last-in-first-out and first-in-first-out order.",
    order: 3,
    status: "available",
    prerequisites: ["arrays-strings", "linked-lists", "big-o-notation"],
  },
  {
    id: "hash-tables",
    slug: "hash-tables",
    sectionId: "data-structures",
    title: "Hash Tables",
    description:
      "Map keys to values using hashing, buckets, and collision handling.",
    order: 4,
    status: "planned",
  },
  {
    id: "trees",
    slug: "trees",
    sectionId: "data-structures",
    title: "Trees",
    description:
      "Explore binary trees, traversals, and binary search tree operations.",
    order: 5,
    status: "available",
    prerequisites: [
      "recursion",
      "stacks-queues",
      "linked-lists",
      "big-o-notation",
    ],
  },
  {
    id: "graphs",
    slug: "graphs",
    sectionId: "data-structures",
    title: "Graphs",
    description:
      "Represent networks and reason through BFS, DFS, paths, and reachability.",
    order: 6,
    status: "available",
    prerequisites: [
      "arrays-strings",
      "recursion",
      "stacks-queues",
      "big-o-notation",
    ],
  },
  {
    id: "big-o-notation",
    slug: "big-o-notation",
    sectionId: "algorithms",
    title: "Introduction to Big O Notation",
    description:
      "Reason about how the work an algorithm does grows with its input.",
    order: 1,
    status: "available",
  },
  {
    id: "searching",
    slug: "searching",
    sectionId: "algorithms",
    title: "Searching",
    description: "Compare linear search with binary search on sorted data.",
    order: 2,
    status: "available",
    prerequisites: ["arrays-strings", "big-o-notation"],
  },
  {
    id: "sorting",
    slug: "sorting",
    sectionId: "algorithms",
    title: "Sorting",
    description:
      "Arrange data and compare the tradeoffs of common sorting algorithms.",
    order: 3,
    status: "available",
    prerequisites: ["arrays-strings", "big-o-notation"],
  },
  {
    id: "divide-conquer",
    slug: "divide-conquer",
    sectionId: "algorithms",
    title: "Recursion and Divide-and-Conquer",
    description:
      "Split problems, solve smaller instances, and combine their results.",
    order: 4,
    status: "planned",
  },
  {
    id: "greedy-algorithms",
    slug: "greedy-algorithms",
    sectionId: "algorithms",
    title: "Greedy Algorithms",
    description:
      "Make locally best choices and learn when that strategy is justified.",
    order: 5,
    status: "planned",
  },
  {
    id: "dynamic-programming",
    slug: "dynamic-programming",
    sectionId: "algorithms",
    title: "Dynamic Programming",
    description:
      "Reuse solutions to overlapping subproblems with memoization or tables.",
    order: 6,
    status: "available",
    prerequisites: ["recursion", "arrays-strings", "big-o-notation"],
  },
  {
    id: "weighted-shortest-paths",
    slug: "weighted-shortest-paths",
    sectionId: "algorithms",
    title: "Weighted Graphs and Shortest Paths",
    description:
      "Find minimum-cost routes with weighted edges and Dijkstra’s algorithm.",
    order: 7,
    status: "available",
    prerequisites: ["graphs", "big-o-notation"],
  },
  {
    id: "bellman-ford",
    slug: "bellman-ford",
    sectionId: "algorithms",
    title: "Bellman–Ford and Negative-Weight Paths",
    description:
      "Reason about signed paths, relaxation passes, and negative cycles.",
    order: 8,
    status: "available",
    prerequisites: ["graphs", "big-o-notation", "weighted-shortest-paths"],
  },
  {
    id: "binary-number-representation",
    slug: "binary-number-representation",
    sectionId: "architecture",
    title: "Binary Number Representation",
    description: "Read and build whole numbers using bits and powers of two.",
    order: 1,
    status: "available",
  },
  {
    id: "boolean-logic",
    slug: "boolean-logic",
    sectionId: "architecture",
    title: "Boolean Logic",
    description: "Compute with true and false using AND, OR, and NOT.",
    order: 2,
    status: "planned",
  },
  {
    id: "logic-gates",
    slug: "logic-gates",
    sectionId: "architecture",
    title: "Logic Gates",
    description:
      "See how electronic gates implement boolean operations in circuits.",
    order: 3,
    status: "planned",
  },
  {
    id: "cpu-memory",
    slug: "cpu-memory",
    sectionId: "architecture",
    title: "CPU and Memory Fundamentals",
    description:
      "Distinguish registers, caches, RAM, and the processor’s role.",
    order: 4,
    status: "planned",
  },
  {
    id: "instruction-execution",
    slug: "instruction-execution",
    sectionId: "architecture",
    title: "Instruction Execution",
    description:
      "Trace the fetch, decode, and execute cycle of machine instructions.",
    order: 5,
    status: "planned",
  },
  {
    id: "processes-threads",
    slug: "processes-threads",
    sectionId: "operating-systems",
    title: "Processes and Threads",
    description:
      "Distinguish running programs from the execution threads within them.",
    order: 1,
    status: "planned",
  },
  {
    id: "memory-management",
    slug: "memory-management",
    sectionId: "operating-systems",
    title: "Memory Management",
    description:
      "Explore address spaces, virtual memory, paging, and allocation.",
    order: 2,
    status: "planned",
  },
  {
    id: "file-systems",
    slug: "file-systems",
    sectionId: "operating-systems",
    title: "File Systems",
    description:
      "Understand how files, directories, and metadata organize stored data.",
    order: 3,
    status: "planned",
  },
  {
    id: "scheduling",
    slug: "scheduling",
    sectionId: "operating-systems",
    title: "Scheduling",
    description:
      "Explore how the operating system shares CPU time among tasks.",
    order: 4,
    status: "planned",
  },
  {
    id: "concurrency",
    slug: "concurrency",
    sectionId: "operating-systems",
    title: "Concurrency Basics",
    description:
      "Recognize shared state, race conditions, and basic synchronization.",
    order: 5,
    status: "planned",
  },
  {
    id: "network-fundamentals",
    slug: "network-fundamentals",
    sectionId: "networks",
    title: "Network Fundamentals",
    description:
      "Connect devices through links, packets, routers, and protocols.",
    order: 1,
    status: "planned",
  },
  {
    id: "tcp-ip",
    slug: "tcp-ip",
    sectionId: "networks",
    title: "TCP/IP",
    description:
      "Separate IP addressing and routing from TCP’s reliable byte stream.",
    order: 2,
    status: "planned",
  },
  {
    id: "dns",
    slug: "dns",
    sectionId: "networks",
    title: "DNS",
    description: "Follow the lookup that turns a domain name into an address.",
    order: 3,
    status: "planned",
  },
  {
    id: "http-https",
    slug: "http-https",
    sectionId: "networks",
    title: "HTTP/HTTPS",
    description:
      "Read requests and responses, and understand TLS protection in HTTPS.",
    order: 4,
    status: "planned",
  },
  {
    id: "client-server",
    slug: "client-server",
    sectionId: "networks",
    title: "Client-Server Architecture",
    description: "Understand how clients request services and servers respond.",
    order: 5,
    status: "planned",
  },
  {
    id: "relational-databases",
    slug: "relational-databases",
    sectionId: "software",
    title: "Relational Databases",
    description:
      "Organize related records in tables using keys and constraints.",
    order: 1,
    status: "planned",
  },
  {
    id: "sql",
    slug: "sql",
    sectionId: "software",
    title: "SQL Basics",
    description:
      "Select, filter, join, and update data using relational queries.",
    order: 2,
    status: "planned",
  },
  {
    id: "version-control",
    slug: "version-control",
    sectionId: "software",
    title: "Version Control",
    description:
      "Track changes and collaborate using commits, branches, and merges.",
    order: 3,
    status: "planned",
  },
  {
    id: "testing",
    slug: "testing",
    sectionId: "software",
    title: "Testing",
    description:
      "Check behavior with focused unit tests and broader integration tests.",
    order: 4,
    status: "planned",
  },
  {
    id: "apis",
    slug: "apis",
    sectionId: "software",
    title: "APIs",
    description:
      "Design clear interfaces that let software components communicate.",
    order: 5,
    status: "planned",
  },
  {
    id: "software-design",
    slug: "software-design",
    sectionId: "software",
    title: "Software Design Fundamentals",
    description:
      "Use cohesion, separation of concerns, and clear interfaces to manage change.",
    order: 6,
    status: "planned",
  },
];

export const availableTopics = topics.filter(
  (topic) => topic.status === "available",
);
export function getTopicBySlug(slug: string) {
  return topics.find((topic) => topic.slug === slug);
}
export function topicsForSection(sectionId: string) {
  return topics
    .filter((topic) => topic.sectionId === sectionId)
    .sort((a, b) => a.order - b.order);
}
export function topicHref(topic: Topic) {
  return `/lessons/${topic.slug}`;
}

// Stable IDs define the core path independently of other published sections.
export const programmingPath = [
  "variables-data-types",
  "operators-expressions",
  "conditionals",
  "loops",
  "functions",
  "recursion",
  "debugging",
];
export function lessonNeighbors(topic: Topic) {
  const sequence = programmingPath.includes(topic.id)
    ? programmingPath.map((id) => topics.find((item) => item.id === id)!)
    : topicsForSection(topic.sectionId).filter(
        (item) => item.status === "available",
      );
  const index = sequence.findIndex((item) => item.id === topic.id);
  return {
    previous: index > 0 ? sequence[index - 1] : undefined,
    next: index >= 0 ? sequence[index + 1] : undefined,
  };
}
