/**
 * Seed Questions - Operating Systems Domain
 * 10 questions covering processes, memory, scheduling
 */

const osQuestions = [
    {
        domain: 'OS',
        topic: 'os.processes',
        difficulty: 'Easy',
        text: 'What is the difference between a process and a thread?',
        tags: ['processes', 'threads', 'fundamentals'],
        hints: ['Memory sharing', 'Execution units'],
        companyTags: ['All companies'],
        rubric: {
            mustHave: [
                'Process: independent with own memory',
                'Thread: lightweight, shares process memory',
                'Process has own address space',
                'Context switching faster for threads',
            ],
            goodToHave: ['IPC vs thread communication', 'Thread-local storage'],
            redFlags: ['Threads have own address space'],
        },
    },
    {
        domain: 'OS',
        topic: 'os.scheduling',
        difficulty: 'Medium',
        text: 'Compare FCFS, SJF, and Round Robin scheduling algorithms.',
        tags: ['scheduling', 'cpu', 'algorithms'],
        hints: ['Fairness', 'Response time'],
        companyTags: ['Amazon', 'Microsoft'],
        rubric: {
            mustHave: [
                'FCFS: simple but convoy effect',
                'SJF: optimal avg wait time',
                'Round Robin: time quantum based',
                'Trade-offs between throughput and response',
            ],
            goodToHave: ['Priority scheduling', 'Starvation in SJF'],
            redFlags: ['FCFS is optimal for all cases'],
        },
    },
    {
        domain: 'OS',
        topic: 'os.deadlock',
        difficulty: 'Medium',
        text: 'What are the necessary conditions for deadlock?',
        tags: ['deadlock', 'concurrency'],
        hints: ['Four conditions'],
        companyTags: ['Amazon', 'Microsoft'],
        rubric: {
            mustHave: [
                'Mutual Exclusion',
                'Hold and Wait',
                'No Preemption',
                'Circular Wait',
            ],
            goodToHave: ['Bankers algorithm', 'Resource ordering'],
            redFlags: ['Any three conditions cause deadlock'],
        },
    },
    {
        domain: 'OS',
        topic: 'os.memory',
        difficulty: 'Medium',
        text: 'Explain virtual memory and paging. What is a page fault?',
        tags: ['memory', 'virtual-memory', 'paging'],
        hints: ['Address translation'],
        companyTags: ['Amazon', 'Google'],
        rubric: {
            mustHave: [
                'Virtual memory extends physical using disk',
                'Paging divides memory into fixed pages',
                'Page table maps virtual to physical',
                'Page fault: page not in memory',
            ],
            goodToHave: ['TLB', 'Page replacement', 'Thrashing'],
            redFlags: ['Page faults are errors'],
        },
    },
    {
        domain: 'OS',
        topic: 'os.synchronization',
        difficulty: 'Medium',
        text: 'What is a semaphore? Binary vs counting semaphores.',
        tags: ['synchronization', 'semaphore'],
        hints: ['wait()/signal()'],
        companyTags: ['Amazon', 'Microsoft'],
        rubric: {
            mustHave: [
                'Semaphore is sync primitive',
                'Binary: 0 or 1, like mutex',
                'Counting: multiple resources',
                'Operations: wait (P) and signal (V)',
            ],
            goodToHave: ['Producer-consumer solution'],
            redFlags: ['Binary and counting are identical'],
        },
    },
    {
        domain: 'OS',
        topic: 'os.page-replacement',
        difficulty: 'Medium',
        text: 'Compare LRU and FIFO page replacement algorithms.',
        tags: ['memory', 'page-replacement'],
        hints: ['Beladys anomaly'],
        companyTags: ['Amazon', 'Google'],
        rubric: {
            mustHave: [
                'FIFO: replaces oldest page',
                'LRU: replaces least recently used',
                'FIFO has Beladys anomaly',
                'LRU is harder to implement',
            ],
            goodToHave: ['Clock algorithm', 'Working set'],
            redFlags: ['LRU has Beladys anomaly'],
        },
    },
    {
        domain: 'OS',
        topic: 'os.ipc',
        difficulty: 'Medium',
        text: 'Explain different IPC mechanisms.',
        tags: ['ipc', 'processes'],
        hints: ['Pipes, shared memory'],
        companyTags: ['Amazon', 'Microsoft'],
        rubric: {
            mustHave: [
                'Pipes: unidirectional',
                'Shared memory: fastest',
                'Message queues: async',
                'Sockets: network communication',
            ],
            goodToHave: ['Named pipes', 'Signals'],
            redFlags: ['Shared memory is always safest'],
        },
    },
    {
        domain: 'OS',
        topic: 'os.system-calls',
        difficulty: 'Easy',
        text: 'What is a system call? Give examples.',
        tags: ['system-calls', 'kernel'],
        hints: ['User to kernel mode'],
        companyTags: ['TCS', 'Amazon'],
        rubric: {
            mustHave: [
                'Interface between user and kernel',
                'Switches to kernel mode',
                'Examples: open, read, write, fork',
                'Controlled access to hardware',
            ],
            goodToHave: ['System call overhead'],
            redFlags: ['System calls run in user mode'],
        },
    },
    {
        domain: 'OS',
        topic: 'os.context-switch',
        difficulty: 'Medium',
        text: 'What is a context switch? Why is it expensive?',
        tags: ['context-switch', 'performance'],
        hints: ['State saving'],
        companyTags: ['Amazon', 'Google'],
        rubric: {
            mustHave: [
                'Saving current process state',
                'Loading next process state',
                'Involves registers, PC, stack pointer',
                'Overhead: time not doing work',
            ],
            goodToHave: ['TLB flush', 'Cache pollution'],
            redFlags: ['Context switch is free'],
        },
    },
    {
        domain: 'OS',
        topic: 'os.memory',
        difficulty: 'Easy',
        text: 'Compare paging and segmentation.',
        tags: ['memory', 'paging', 'segmentation'],
        hints: ['Fixed vs variable size'],
        companyTags: ['Amazon', 'Microsoft'],
        rubric: {
            mustHave: [
                'Paging: fixed-size, no external frag',
                'Segmentation: variable, logical division',
                'Paging has internal fragmentation',
                'Segmentation has external fragmentation',
            ],
            goodToHave: ['Segmented paging'],
            redFlags: ['Segmentation eliminates all fragmentation'],
        },
    },
];

module.exports = { osQuestions };
