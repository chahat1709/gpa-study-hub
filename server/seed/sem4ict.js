module.exports = [
  {
    code: 'DBM401',
    name: 'Database Management Systems',
    branch: 'ICT',
    semester: 4,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Database Fundamentals',
        weightage: 15,
        topics: [
          {
            t: 'Database concepts',
            s: ['data and information', 'database vs file system', 'advantages of DBMS'],
          },
          { t: 'Data models', s: ['hierarchical model', 'network model', 'relational model'] },
          {
            t: 'Three level architecture',
            s: ['external, conceptual and internal levels', 'data independence', 'DBMS components'],
          },
          {
            t: 'Database languages and users',
            s: ['DDL and DML', 'DCL and TCL', 'types of database users'],
          },
        ],
      },
      {
        n: 2,
        title: 'Relational Model and ER Diagram',
        weightage: 20,
        topics: [
          {
            t: 'Relational model concepts',
            s: ['relation, tuple and attribute', 'domain and degree', 'relation keys'],
          },
          {
            t: 'Keys',
            s: ['primary key and candidate key', 'foreign key', 'super key and alternate key'],
          },
          {
            t: 'ER modeling',
            s: ['entities and attributes', 'relationships and cardinality', 'ER diagram notation'],
          },
          {
            t: 'Enhanced ER concepts',
            s: ['specialization and generalization', 'aggregation', 'mapping ER to relational'],
          },
        ],
      },
      {
        n: 3,
        title: 'SQL',
        weightage: 25,
        topics: [
          {
            t: 'DDL statements',
            s: ['CREATE and ALTER table', 'DROP and TRUNCATE', 'constraints'],
          },
          {
            t: 'DML statements',
            s: ['INSERT, UPDATE and DELETE', 'SELECT with WHERE', 'ORDER BY and GROUP BY'],
          },
          {
            t: 'Joins and subqueries',
            s: ['inner and outer joins', 'self join', 'correlated subqueries'],
          },
          {
            t: 'Views and indexes',
            s: ['creating and using views', 'indexes and performance', 'data integrity'],
          },
        ],
      },
      {
        n: 4,
        title: 'Normalization',
        weightage: 20,
        topics: [
          {
            t: 'Functional dependencies',
            s: ['definition and types', 'Armstrong axioms', 'closure of attributes'],
          },
          {
            t: 'Normal forms',
            s: ['first normal form', 'second normal form', 'third normal form'],
          },
          {
            t: 'BCNF and beyond',
            s: ['Boyce-Codd normal form', 'multi valued dependencies', 'denormalization'],
          },
        ],
      },
      {
        n: 5,
        title: 'Transactions and Concurrency Control',
        weightage: 20,
        topics: [
          {
            t: 'Transaction properties',
            s: ['ACID properties', 'transaction states', 'commit and rollback'],
          },
          { t: 'Concurrency problems', s: ['lost update', 'dirty read', 'non-repeatable read'] },
          {
            t: 'Concurrency control techniques',
            s: ['locking and lock types', 'two phase locking', 'deadlock handling'],
          },
          {
            t: 'Recovery and backup',
            s: ['log based recovery', 'checkpoints', 'backup strategies'],
          },
        ],
      },
    ],
  },
  {
    code: 'CNW402',
    name: 'Computer Networks',
    branch: 'ICT',
    semester: 4,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Introduction to Networks',
        weightage: 15,
        topics: [
          {
            t: 'Network uses and applications',
            s: ['resource sharing', 'communication services', 'network applications'],
          },
          {
            t: 'Network classifications',
            s: ['LAN, MAN and WAN', 'topologies', 'switching techniques'],
          },
          { t: 'OSI model', s: ['seven layers', 'layer functions', 'peer to peer communication'] },
          { t: 'TCP/IP model', s: ['four layers', 'protocol stack', 'comparison with OSI'] },
        ],
      },
      {
        n: 2,
        title: 'Physical and Data Link Layer',
        weightage: 25,
        topics: [
          {
            t: 'Transmission media',
            s: ['guided media', 'unguided media', 'signal transmission basics'],
          },
          {
            t: 'Data link layer functions',
            s: ['framing', 'error detection and correction', 'CRC'],
          },
          {
            t: 'Flow and error control',
            s: ['stop and wait protocol', 'sliding window', 'Go-Back-N and selective repeat'],
          },
          { t: 'Ethernet and MAC', s: ['CSMA and CSMA/CD', 'Ethernet frame', 'MAC addressing'] },
        ],
      },
      {
        n: 3,
        title: 'Network Layer',
        weightage: 25,
        topics: [
          {
            t: 'IP addressing',
            s: ['IPv4 address structure', 'classes and private addresses', 'subnetting'],
          },
          {
            t: 'IPv6 basics',
            s: ['address format', 'differences from IPv4', 'transition mechanisms'],
          },
          {
            t: 'Routing algorithms',
            s: ['distance vector routing', 'link state routing', 'routing protocols'],
          },
          { t: 'Network layer protocols', s: ['ARP and RARP', 'ICMP', 'NAT and DHCP'] },
        ],
      },
      {
        n: 4,
        title: 'Transport Layer',
        weightage: 20,
        topics: [
          { t: 'UDP protocol', s: ['UDP header', 'connectionless service', 'applications'] },
          { t: 'TCP protocol', s: ['TCP header', 'three way handshake', 'connection termination'] },
          {
            t: 'TCP flow and congestion control',
            s: ['sliding window in TCP', 'congestion control algorithms', 'retransmission'],
          },
          {
            t: 'Ports and sockets',
            s: ['well known ports', 'socket addressing', 'multiplexing and demultiplexing'],
          },
        ],
      },
      {
        n: 5,
        title: 'Application Layer',
        weightage: 15,
        topics: [
          { t: 'DNS', s: ['domain name hierarchy', 'DNS resolution', 'DNS records'] },
          { t: 'HTTP and WWW', s: ['HTTP methods', 'request and response', 'cookies and caching'] },
          { t: 'Email and file transfer', s: ['SMTP and POP3', 'IMAP', 'FTP operations'] },
          {
            t: 'Network utilities',
            s: ['ping and traceroute', 'netstat', 'wireless network basics'],
          },
        ],
      },
    ],
  },
  {
    code: 'OPS403',
    name: 'Operating Systems',
    branch: 'ICT',
    semester: 4,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Operating System Overview',
        weightage: 15,
        topics: [
          {
            t: 'OS functions',
            s: [
              'process and memory management',
              'file and device management',
              'security and protection',
            ],
          },
          {
            t: 'Types of operating systems',
            s: ['batch and time sharing', 'real time and distributed', 'mobile and embedded OS'],
          },
          {
            t: 'System calls and structures',
            s: ['system call types', 'OS structures', 'boot process'],
          },
        ],
      },
      {
        n: 2,
        title: 'Process Management',
        weightage: 25,
        topics: [
          {
            t: 'Process concepts',
            s: ['process state diagram', 'process control block', 'context switching'],
          },
          {
            t: 'Threads',
            s: ['thread models', 'user and kernel threads', 'multithreading benefits'],
          },
          {
            t: 'CPU scheduling',
            s: ['FCFS scheduling', 'SJF and priority scheduling', 'round robin scheduling'],
          },
          {
            t: 'Interprocess communication',
            s: ['shared memory', 'message passing', 'pipes and signals'],
          },
        ],
      },
      {
        n: 3,
        title: 'Scheduling Algorithms and Deadlocks',
        weightage: 20,
        topics: [
          {
            t: 'Scheduling criteria and evaluation',
            s: [
              'turnaround and waiting time',
              'throughput and response time',
              'scheduling examples',
            ],
          },
          {
            t: 'Deadlock characterization',
            s: ['necessary conditions', 'resource allocation graph', 'deadlock vs starvation'],
          },
          {
            t: 'Deadlock prevention and avoidance',
            s: ['mutual exclusion and hold and wait', 'banker algorithm', 'detection and recovery'],
          },
        ],
      },
      {
        n: 4,
        title: 'Memory Management',
        weightage: 25,
        topics: [
          {
            t: 'Memory allocation strategies',
            s: ['contiguous allocation', 'partitioning', 'fragmentation'],
          },
          { t: 'Paging', s: ['page tables', 'TLB', 'page faults'] },
          {
            t: 'Segmentation',
            s: ['segmentation hardware', 'combined paging and segmentation', 'address translation'],
          },
          {
            t: 'Virtual memory and page replacement',
            s: ['demand paging', 'FIFO, LRU and optimal replacement', 'thrashing'],
          },
        ],
      },
      {
        n: 5,
        title: 'File Systems and I/O',
        weightage: 15,
        topics: [
          {
            t: 'File concepts',
            s: ['file attributes and operations', 'file types and access methods', 'directories'],
          },
          {
            t: 'File allocation methods',
            s: ['contiguous allocation', 'linked allocation', 'indexed allocation'],
          },
          {
            t: 'Disk scheduling and I/O',
            s: ['FCFS, SSTF and SCAN', 'disk structure', 'I/O hardware basics'],
          },
        ],
      },
    ],
  },
  {
    code: 'DBL401',
    name: 'DBMS Lab',
    branch: 'ICT',
    semester: 4,
    credits: 2,
    is_lab: 1,
    units: [],
  },
];
