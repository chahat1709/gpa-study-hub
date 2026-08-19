module.exports = [
  {
    code: 'PYT601', name: 'Python Programming', branch: 'ICT', semester: 6, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Python Basics', weightage: 20, topics: [
        { t: 'Introduction to Python', s: ['features and applications', 'installing and running Python', 'IDLE and REPL'] },
        { t: 'Variables and data types', s: ['numbers and strings', 'type conversion', 'constants'] },
        { t: 'Operators and expressions', s: ['arithmetic operators', 'comparison and logical operators', 'operator precedence'] },
        { t: 'Input and output', s: ['print and format', 'input function', 'string formatting'] }
      ] },
      { n: 2, title: 'Control Flow and Functions', weightage: 20, topics: [
        { t: 'Conditional statements', s: ['if statement', 'if-else and elif', 'nested conditionals'] },
        { t: 'Loops', s: ['while loop', 'for loop', 'break, continue and pass'] },
        { t: 'Functions', s: ['defining functions', 'arguments and return values', 'lambda functions'] },
        { t: 'Modules and packages', s: ['import statement', 'standard library modules', 'creating modules'] }
      ] },
      { n: 3, title: 'Data Structures in Python', weightage: 25, topics: [
        { t: 'Lists', s: ['list operations', 'list methods', 'list comprehension'] },
        { t: 'Tuples and sets', s: ['tuple basics', 'set operations', 'immutable vs mutable'] },
        { t: 'Dictionaries', s: ['dictionary operations', 'dictionary methods', 'dictionary comprehension'] },
        { t: 'File handling', s: ['opening and closing files', 'reading and writing files', 'with statement'] }
      ] },
      { n: 4, title: 'OOP and Exception Handling', weightage: 20, topics: [
        { t: 'Classes and objects', s: ['class definition', 'init method', 'instance methods'] },
        { t: 'Inheritance and polymorphism', s: ['inheritance basics', 'method overriding', 'polymorphism'] },
        { t: 'Exception handling', s: ['try and except', 'finally clause', 'raising exceptions'] }
      ] },
      { n: 5, title: 'Libraries and Applications', weightage: 15, topics: [
        { t: 'Standard libraries', s: ['math and random', 'datetime', 'os and sys'] },
        { t: 'Data processing', s: ['CSV file processing', 'JSON handling', 'regular expressions basics'] },
        { t: 'GUI basics', s: ['Tkinter widgets', 'event handling', 'simple applications'] },
        { t: 'Introduction to NumPy and matplotlib', s: ['NumPy arrays', 'basic plotting', 'data visualization'] }
      ] }
    ]
  },
  {
    code: 'CSF602', name: 'Cyber Security Fundamentals', branch: 'ICT', semester: 6, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Security Concepts', weightage: 20, topics: [
        { t: 'CIA triad', s: ['confidentiality', 'integrity', 'availability'] },
        { t: 'Threats and vulnerabilities', s: ['threat types', 'vulnerability sources', 'risk assessment'] },
        { t: 'Attack types', s: ['malware types', 'phishing and social engineering', 'DoS and DDoS'] },
        { t: 'Security policies', s: ['security policy types', 'access control models', 'security best practices'] }
      ] },
      { n: 2, title: 'Cryptography', weightage: 25, topics: [
        { t: 'Symmetric encryption', s: ['substitution and transposition', 'DES and AES basics', 'key management'] },
        { t: 'Asymmetric encryption', s: ['public key concept', 'RSA basics', 'Diffie-Hellman overview'] },
        { t: 'Hashing and digital signatures', s: ['hash functions', 'MD5 and SHA', 'digital signature and certificates'] },
        { t: 'PKI and HTTPS', s: ['certificate authorities', 'SSL/TLS handshake', 'HTTPS security'] }
      ] },
      { n: 3, title: 'Network Security', weightage: 20, topics: [
        { t: 'Firewalls', s: ['firewall types', 'packet filtering', 'application firewalls'] },
        { t: 'IDS and IPS', s: ['intrusion detection', 'intrusion prevention', 'honeypots'] },
        { t: 'VPN and remote access', s: ['VPN types', 'IPSec basics', 'tunneling protocols'] },
        { t: 'Wireless security', s: ['WEP, WPA and WPA2', 'wireless attacks', 'secure configuration'] }
      ] },
      { n: 4, title: 'Web and Application Security', weightage: 20, topics: [
        { t: 'OWASP top 10', s: ['injection', 'broken authentication', 'security misconfiguration'] },
        { t: 'SQL injection', s: ['SQLi types', 'prevention techniques', 'parameterized queries'] },
        { t: 'XSS and CSRF', s: ['stored and reflected XSS', 'cross site request forgery', 'defense mechanisms'] },
        { t: 'Session security', s: ['session hijacking', 'secure cookies', 'secure development practices'] }
      ] },
      { n: 5, title: 'Security Operations and Cyber Law', weightage: 15, topics: [
        { t: 'Password security', s: ['strong password policies', 'multi factor authentication', 'password managers'] },
        { t: 'Incident response', s: ['incident handling steps', 'forensics basics', 'backup and recovery'] },
        { t: 'Cyber law in India', s: ['IT Act basics', 'cyber crimes', 'data protection and privacy'] }
      ] }
    ]
  },
  {
    code: 'CLB603', name: 'Cloud Computing Basics', branch: 'ICT', semester: 6, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Cloud Fundamentals', weightage: 20, topics: [
        { t: 'Cloud computing definition', s: ['essential characteristics', 'history and evolution', 'benefits and challenges'] },
        { t: 'Service models', s: ['IaaS', 'PaaS', 'SaaS'] },
        { t: 'Deployment models', s: ['public cloud', 'private cloud', 'hybrid and community cloud'] },
        { t: 'NIST reference model', s: ['cloud actors', 'cloud architecture', 'service level agreements'] }
      ] },
      { n: 2, title: 'Virtualization', weightage: 20, topics: [
        { t: 'Virtualization concepts', s: ['hypervisor types', 'virtual machines', 'resource pooling'] },
        { t: 'Containers', s: ['container vs VM', 'Docker basics', 'container orchestration overview'] },
        { t: 'Virtualization in cloud', s: ['compute virtualization', 'storage virtualization', 'network virtualization'] }
      ] },
      { n: 3, title: 'Cloud Storage and Compute', weightage: 20, topics: [
        { t: 'Cloud storage types', s: ['object storage', 'block storage', 'file storage'] },
        { t: 'Cloud compute', s: ['virtual machine instances', 'serverless computing', 'auto scaling'] },
        { t: 'Load balancing', s: ['load balancer types', 'scaling strategies', 'high availability'] }
      ] },
      { n: 4, title: 'Cloud Networking and Services', weightage: 20, topics: [
        { t: 'Virtual networks', s: ['VPC basics', 'subnets and security groups', 'peering'] },
        { t: 'Content delivery', s: ['CDN basics', 'DNS in cloud', 'edge computing overview'] },
        { t: 'Cloud databases', s: ['managed databases', 'NoSQL in cloud', 'data warehousing basics'] },
        { t: 'Serverless and APIs', s: ['function as a service', 'API gateway', 'event driven architecture'] }
      ] },
      { n: 5, title: 'Cloud Platforms, Security and Migration', weightage: 20, topics: [
        { t: 'Major cloud platforms', s: ['AWS overview', 'Azure overview', 'Google Cloud overview'] },
        { t: 'Cloud pricing', s: ['pricing models', 'cost optimization', 'reserved instances'] },
        { t: 'Cloud security', s: ['shared responsibility model', 'IAM basics', 'cloud compliance'] },
        { t: 'Cloud migration', s: ['migration strategies', 'lift and shift', 'cloud adoption planning'] }
      ] }
    ]
  },
  { code: 'MJP602', name: 'Major Project', branch: 'ICT', semester: 6, credits: 4, is_lab: 1, units: [] }
];