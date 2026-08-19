const sem3ec = require('./sem3');

const dge303ict = JSON.parse(JSON.stringify(sem3ec.find((s) => s.code === 'DGE303')));
dge303ict.branch = 'ICT';

module.exports = [
  dge303ict,
  {
    code: 'DSU301', name: 'Data Structures using C', branch: 'ICT', semester: 3, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Introduction to Data Structures', weightage: 15, topics: [
        { t: 'Data structures and ADTs', s: ['data types and structures', 'abstract data type concept', 'classification of structures'] },
        { t: 'Algorithm complexity', s: ['time and space complexity', 'Big O notation', 'best, worst and average cases'] },
        { t: 'Arrays revisited', s: ['array representation', 'insertion and deletion', 'sparse matrices'] },
        { t: 'Pointers and dynamic memory', s: ['pointer arithmetic', 'malloc and calloc', 'dynamic arrays'] }
      ] },
      { n: 2, title: 'Linked Lists', weightage: 20, topics: [
        { t: 'Singly linked list', s: ['node structure', 'insertion and deletion operations', 'traversal and search'] },
        { t: 'Doubly linked list', s: ['node structure', 'insertion and deletion', 'advantages over singly list'] },
        { t: 'Circular linked list', s: ['representation', 'operations', 'applications'] },
        { t: 'Applications of linked lists', s: ['polynomial representation', 'sparse matrix using lists', 'memory management basics'] }
      ] },
      { n: 3, title: 'Stacks and Queues', weightage: 20, topics: [
        { t: 'Stack operations', s: ['push and pop', 'array implementation', 'linked list implementation'] },
        { t: 'Applications of stack', s: ['infix to postfix conversion', 'evaluation of postfix expression', 'function call stack'] },
        { t: 'Queue operations', s: ['enqueue and dequeue', 'circular queue', 'priority queue basics'] },
        { t: 'Deque and queue applications', s: ['double ended queue', 'scheduling applications', 'simulation basics'] }
      ] },
      { n: 4, title: 'Trees', weightage: 25, topics: [
        { t: 'Binary trees', s: ['terminology', 'representation', 'full and complete trees'] },
        { t: 'Tree traversals', s: ['inorder, preorder and postorder', 'recursive implementations', 'level order traversal'] },
        { t: 'Binary search tree', s: ['insertion and deletion', 'search operations', 'applications'] },
        { t: 'AVL and heap basics', s: ['balanced trees concept', 'AVL rotations overview', 'min and max heap'] }
      ] },
      { n: 5, title: 'Sorting, Searching and Hashing', weightage: 20, topics: [
        { t: 'Simple sorting methods', s: ['bubble sort', 'insertion sort', 'selection sort'] },
        { t: 'Advanced sorting methods', s: ['quick sort', 'merge sort', 'complexity comparison'] },
        { t: 'Searching techniques', s: ['linear search', 'binary search', 'comparison of methods'] },
        { t: 'Hashing', s: ['hash functions', 'collision resolution', 'separate chaining and open addressing'] }
      ] }
    ]
  },
  {
    code: 'COA302', name: 'Computer Organization and Architecture', branch: 'ICT', semester: 3, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Basic Structure of Computers', weightage: 15, topics: [
        { t: 'Functional units of a computer', s: ['input, output and memory', 'ALU and control unit', 'interconnection'] },
        { t: 'Von Neumann architecture', s: ['stored program concept', 'instruction execution cycle', 'limitations'] },
        { t: 'System buses', s: ['address, data and control buses', 'bus organization', 'bus arbitration basics'] },
        { t: 'Performance measures', s: ['clock rate and CPI', 'MIPS and MFLOPS', 'Amdahl law basics'] }
      ] },
      { n: 2, title: 'Instruction Set and Addressing', weightage: 20, topics: [
        { t: 'Instruction formats', s: ['opcode and operand fields', 'zero, one, two and three address machines', 'fixed and variable length'] },
        { t: 'Addressing modes', s: ['immediate and direct', 'indirect and register', 'indexed and relative'] },
        { t: 'Instruction types', s: ['data transfer instructions', 'arithmetic and logical instructions', 'branch and control instructions'] },
        { t: 'CISC and RISC', s: ['characteristics of CISC', 'characteristics of RISC', 'comparison'] }
      ] },
      { n: 3, title: 'Processor Design', weightage: 20, topics: [
        { t: 'CPU datapath', s: ['registers and ALU', 'bus organization', 'single and multi bus design'] },
        { t: 'Control unit design', s: ['hardwired control', 'microprogrammed control', 'control signals generation'] },
        { t: 'Pipelining basics', s: ['pipeline stages', 'speedup and efficiency', 'pipeline hazards'] },
        { t: 'Interrupts in CPU', s: ['interrupt types', 'interrupt handling', 'priority and masking'] }
      ] },
      { n: 4, title: 'Memory Hierarchy', weightage: 25, topics: [
        { t: 'Memory hierarchy concept', s: ['registers, cache, main and secondary', 'locality of reference', 'performance impact'] },
        { t: 'Cache memory', s: ['mapping techniques', 'replacement policies', 'write policies'] },
        { t: 'Virtual memory', s: ['paging', 'page tables and TLB', 'segmentation'] },
        { t: 'Secondary storage and DMA', s: ['magnetic and solid state storage', 'direct memory access', 'RAID basics'] }
      ] },
      { n: 5, title: 'Input Output Organization', weightage: 20, topics: [
        { t: 'I/O interface', s: ['I/O ports and registers', 'memory mapped and isolated I/O', 'handshaking'] },
        { t: 'Interrupt driven I/O', s: ['interrupt request and acknowledge', 'vectored and non-vectored', 'interrupt controllers'] },
        { t: 'DMA controller', s: ['DMA transfer modes', 'cycle stealing', 'applications'] },
        { t: 'Standard I/O buses', s: ['serial and parallel ports', 'USB and PCI basics', 'I/O performance'] }
      ] }
    ]
  },
  { code: 'DSL301', name: 'Data Structures Lab', branch: 'ICT', semester: 3, credits: 2, is_lab: 1, units: [] }
];