module.exports = {
  DSU301: {
    1: {
      blurb: 'Data structures organize data for efficient operations, described as abstract data types with defined behaviour. Algorithm complexity measured in Big O decides scalability, and arrays plus dynamic memory provide the building blocks.'
    },
    2: {
      blurb: 'Linked lists store nodes connected by pointers, allowing dynamic insertion and deletion without shifting. Singly, doubly and circular lists trade memory and navigation for flexibility, and applications include polynomials and sparse matrices.'
    },
    3: {
      blurb: 'Stacks are LIFO structures used in expression conversion and evaluation, function calls and undo operations. Queues are FIFO structures with circular and priority variants used in scheduling, with deques combining both behaviours.'
    },
    4: {
      blurb: 'Trees are hierarchical structures with a root and children. Binary trees support recursive traversals, binary search trees keep keys ordered for fast search, and AVL trees plus heaps add balancing and priority ordering.',
      formulas: [
        'Height of full binary tree with n nodes ≥ log2(n+1)',
        'BST search: O(log n) average, O(n) worst'
      ]
    },
    5: {
      blurb: 'Sorting orders data: simple methods (bubble, insertion, selection) are easy but slow, while quick and merge sort are efficient at O(n log n). Searching uses linear or binary strategies, and hashing maps keys to slots with collision resolution.'
    }
  },
  COA302: {
    1: {
      blurb: 'A computer is built from input, memory, ALU, output and control units. The von Neumann architecture stores programs in memory with a fetch-decode-execute cycle, buses interconnect components, and performance is measured by clock rate, CPI and MIPS.'
    },
    2: {
      blurb: 'Instructions specify an operation and operands through formats with one to three addresses. Addressing modes like immediate, direct, indirect, register, indexed and relative locate operands flexibly, and RISC simplifies instructions while CISC packs complexity.'
    },
    3: {
      blurb: 'The CPU datapath connects registers and ALU through buses, and the control unit generates timing signals as hardwired or microprogrammed logic. Pipelining overlaps instruction stages for speedup, and interrupts let devices preempt the CPU.'
    },
    4: {
      blurb: 'Memory hierarchy exploits locality: fast small caches sit above slow large main memory. Cache mapping, replacement and write policies manage blocks, virtual memory pages processes beyond physical RAM with TLB acceleration, and DMA moves data without the CPU.'
    },
    5: {
      blurb: 'I/O organization connects devices through interfaces with ports and handshaking. Interrupt-driven I/O improves CPU utilization, DMA controllers transfer blocks directly, and standard buses like USB and PCI standardize device connections.'
    }
  },
  DBM401: {
    1: {
      blurb: 'A DBMS manages data centrally, avoiding the problems of file systems like redundancy and inconsistency. The three-level architecture gives physical and logical data independence, and DDL, DML, DCL and TCL languages support all database operations.'
    },
    2: {
      blurb: 'The relational model stores data in tables with keys ensuring uniqueness and relationships. ER diagrams model the real world with entities, attributes, relationships and cardinality, which are then mapped to relational schemas.'
    },
    3: {
      blurb: 'SQL is the standard database language: DDL creates and alters tables with constraints, DML inserts, updates, deletes and selects data, and joins, subqueries, views and indexes extract and accelerate data access.'
    },
    4: {
      blurb: 'Normalization removes redundancy through functional dependencies. First, second and third normal forms eliminate partial and transitive dependencies, BCNF strengthens 3NF, and denormalization trades storage for query speed.'
    },
    5: {
      blurb: 'Transactions group operations with ACID properties: atomicity, consistency, isolation and durability. Concurrency control with locking and two-phase locking prevents lost updates and dirty reads, deadlocks are handled, and logs and backups enable recovery.'
    }
  },
  CNW402: {
    1: {
      blurb: 'Networks connect computers for resource sharing and communication over LANs, MANs and WANs with different topologies and switching. The OSI model standardizes seven layers of functions, and TCP/IP is the practical internet protocol stack.'
    },
    2: {
      blurb: 'The physical layer carries bits over guided or unguided media. The data link layer frames data, detects errors with CRC, and controls flow with stop-and-wait or sliding-window protocols, while Ethernet and CSMA/CD govern LAN access.',
      formulas: [
        'CRC: remainder of polynomial division',
        'Utilization (stop-wait) = 1/(1 + 2a), a = Tp/Tt'
      ]
    },
    3: {
      blurb: 'The network layer routes packets across networks. IP addresses identify hosts with classes and subnetting, IPv6 expands the address space, routers run distance-vector or link-state algorithms, and ARP, ICMP, NAT and DHCP support operation.',
      formulas: [
        'Subnet: hosts = 2^h - 2',
        'IPv4: 32 bits, IPv6: 128 bits'
      ]
    },
    4: {
      blurb: 'The transport layer provides end-to-end delivery. UDP is fast and connectionless for real-time use, TCP is reliable with the three-way handshake, sequencing, flow control and congestion control, and ports and sockets demultiplex services.'
    },
    5: {
      blurb: 'Application protocols make the internet useful: DNS resolves names, HTTP transfers web pages, SMTP/POP3/IMAP handle email, FTP moves files, and utilities like ping, tracert and netstat diagnose networks.'
    }
  },
  OPS403: {
    1: {
      blurb: 'The operating system manages processes, memory, files and devices while providing security. Batch, time-sharing, real-time and distributed variants serve different needs, and system calls expose OS services to user programs.'
    },
    2: {
      blurb: 'Processes move through new, ready, running, waiting and terminated states tracked in the PCB. Threads share process resources for parallelism, and CPU scheduling with FCFS, SJF, priority and round-robin decides the running process.',
      formulas: [
        'Turnaround = completion - arrival',
        'Waiting = turnaround - burst',
        'RR quantum: process runs for q time units'
      ]
    },
    3: {
      blurb: 'Scheduling is evaluated by turnaround, waiting, response and throughput. Deadlocks need four conditions and are prevented, avoided with the banker\'s algorithm, or detected and recovered.'
    },
    4: {
      blurb: 'Memory management places processes in memory efficiently. Contiguous allocation and partitioning suffer fragmentation, paging uses fixed pages and page tables with TLB, segmentation uses variable segments, and virtual memory with page replacement allows over-commitment.',
      formulas: [
        'Page table size = pages × entry size',
        'Effective access = (1-p)×cache + p×(cache+memory)'
      ]
    },
    5: {
      blurb: 'Files are organized in directories with attributes and access methods. Allocation uses contiguous, linked or indexed schemes, and disk scheduling algorithms like FCFS, SSTF and SCAN minimize seek time.'
    }
  },
  WPP501: {
    1: {
      blurb: 'HTML structures web content with semantic elements, lists, tables and forms. CSS styles it with selectors, the box model and positioning, and flexbox, grid and media queries create responsive layouts.'
    },
    2: {
      blurb: 'JavaScript makes pages dynamic. Variables, functions, objects and arrays form the language core, the DOM allows selecting and changing elements with events, and ES6 features plus fetch enable modern interactive sites.'
    },
    3: {
      blurb: 'Server-side scripting with PHP processes forms, manages sessions and cookies, and connects to MySQL with prepared statements for secure CRUD operations.'
    },
    4: {
      blurb: 'Modern web apps use RESTful APIs exchanging JSON over HTTP. AJAX and fetch update pages without reloading, and frameworks like Node.js and component-based frontends structure scalable applications.'
    },
    5: {
      blurb: 'Web security defends against SQL injection, XSS and session attacks, with HTTPS and password hashing protecting data. Deployment moves sites to hosting with domains, DNS and maintenance procedures.'
    }
  },
  SEW502: {
    1: {
      blurb: 'Software engineering applies disciplined processes to build quality software. Waterfall, iterative and spiral models structure development, while agile methods like Scrum and XP adapt to change with short iterations.'
    },
    2: {
      blurb: 'Requirements engineering gathers functional and non-functional needs through interviews, surveys and prototyping, producing a validated SRS document that guides design and testing.'
    },
    3: {
      blurb: 'Design translates requirements into structure with modularity, cohesion and low coupling. Architectural styles like layered and client-server organize the system, and UML diagrams — use case, class, sequence, activity and state — document it.'
    },
    4: {
      blurb: 'Testing verifies that software meets requirements. Black-box techniques use equivalence partitioning and boundary values, white-box techniques cover statements and paths, and test cases track the defect lifecycle to completion.'
    },
    5: {
      blurb: 'Project management estimates size with LOC or function points, schedules with Gantt charts and CPM, and manages risk. Maintenance keeps software alive with corrective, adaptive, perfective and preventive changes.'
    }
  },
  CHN503: {
    1: {
      blurb: 'PC hardware starts with the motherboard, chipset and slots hosting the processor, RAM and storage. BIOS/UEFI boot the system and configure devices, and HDDs, SSDs and optical drives store data.'
    },
    2: {
      blurb: 'Peripherals include input devices like keyboards and scanners, output devices like monitors and printers, and expansion cards for graphics, sound and networking, all needing correct drivers.'
    },
    3: {
      blurb: 'Networking hardware connects computers: NICs attach to the network, hubs and switches share segments, routers connect networks, and twisted-pair or fiber cabling with RJ45 connectors is crimped for LANs, with Wi-Fi adding wireless access.'
    },
    4: {
      blurb: 'Installing Windows or Linux involves partitioning, drivers and updates. Troubleshooting diagnoses POST errors, memory and disk faults, and hardware failures systematically.'
    },
    5: {
      blurb: 'Network configuration sets static or DHCP IP addresses, DNS and proxy settings. File and printer sharing works over workgroups, and ping, ipconfig and tracert diagnose connectivity faults.'
    }
  },
  PYT601: {
    1: {
      blurb: 'Python is an interpreted, readable language. Variables, numbers, strings and operators form the basics, with print, input and formatting handling input-output in the REPL or scripts.'
    },
    2: {
      blurb: 'Control flow uses if-elif-else and while/for loops with break, continue and pass. Functions with parameters, return values and lambdas structure code, and modules and packages reuse libraries.'
    },
    3: {
      blurb: 'Python data structures — lists, tuples, sets and dictionaries — store and organize data with comprehensions for concise construction. File handling with the with statement reads and writes persistent data.'
    },
    4: {
      blurb: 'Object-oriented programming defines classes with attributes and methods, supporting inheritance and polymorphism. Exception handling with try-except-finally makes programs robust.'
    },
    5: {
      blurb: 'The standard library provides math, random, datetime, os and sys modules, while CSV, JSON and regex handle data processing. Tkinter builds GUIs, and NumPy plus matplotlib perform numerical computation and plotting.'
    }
  },
  CSF602: {
    1: {
      blurb: 'Security protects the CIA triad — confidentiality, integrity and availability. Threats exploit vulnerabilities, malware, phishing and DoS attacks target systems, and policies with access control mitigate risk.'
    },
    2: {
      blurb: 'Cryptography secures data: symmetric encryption like AES is fast, asymmetric encryption like RSA uses key pairs, and hashes with SHA ensure integrity. Digital signatures, certificates and HTTPS authenticate and protect communication.'
    },
    3: {
      blurb: 'Network security deploys firewalls to filter traffic, IDS/IPS to detect and prevent intrusions, and VPNs to secure remote access with IPSec. WPA2 protects wireless networks from attacks.'
    },
    4: {
      blurb: 'Web applications face the OWASP top 10: SQL injection is prevented with parameterized queries, XSS by output encoding, CSRF by tokens, and session security by secure cookies and strong authentication.'
    },
    5: {
      blurb: 'Security operations enforce strong passwords and multi-factor authentication, respond to incidents with forensics and backups, and follow cyber laws like India\'s IT Act for data protection and privacy.'
    }
  },
  CLB603: {
    1: {
      blurb: 'Cloud computing delivers computing as a service with on-demand self-service, broad access, resource pooling and measured billing. IaaS, PaaS and SaaS offer increasing abstraction, and public, private and hybrid deployments suit different needs.'
    },
    2: {
      blurb: 'Virtualization abstracts hardware: hypervisors run multiple VMs on one server, and containers share the host kernel for lightweight isolation. Docker packages applications with dependencies for portability.'
    },
    3: {
      blurb: 'Cloud storage includes object, block and file storage, while compute ranges from VM instances to serverless functions. Load balancers distribute traffic and auto-scaling matches capacity to demand.'
    },
    4: {
      blurb: 'Cloud networking builds virtual networks with VPCs, subnets and security groups. CDNs and edge computing accelerate content, managed databases and NoSQL scale data, and serverless with API gateways enables event-driven applications.'
    },
    5: {
      blurb: 'AWS, Azure and Google Cloud lead the market with pay-as-you-go pricing and reserved instances for savings. The shared responsibility model splits security between provider and customer, and migration strategies move workloads to the cloud.'
    }
  }
};