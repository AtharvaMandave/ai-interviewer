/**
 * Seed Questions - DSA Domain
 * 15 questions covering arrays, linked lists, trees, graphs, sorting, etc.
 */

const dsaQuestions = [
    {
        domain: 'DSA',
        topic: 'dsa.arrays',
        difficulty: 'Easy',
        text: 'What is the difference between an array and a linked list? When would you prefer one over the other?',
        tags: ['arrays', 'linked-list', 'data-structures', 'fundamentals'],
        hints: ['Consider memory allocation', 'Think about access patterns'],
        companyTags: ['Amazon', 'Microsoft'],
        rubric: {
            mustHave: [
                'Arrays have contiguous memory allocation',
                'Linked lists use pointers/references',
                'Arrays offer O(1) random access',
                'Linked lists offer O(1) insertion/deletion at known position',
                'Arrays have fixed size (in most languages)',
            ],
            goodToHave: [
                'Cache locality advantage of arrays',
                'Memory overhead of linked list nodes',
                'Dynamic arrays like ArrayList',
            ],
            redFlags: [
                'Linked lists have O(1) random access',
                'Arrays are always better than linked lists',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.arrays',
        difficulty: 'Medium',
        text: 'Explain the two-pointer technique. Give an example of a problem it can solve.',
        tags: ['arrays', 'two-pointer', 'algorithms'],
        hints: ['Think about sorted arrays', 'Consider pair sum problems'],
        companyTags: ['Google', 'Facebook'],
        rubric: {
            mustHave: [
                'Uses two indices/pointers to traverse',
                'Often used on sorted arrays',
                'Reduces O(n²) to O(n) in many cases',
                'Example: finding pair with target sum',
            ],
            goodToHave: [
                'Can be used for palindrome checking',
                'Container with most water problem',
                'Three sum variation',
            ],
            redFlags: [
                'Only works with sorted arrays',
                'Always uses start and end pointers',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.sorting',
        difficulty: 'Medium',
        text: 'Compare Quick Sort and Merge Sort. What are their time and space complexities?',
        tags: ['sorting', 'algorithms', 'complexity'],
        hints: ['Consider worst case scenarios', 'Think about space requirements'],
        companyTags: ['Amazon', 'Google', 'Microsoft'],
        rubric: {
            mustHave: [
                'Quick Sort: O(n log n) average, O(n²) worst case',
                'Merge Sort: O(n log n) always',
                'Quick Sort: O(log n) space (in-place)',
                'Merge Sort: O(n) space',
                'Merge Sort is stable, Quick Sort is not',
            ],
            goodToHave: [
                'Quick Sort has better cache locality',
                'Pivot selection strategies',
                'Merge Sort preferred for linked lists',
            ],
            redFlags: [
                'Quick Sort is always faster than Merge Sort',
                'Both have same space complexity',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.trees',
        difficulty: 'Easy',
        text: 'What is a Binary Search Tree (BST)? What are its key properties?',
        tags: ['trees', 'bst', 'data-structures'],
        hints: ['Think about ordering property', 'Consider search operations'],
        companyTags: ['Amazon', 'Microsoft'],
        rubric: {
            mustHave: [
                'Left subtree contains smaller values',
                'Right subtree contains larger values',
                'Search operation is O(log n) on average',
                'In-order traversal gives sorted elements',
            ],
            goodToHave: [
                'Can degenerate to O(n) if unbalanced',
                'Self-balancing variants like AVL, Red-Black',
                'Insertion and deletion complexities',
            ],
            redFlags: [
                'BST always has O(log n) search',
                'Duplicate values are always allowed',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.trees',
        difficulty: 'Medium',
        text: 'Explain the different tree traversal methods with examples.',
        tags: ['trees', 'traversal', 'recursion'],
        hints: ['Pre-order, In-order, Post-order', 'Level order traversal'],
        companyTags: ['Amazon', 'Facebook', 'Google'],
        rubric: {
            mustHave: [
                'Pre-order: Root, Left, Right',
                'In-order: Left, Root, Right',
                'Post-order: Left, Right, Root',
                'Level-order uses queue (BFS)',
            ],
            goodToHave: [
                'In-order on BST gives sorted order',
                'Pre-order for tree serialization',
                'Post-order for deletion/cleanup',
                'Morris traversal for O(1) space',
            ],
            redFlags: [
                'Pre-order visits left before root',
                'All traversals use the same approach',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.graphs',
        difficulty: 'Medium',
        text: 'Compare BFS and DFS graph traversal algorithms.',
        tags: ['graphs', 'bfs', 'dfs', 'algorithms'],
        hints: ['Consider data structures used', 'Think about shortest path'],
        companyTags: ['Google', 'Facebook', 'Amazon'],
        rubric: {
            mustHave: [
                'BFS uses queue, DFS uses stack/recursion',
                'BFS finds shortest path in unweighted graphs',
                'DFS explores depth before breadth',
                'Both have O(V+E) time complexity',
            ],
            goodToHave: [
                'BFS better for level-wise exploration',
                'DFS better for cycle detection',
                'Space complexity differences',
                'Topological sort uses DFS',
            ],
            redFlags: [
                'DFS finds shortest path',
                'BFS uses stack',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.graphs',
        difficulty: 'Hard',
        text: 'Explain Dijkstras algorithm. What are its limitations?',
        tags: ['graphs', 'shortest-path', 'algorithms'],
        hints: ['Greedy approach', 'Priority queue'],
        companyTags: ['Google', 'Uber', 'Microsoft'],
        rubric: {
            mustHave: [
                'Finds shortest path from source to all vertices',
                'Uses greedy approach with priority queue',
                'Does not work with negative edge weights',
                'Time complexity O((V+E) log V) with min-heap',
            ],
            goodToHave: [
                'Bellman-Ford handles negative weights',
                'A* is an optimization of Dijkstra',
                'Can be used for single-source shortest path',
            ],
            redFlags: [
                'Works with negative edge weights',
                'Has O(V²) complexity always',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.dynamic-programming',
        difficulty: 'Medium',
        text: 'What is Dynamic Programming? Explain memoization vs tabulation.',
        tags: ['dp', 'algorithms', 'optimization'],
        hints: ['Overlapping subproblems', 'Optimal substructure'],
        companyTags: ['Amazon', 'Google', 'Facebook', 'Microsoft'],
        rubric: {
            mustHave: [
                'DP solves problems with overlapping subproblems',
                'Requires optimal substructure property',
                'Memoization is top-down with caching',
                'Tabulation is bottom-up with iteration',
            ],
            goodToHave: [
                'Memoization uses recursion + cache',
                'Tabulation often more space-efficient',
                'Classic examples: Fibonacci, Knapsack',
            ],
            redFlags: [
                'Memoization is always better than tabulation',
                'DP works on any recursive problem',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.hashing',
        difficulty: 'Medium',
        text: 'Explain how a hash table works. How are collisions handled?',
        tags: ['hashing', 'hash-table', 'data-structures'],
        hints: ['Hash function', 'Collision resolution strategies'],
        companyTags: ['Amazon', 'Google', 'Microsoft'],
        rubric: {
            mustHave: [
                'Hash function maps keys to array indices',
                'Provides O(1) average case for insert/search/delete',
                'Chaining: linked list at each bucket',
                'Open addressing: probing for next empty slot',
            ],
            goodToHave: [
                'Load factor and rehashing',
                'Linear vs quadratic vs double hashing',
                'Good hash function properties',
            ],
            redFlags: [
                'Hash tables guarantee O(1) operations',
                'Collisions never occur with good hash functions',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.stacks-queues',
        difficulty: 'Easy',
        text: 'What is the difference between a stack and a queue? Give real-world examples.',
        tags: ['stack', 'queue', 'data-structures'],
        hints: ['LIFO vs FIFO', 'Think about everyday scenarios'],
        companyTags: ['TCS', 'Infosys', 'Amazon'],
        rubric: {
            mustHave: [
                'Stack follows LIFO (Last In First Out)',
                'Queue follows FIFO (First In First Out)',
                'Stack: push/pop, Queue: enqueue/dequeue',
                'Stack example: function call stack, undo operations',
                'Queue example: task scheduling, BFS',
            ],
            goodToHave: [
                'Priority queue concept',
                'Deque (double-ended queue)',
                'Circular queue implementation',
            ],
            redFlags: [
                'Stack and queue have same access pattern',
                'Queue uses LIFO ordering',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.recursion',
        difficulty: 'Easy',
        text: 'What is recursion? What is a base case and why is it important?',
        tags: ['recursion', 'fundamentals'],
        hints: ['Function calling itself', 'Termination condition'],
        companyTags: ['TCS', 'Infosys', 'Wipro'],
        rubric: {
            mustHave: [
                'Function calling itself',
                'Base case is the termination condition',
                'Without base case: infinite recursion/stack overflow',
                'Each call reduces problem size',
            ],
            goodToHave: [
                'Tail recursion optimization',
                'Recursion vs iteration trade-offs',
                'Call stack memory usage',
            ],
            redFlags: [
                'Recursion is always better than iteration',
                'Base case is optional',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.heaps',
        difficulty: 'Medium',
        text: 'What is a heap data structure? Explain min-heap and max-heap.',
        tags: ['heap', 'priority-queue', 'data-structures'],
        hints: ['Complete binary tree', 'Parent-child relationship'],
        companyTags: ['Amazon', 'Google'],
        rubric: {
            mustHave: [
                'Complete binary tree structure',
                'Min-heap: parent <= children',
                'Max-heap: parent >= children',
                'Root is min/max element',
                'Insert/extract operations are O(log n)',
            ],
            goodToHave: [
                'Heap sort uses heap',
                'Priority queue implementation',
                'Heapify operation',
            ],
            redFlags: [
                'Heap is a BST',
                'Search in heap is O(log n)',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.complexity',
        difficulty: 'Easy',
        text: 'Explain Big O notation. What does O(n log n) mean?',
        tags: ['complexity', 'big-o', 'fundamentals'],
        hints: ['Describes growth rate', 'Ignore constants'],
        companyTags: ['All companies'],
        rubric: {
            mustHave: [
                'Describes upper bound of algorithm growth',
                'Ignores constants and lower-order terms',
                'O(n log n): grows faster than O(n) but slower than O(n²)',
                'Examples of common complexities',
            ],
            goodToHave: [
                'Best, average, worst case analysis',
                'Space complexity considerations',
                'Omega and Theta notations',
            ],
            redFlags: [
                'Big O describes exact runtime',
                'O(2n) is different from O(n)',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.binary-search',
        difficulty: 'Easy',
        text: 'Explain binary search. What are its requirements and time complexity?',
        tags: ['binary-search', 'algorithms', 'searching'],
        hints: ['Sorted array', 'Divide and conquer'],
        companyTags: ['Amazon', 'Google', 'Microsoft'],
        rubric: {
            mustHave: [
                'Requires sorted array',
                'Divide and conquer approach',
                'Compare with middle element',
                'O(log n) time complexity',
                'O(1) space complexity',
            ],
            goodToHave: [
                'Iterative vs recursive implementation',
                'Finding first/last occurrence',
                'Binary search on answer technique',
            ],
            redFlags: [
                'Works on unsorted arrays',
                'Has O(n) time complexity',
            ],
        },
    },
    {
        domain: 'DSA',
        topic: 'dsa.linked-list',
        difficulty: 'Medium',
        text: 'How would you detect a cycle in a linked list?',
        tags: ['linked-list', 'algorithms', 'floyd'],
        hints: ['Two pointers', 'Fast and slow'],
        companyTags: ['Amazon', 'Microsoft', 'Google'],
        rubric: {
            mustHave: [
                'Floyd cycle detection (tortoise and hare)',
                'Two pointers: slow moves 1, fast moves 2',
                'If they meet, cycle exists',
                'O(n) time, O(1) space',
            ],
            goodToHave: [
                'Finding cycle start point',
                'Alternative hash set approach',
                'Cycle length calculation',
            ],
            redFlags: [
                'Requires extra space for hash set only',
                'O(n²) is the only way',
            ],
        },
    },
];

module.exports = { dsaQuestions };
