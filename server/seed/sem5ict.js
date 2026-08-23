module.exports = [
  {
    code: 'WPP501',
    name: 'Web Programming',
    branch: 'ICT',
    semester: 5,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'HTML and CSS',
        weightage: 20,
        topics: [
          {
            t: 'HTML basics',
            s: ['document structure', 'headings, lists and links', 'tables and forms'],
          },
          {
            t: 'HTML5 semantic elements',
            s: ['header, nav and section', 'audio and video', 'form validation attributes'],
          },
          { t: 'CSS fundamentals', s: ['selectors and properties', 'box model', 'positioning'] },
          {
            t: 'CSS layout techniques',
            s: ['flexbox basics', 'grid basics', 'responsive design with media queries'],
          },
        ],
      },
      {
        n: 2,
        title: 'JavaScript',
        weightage: 25,
        topics: [
          {
            t: 'JavaScript basics',
            s: ['variables and data types', 'operators and expressions', 'control structures'],
          },
          {
            t: 'Functions and objects',
            s: [
              'function declaration and arrow functions',
              'objects and arrays',
              'string and array methods',
            ],
          },
          {
            t: 'DOM manipulation',
            s: ['selecting elements', 'event handling', 'changing content and styles'],
          },
          {
            t: 'Form validation and ES6',
            s: [
              'client side validation',
              'let, const and template literals',
              'promises and fetch basics',
            ],
          },
        ],
      },
      {
        n: 3,
        title: 'Server Side Scripting',
        weightage: 25,
        topics: [
          {
            t: 'PHP basics',
            s: ['PHP syntax', 'variables and superglobals', 'arrays and functions'],
          },
          {
            t: 'Form handling with PHP',
            s: ['GET and POST methods', 'form data processing', 'input validation'],
          },
          {
            t: 'Sessions and cookies',
            s: ['session management', 'cookie handling', 'login and logout'],
          },
          {
            t: 'PHP with MySQL',
            s: ['database connection', 'CRUD operations', 'prepared statements'],
          },
        ],
      },
      {
        n: 4,
        title: 'Web APIs and Frameworks',
        weightage: 15,
        topics: [
          { t: 'RESTful APIs', s: ['HTTP methods', 'JSON data format', 'API endpoints'] },
          {
            t: 'AJAX and fetch',
            s: ['XMLHttpRequest basics', 'fetch API', 'updating UI dynamically'],
          },
          {
            t: 'Introduction to frameworks',
            s: ['frontend frameworks overview', 'Node.js basics', 'component concept'],
          },
        ],
      },
      {
        n: 5,
        title: 'Web Security and Deployment',
        weightage: 15,
        topics: [
          {
            t: 'Web security basics',
            s: ['common vulnerabilities', 'SQL injection prevention', 'XSS protection'],
          },
          {
            t: 'HTTPS and data protection',
            s: ['SSL/TLS basics', 'password hashing', 'secure sessions'],
          },
          {
            t: 'Deployment',
            s: ['web hosting options', 'domain and DNS', 'site deployment steps'],
          },
        ],
      },
    ],
  },
  {
    code: 'SEW502',
    name: 'Software Engineering',
    branch: 'ICT',
    semester: 5,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Software Process Models',
        weightage: 20,
        topics: [
          {
            t: 'Software engineering fundamentals',
            s: ['software characteristics', 'software crisis', 'software process'],
          },
          { t: 'Classical models', s: ['waterfall model', 'iterative model', 'spiral model'] },
          {
            t: 'Agile development',
            s: ['agile manifesto', 'scrum framework', 'extreme programming'],
          },
        ],
      },
      {
        n: 2,
        title: 'Requirements Engineering',
        weightage: 20,
        topics: [
          {
            t: 'Requirements types',
            s: ['functional requirements', 'non functional requirements', 'requirement attributes'],
          },
          {
            t: 'Requirements elicitation',
            s: ['interviews and surveys', 'observation and prototyping', 'requirement sources'],
          },
          {
            t: 'SRS document',
            s: ['SRS structure', 'requirement specification', 'requirement validation'],
          },
        ],
      },
      {
        n: 3,
        title: 'Software Design',
        weightage: 25,
        topics: [
          {
            t: 'Design principles',
            s: ['modularity and cohesion', 'coupling', 'abstraction and encapsulation'],
          },
          {
            t: 'Architectural design',
            s: ['architecture styles', 'layered architecture', 'client server architecture'],
          },
          {
            t: 'UML diagrams',
            s: ['use case diagram', 'class and sequence diagrams', 'activity and state diagrams'],
          },
          {
            t: 'Database and interface design',
            s: ['ER design in software', 'user interface principles', 'prototyping'],
          },
        ],
      },
      {
        n: 4,
        title: 'Software Testing',
        weightage: 20,
        topics: [
          {
            t: 'Testing fundamentals',
            s: ['verification and validation', 'test levels', 'test plan'],
          },
          {
            t: 'Black box testing',
            s: ['equivalence partitioning', 'boundary value analysis', 'decision table testing'],
          },
          { t: 'White box testing', s: ['statement coverage', 'branch coverage', 'path testing'] },
          {
            t: 'Test case design and defects',
            s: ['test case format', 'defect lifecycle', 'test reporting'],
          },
        ],
      },
      {
        n: 5,
        title: 'Project Management and Maintenance',
        weightage: 15,
        topics: [
          {
            t: 'Software estimation',
            s: ['LOC and function points', 'COCOMO model', 'estimation accuracy'],
          },
          {
            t: 'Project scheduling and risk',
            s: ['Gantt charts', 'critical path method', 'risk management'],
          },
          {
            t: 'Software maintenance',
            s: ['maintenance types', 'software reengineering', 'configuration management'],
          },
        ],
      },
    ],
  },
  {
    code: 'CHN503',
    name: 'Computer Hardware and Networking',
    branch: 'ICT',
    semester: 5,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'PC Components',
        weightage: 20,
        topics: [
          { t: 'Motherboard', s: ['form factors', 'chipset and slots', 'connectors and ports'] },
          {
            t: 'Processor and memory',
            s: ['CPU architecture basics', 'RAM types and speeds', 'cache and registers'],
          },
          { t: 'Storage devices', s: ['HDD and SSD', 'optical storage', 'RAID basics'] },
          { t: 'BIOS and UEFI', s: ['boot process', 'BIOS settings', 'UEFI features'] },
        ],
      },
      {
        n: 2,
        title: 'Peripheral Devices',
        weightage: 15,
        topics: [
          {
            t: 'Input devices',
            s: ['keyboard and mouse', 'scanner and webcam', 'input device interfaces'],
          },
          {
            t: 'Output devices',
            s: ['display technologies', 'printers and types', 'audio devices'],
          },
          {
            t: 'Expansion cards',
            s: ['graphics card', 'sound and network cards', 'driver installation'],
          },
        ],
      },
      {
        n: 3,
        title: 'Networking Hardware',
        weightage: 25,
        topics: [
          {
            t: 'Network devices',
            s: ['NIC and hub', 'switch and router', 'modem and access point'],
          },
          {
            t: 'Cabling and connectors',
            s: ['twisted pair cable', 'fiber optic cable', 'RJ45 and crimping'],
          },
          {
            t: 'Wireless networking',
            s: ['Wi-Fi standards', 'access point configuration', 'wireless security'],
          },
          {
            t: 'Network topologies and LAN setup',
            s: ['star and bus topology', 'LAN design', 'structured cabling'],
          },
        ],
      },
      {
        n: 4,
        title: 'OS Installation and Troubleshooting',
        weightage: 20,
        topics: [
          {
            t: 'OS installation',
            s: ['partitioning', 'Windows installation', 'Linux installation'],
          },
          {
            t: 'Drivers and updates',
            s: ['device drivers', 'system updates', 'driver troubleshooting'],
          },
          {
            t: 'Hardware troubleshooting',
            s: ['POST errors', 'memory and disk faults', 'common hardware failures'],
          },
        ],
      },
      {
        n: 5,
        title: 'Network Configuration and Troubleshooting',
        weightage: 20,
        topics: [
          { t: 'IP configuration', s: ['static IP setup', 'DHCP configuration', 'DNS settings'] },
          {
            t: 'File and printer sharing',
            s: ['workgroup setup', 'shared folders', 'network printer'],
          },
          {
            t: 'Network troubleshooting',
            s: ['ping and tracert', 'ipconfig commands', 'common network faults'],
          },
          {
            t: 'Internet sharing',
            s: ['proxy settings', 'port forwarding', 'bandwidth management'],
          },
        ],
      },
    ],
  },
  {
    code: 'WPL501',
    name: 'Web Programming Lab',
    branch: 'ICT',
    semester: 5,
    credits: 2,
    is_lab: 1,
    units: [],
  },
];
