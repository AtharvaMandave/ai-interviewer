/**
 * Seed Questions - Java Domain
 * 15 questions covering OOP, collections, multithreading, JVM, etc.
 */

const javaQuestions = [
    {
        domain: 'Java',
        topic: 'java.collections.hashmap',
        difficulty: 'Medium',
        text: 'How does HashMap work internally in Java? Explain its internal data structure.',
        tags: ['collections', 'hashmap', 'hashing'],
        hints: ['Array of buckets', 'Collision handling'],
        companyTags: ['Amazon', 'Google', 'Microsoft'],
        rubric: {
            mustHave: [
                'Uses array of buckets (Node array)',
                'Hash function determines bucket index',
                'Collision handling via chaining (linked list)',
                'Java 8: treeification when bucket size > 8',
                'Load factor triggers resizing',
            ],
            goodToHave: [
                'Default capacity is 16',
                'Load factor default is 0.75',
                'equals() and hashCode() contract',
                'Thread-safety considerations',
            ],
            redFlags: [
                'HashMap maintains insertion order',
                'Collision always overwrites value',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.oop.abstraction',
        difficulty: 'Easy',
        text: 'What is the difference between abstract class and interface in Java?',
        tags: ['oop', 'abstraction', 'interface'],
        hints: ['Multiple inheritance', 'Method implementation'],
        companyTags: ['TCS', 'Infosys', 'Wipro', 'Amazon'],
        rubric: {
            mustHave: [
                'Interface: all methods abstract (before Java 8)',
                'Abstract class: can have concrete methods',
                'Class can implement multiple interfaces',
                'Class can extend only one abstract class',
                'Interface variables are public static final',
            ],
            goodToHave: [
                'Java 8 default and static methods in interfaces',
                'Java 9 private methods in interfaces',
                'Abstract class can have constructors',
                'When to use each',
            ],
            redFlags: [
                'Abstract class can be instantiated',
                'Interface can have instance variables',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.oop.polymorphism',
        difficulty: 'Easy',
        text: 'Explain method overloading and method overriding with examples.',
        tags: ['oop', 'polymorphism', 'methods'],
        hints: ['Compile-time vs runtime', 'Same method name'],
        companyTags: ['TCS', 'Infosys', 'Wipro'],
        rubric: {
            mustHave: [
                'Overloading: same name, different parameters',
                'Overriding: same signature in subclass',
                'Overloading is compile-time polymorphism',
                'Overriding is runtime polymorphism',
            ],
            goodToHave: [
                'Return type rules in overriding',
                'Access modifier rules',
                '@Override annotation',
                'Covariant return types',
            ],
            redFlags: [
                'Overloading changes only return type',
                'Static methods can be overridden',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.multithreading',
        difficulty: 'Medium',
        text: 'What is the difference between synchronized method and synchronized block?',
        tags: ['multithreading', 'synchronization', 'concurrency'],
        hints: ['Lock granularity', 'Performance'],
        companyTags: ['Amazon', 'Goldman Sachs', 'JP Morgan'],
        rubric: {
            mustHave: [
                'Synchronized method locks entire method',
                'Synchronized block locks specific code section',
                'Synchronized block allows custom lock object',
                'Synchronized block provides finer granularity',
            ],
            goodToHave: [
                'Static synchronized locks class object',
                'Instance synchronized locks this object',
                'Performance implications',
                'Reentrant nature of synchronized',
            ],
            redFlags: [
                'Synchronized block is always slower',
                'They are functionally identical',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.multithreading',
        difficulty: 'Medium',
        text: 'Explain the difference between wait() and sleep() in Java.',
        tags: ['multithreading', 'threads', 'synchronization'],
        hints: ['Lock behavior', 'Object vs Thread method'],
        companyTags: ['Amazon', 'Microsoft', 'Goldman Sachs'],
        rubric: {
            mustHave: [
                'wait() releases the lock, sleep() does not',
                'wait() is Object method, sleep() is Thread method',
                'wait() must be called inside synchronized block',
                'wait() can be interrupted by notify()/notifyAll()',
            ],
            goodToHave: [
                'InterruptedException handling',
                'Spurious wakeup considerations',
                'wait() with timeout',
            ],
            redFlags: [
                'sleep() releases the lock',
                'wait() can be called anywhere',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.memory',
        difficulty: 'Medium',
        text: 'Explain the difference between stack and heap memory in Java.',
        tags: ['memory', 'jvm', 'fundamentals'],
        hints: ['Where objects live', 'Thread access'],
        companyTags: ['Amazon', 'Google', 'Flipkart'],
        rubric: {
            mustHave: [
                'Stack stores method calls and local variables',
                'Heap stores objects and instance variables',
                'Stack is thread-local, heap is shared',
                'Stack has LIFO order',
                'Objects are garbage collected from heap',
            ],
            goodToHave: [
                'StackOverflowError vs OutOfMemoryError',
                'Primitive vs reference variables',
                'String pool in heap',
            ],
            redFlags: [
                'Objects are stored on stack',
                'Stack memory is shared between threads',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.garbage-collection',
        difficulty: 'Medium',
        text: 'How does garbage collection work in Java?',
        tags: ['gc', 'memory', 'jvm'],
        hints: ['Automatic memory management', 'GC algorithms'],
        companyTags: ['Amazon', 'Google', 'Netflix'],
        rubric: {
            mustHave: [
                'Automatic memory management',
                'Reclaims unreachable objects',
                'Mark and sweep is basic algorithm',
                'Cannot force GC (only suggest with System.gc())',
            ],
            goodToHave: [
                'Generational GC (Young, Old generations)',
                'Different GC algorithms (G1, ZGC, etc.)',
                'finalize() method (deprecated)',
                'GC roots concept',
            ],
            redFlags: [
                'GC runs immediately when called',
                'GC guarantees no memory leaks',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.exceptions',
        difficulty: 'Easy',
        text: 'What is the difference between checked and unchecked exceptions?',
        tags: ['exceptions', 'error-handling'],
        hints: ['Compile-time vs runtime', 'Exception hierarchy'],
        companyTags: ['TCS', 'Infosys', 'Amazon'],
        rubric: {
            mustHave: [
                'Checked exceptions must be handled or declared',
                'Unchecked exceptions extend RuntimeException',
                'Checked: IOException, SQLException',
                'Unchecked: NullPointerException, ArrayIndexOutOfBounds',
            ],
            goodToHave: [
                'Error vs Exception',
                'Custom exception creation',
                'When to use each type',
            ],
            redFlags: [
                'All exceptions must be caught',
                'RuntimeException is a checked exception',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.strings',
        difficulty: 'Easy',
        text: 'What is the difference between String, StringBuilder, and StringBuffer?',
        tags: ['strings', 'fundamentals'],
        hints: ['Mutability', 'Thread safety'],
        companyTags: ['TCS', 'Infosys', 'Wipro', 'Amazon'],
        rubric: {
            mustHave: [
                'String is immutable',
                'StringBuilder is mutable and not thread-safe',
                'StringBuffer is mutable and thread-safe',
                'StringBuilder is faster than StringBuffer',
            ],
            goodToHave: [
                'String pool optimization',
                'When to use each',
                'Performance in loops',
            ],
            redFlags: [
                'String is mutable',
                'StringBuilder is thread-safe',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.collections.list',
        difficulty: 'Medium',
        text: 'Compare ArrayList and LinkedList. When would you use each?',
        tags: ['collections', 'list', 'data-structures'],
        hints: ['Access patterns', 'Memory usage'],
        companyTags: ['Amazon', 'Microsoft', 'Flipkart'],
        rubric: {
            mustHave: [
                'ArrayList: O(1) random access, O(n) insertion/deletion',
                'LinkedList: O(n) random access, O(1) insertion/deletion at ends',
                'ArrayList uses dynamic array internally',
                'LinkedList uses doubly-linked list',
            ],
            goodToHave: [
                'Memory overhead of LinkedList nodes',
                'ArrayList capacity and resizing',
                'LinkedList as Deque',
            ],
            redFlags: [
                'LinkedList has O(1) random access',
                'ArrayList insertion is always O(1)',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.streams',
        difficulty: 'Medium',
        text: 'What are Java Streams? Explain the difference between intermediate and terminal operations.',
        tags: ['streams', 'java8', 'functional'],
        hints: ['Lazy evaluation', 'Pipeline'],
        companyTags: ['Amazon', 'Google', 'Adobe'],
        rubric: {
            mustHave: [
                'Streams process collections functionally',
                'Intermediate: filter, map, sorted (lazy)',
                'Terminal: collect, forEach, reduce (triggers execution)',
                'Stream can only be consumed once',
            ],
            goodToHave: [
                'Parallel streams',
                'Short-circuiting operations',
                'Common collectors',
            ],
            redFlags: [
                'Intermediate operations execute immediately',
                'Streams can be reused',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.oop.solid',
        difficulty: 'Medium',
        text: 'Explain the SOLID principles in object-oriented design.',
        tags: ['oop', 'solid', 'design'],
        hints: ['Five principles', 'Clean code'],
        companyTags: ['Amazon', 'Google', 'Microsoft'],
        rubric: {
            mustHave: [
                'S: Single Responsibility Principle',
                'O: Open/Closed Principle',
                'L: Liskov Substitution Principle',
                'I: Interface Segregation Principle',
                'D: Dependency Inversion Principle',
            ],
            goodToHave: [
                'Examples for each principle',
                'Real-world applications',
                'Trade-offs and when to break them',
            ],
            redFlags: [
                'SOLID is only for Java',
                'All principles must always be followed',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.generics',
        difficulty: 'Medium',
        text: 'What are Generics in Java? Explain type erasure.',
        tags: ['generics', 'type-safety'],
        hints: ['Compile-time type safety', 'Runtime behavior'],
        companyTags: ['Amazon', 'Google'],
        rubric: {
            mustHave: [
                'Generics provide compile-time type safety',
                'Type erasure removes generic type info at runtime',
                'T becomes Object after compilation',
                'Prevents ClassCastException at runtime',
            ],
            goodToHave: [
                'Wildcard types (?, extends, super)',
                'Bounded type parameters',
                'Generic methods vs generic classes',
            ],
            redFlags: [
                'Generic type info available at runtime',
                'Can create array of generic type',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.equals-hashcode',
        difficulty: 'Medium',
        text: 'Why must you override hashCode() when you override equals()?',
        tags: ['objects', 'hashcode', 'collections'],
        hints: ['HashMap contract', 'Object identity'],
        companyTags: ['Amazon', 'Goldman Sachs', 'Microsoft'],
        rubric: {
            mustHave: [
                'equals() true implies same hashCode()',
                'HashMap uses hashCode for bucket lookup',
                'Breaking contract causes incorrect behavior in HashSet/HashMap',
                'hashCode used for quick inequality check',
            ],
            goodToHave: [
                'hashCode can be same for unequal objects',
                'Immutable fields preferred for hashCode',
                'Objects.hash() utility',
            ],
            redFlags: [
                'Same hashCode means objects are equal',
                'Override equals() only is sufficient',
            ],
        },
    },
    {
        domain: 'Java',
        topic: 'java.lambda',
        difficulty: 'Easy',
        text: 'What is a lambda expression in Java? Give examples.',
        tags: ['lambda', 'java8', 'functional'],
        hints: ['Anonymous function', 'Functional interface'],
        companyTags: ['Amazon', 'Google', 'Adobe'],
        rubric: {
            mustHave: [
                'Anonymous function / short way to implement functional interface',
                'Syntax: (parameters) -> expression/block',
                'Used with functional interfaces',
                'Example: Comparator, Runnable, Function',
            ],
            goodToHave: [
                'Method references',
                'Effectively final variables',
                'Built-in functional interfaces',
            ],
            redFlags: [
                'Lambda creates new class file',
                'Can be used with any interface',
            ],
        },
    },
];

module.exports = { javaQuestions };
