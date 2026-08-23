module.exports = [
  {
    code: 'EDC301',
    name: 'Electronic Devices and Circuits',
    branch: 'EC',
    semester: 3,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Semiconductor Basics and Diode Theory',
        weightage: 20,
        topics: [
          {
            t: 'Intrinsic and extrinsic semiconductors',
            s: ['energy bands', 'doping and carrier concentration', 'drift and diffusion currents'],
          },
          {
            t: 'PN junction diode',
            s: ['junction formation', 'depletion region', 'barrier potential'],
          },
          {
            t: 'Diode characteristics and models',
            s: ['forward and reverse bias', 'VI characteristics', 'ideal and practical models'],
          },
          {
            t: 'Zener diode',
            s: ['breakdown mechanisms', 'zener characteristics', 'voltage regulation'],
          },
        ],
      },
      {
        n: 2,
        title: 'Diode Applications',
        weightage: 20,
        topics: [
          {
            t: 'Half wave and full wave rectifiers',
            s: ['circuit operation', 'ripple factor and efficiency', 'peak inverse voltage'],
          },
          {
            t: 'Bridge rectifier and filters',
            s: ['bridge circuit', 'capacitor and LC filters', 'dc and rms output'],
          },
          {
            t: 'Clippers and clampers',
            s: ['series and shunt clippers', 'biased clippers', 'positive and negative clampers'],
          },
          {
            t: 'Voltage regulators',
            s: [
              'zener regulator design',
              'line and load regulation',
              'series and shunt regulators',
            ],
          },
        ],
      },
      {
        n: 3,
        title: 'Bipolar Junction Transistor',
        weightage: 25,
        topics: [
          {
            t: 'BJT construction and operation',
            s: ['NPN and PNP structures', 'transistor action', 'current relations and alpha beta'],
          },
          {
            t: 'BJT characteristics',
            s: [
              'common base characteristics',
              'common emitter characteristics',
              'common collector characteristics',
            ],
          },
          {
            t: 'Transistor biasing',
            s: [
              'need for biasing',
              'fixed bias and collector feedback',
              'voltage divider bias and stability',
            ],
          },
          {
            t: 'Operating point and thermal stability',
            s: ['Q point selection', 'stability factor', 'thermal runaway'],
          },
        ],
      },
      {
        n: 4,
        title: 'BJT Amplifiers',
        weightage: 20,
        topics: [
          {
            t: 'Small signal analysis',
            s: ['h-parameter model', 'CE amplifier analysis', 'input and output impedance'],
          },
          {
            t: 'Amplifier characteristics',
            s: ['voltage gain and current gain', 'bandwidth and frequency response', 'distortion'],
          },
          {
            t: 'Multistage amplifiers',
            s: ['RC coupled amplifier', 'cascading and gain', 'advantages and disadvantages'],
          },
          {
            t: 'Feedback amplifiers',
            s: ['feedback concept', 'types of feedback', 'effect on gain and bandwidth'],
          },
        ],
      },
      {
        n: 5,
        title: 'Field Effect Transistors and Power Devices',
        weightage: 15,
        topics: [
          {
            t: 'JFET',
            s: ['construction and operation', 'drain characteristics', 'transconductance'],
          },
          {
            t: 'MOSFET',
            s: [
              'enhancement and depletion types',
              'transfer characteristics',
              'comparison with BJT',
            ],
          },
          {
            t: 'FET biasing and applications',
            s: ['self bias and voltage divider bias', 'FET as a switch', 'CMOS basics'],
          },
          {
            t: 'Power semiconductor devices',
            s: ['SCR and triac basics', 'IGBT and power MOSFET', 'applications'],
          },
        ],
      },
    ],
  },
  {
    code: 'CTN302',
    name: 'Circuit Theory and Networks',
    branch: 'EC',
    semester: 3,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Network Theorems',
        weightage: 25,
        topics: [
          {
            t: 'Network fundamentals',
            s: [
              'active and passive elements',
              'linear and non-linear networks',
              'source transformation',
            ],
          },
          {
            t: 'Superposition theorem',
            s: ['statement and procedure', 'application to multi source circuits', 'limitations'],
          },
          {
            t: 'Thevenin and Norton theorems',
            s: [
              'Thevenin equivalent circuit',
              'Norton equivalent circuit',
              'conversion between them',
            ],
          },
          {
            t: 'Maximum power transfer theorem',
            s: ['condition for maximum power', 'efficiency at maximum power', 'applications'],
          },
        ],
      },
      {
        n: 2,
        title: 'Transient Analysis',
        weightage: 20,
        topics: [
          {
            t: 'Transients in RL circuits',
            s: ['growth and decay of current', 'time constant', 'initial and final conditions'],
          },
          {
            t: 'Transients in RC circuits',
            s: ['charging and discharging', 'time constant', 'energy storage'],
          },
          {
            t: 'Transients in RLC circuits',
            s: ['over, under and critical damping', 'natural response', 'step response'],
          },
          {
            t: 'Laplace transform approach',
            s: [
              'circuit representation in s-domain',
              'impedance in s-domain',
              'solving transients',
            ],
          },
        ],
      },
      {
        n: 3,
        title: 'AC Circuit Analysis and Resonance',
        weightage: 20,
        topics: [
          {
            t: 'Sinusoidal steady state analysis',
            s: ['phasor representation', 'impedance and admittance', 'complex power'],
          },
          {
            t: 'Series resonance',
            s: ['resonant frequency', 'quality factor and bandwidth', 'voltage magnification'],
          },
          {
            t: 'Parallel resonance',
            s: ['resonant frequency', 'Q factor', 'comparison with series resonance'],
          },
          {
            t: 'Power in AC circuits',
            s: ['real, reactive and apparent power', 'power triangle', 'power factor improvement'],
          },
        ],
      },
      {
        n: 4,
        title: 'Network Topology and Filters',
        weightage: 15,
        topics: [
          {
            t: 'Graph theory of networks',
            s: ['nodes, branches and loops', 'tree and co-tree', 'cut sets and tie sets'],
          },
          {
            t: 'Mesh and nodal analysis revisited',
            s: ['formulation using matrices', 'solution techniques', 'dependent sources'],
          },
          {
            t: 'Basic filter circuits',
            s: [
              'low pass and high pass filters',
              'band pass and band stop filters',
              'cutoff frequency',
            ],
          },
        ],
      },
      {
        n: 5,
        title: 'Two Port Networks',
        weightage: 20,
        topics: [
          {
            t: 'Two port parameters',
            s: ['z parameters', 'y parameters', 'h and ABCD parameters'],
          },
          {
            t: 'Interconnection of two ports',
            s: ['series and parallel connection', 'cascade connection', 'parameter conversion'],
          },
          {
            t: 'Image impedance and characteristic impedance',
            s: ['definitions', 'ladder networks', 'matching'],
          },
        ],
      },
    ],
  },
  {
    code: 'DGE303',
    name: 'Digital Electronics',
    branch: 'EC',
    semester: 3,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Number Systems and Codes',
        weightage: 20,
        topics: [
          {
            t: 'Number systems',
            s: [
              'binary, octal and hexadecimal',
              'conversions between bases',
              'arithmetic operations',
            ],
          },
          {
            t: 'Complements',
            s: ['1s and 2s complement', '9s and 10s complement', 'subtraction using complements'],
          },
          { t: 'Binary codes', s: ['BCD and Excess-3 code', 'Gray code', 'ASCII code'] },
          {
            t: 'Error detection codes',
            s: ['parity bit', 'checksum basics', 'Hamming code basics'],
          },
        ],
      },
      {
        n: 2,
        title: 'Logic Gates and Boolean Algebra',
        weightage: 20,
        topics: [
          {
            t: 'Basic logic gates',
            s: ['AND, OR, NOT gates', 'NAND, NOR, XOR, XNOR gates', 'universal gates'],
          },
          {
            t: 'Boolean algebra theorems',
            s: ['laws and identities', 'De Morgan theorems', 'duality'],
          },
          {
            t: 'SOP and POS forms',
            s: ['minterms and maxterms', 'canonical forms', 'conversion between forms'],
          },
          {
            t: 'Karnaugh map minimization',
            s: ['2, 3 and 4 variable maps', 'grouping rules', "don't care conditions"],
          },
        ],
      },
      {
        n: 3,
        title: 'Combinational Logic Circuits',
        weightage: 25,
        topics: [
          {
            t: 'Adders and subtractors',
            s: [
              'half adder and full adder',
              'half subtractor and full subtractor',
              'parallel adder',
            ],
          },
          {
            t: 'Encoders and decoders',
            s: ['binary decoder', 'BCD to seven segment decoder', 'priority encoder'],
          },
          {
            t: 'Multiplexers and demultiplexers',
            s: ['2:1 and 4:1 MUX', 'MUX as universal logic', 'demultiplexer'],
          },
          {
            t: 'Parity generators and code converters',
            s: ['parity generator circuit', 'binary to Gray converter', 'BCD to Excess-3'],
          },
        ],
      },
      {
        n: 4,
        title: 'Sequential Logic Circuits',
        weightage: 25,
        topics: [
          {
            t: 'Flip flops',
            s: ['SR and JK flip flop', 'D and T flip flops', 'master slave flip flop'],
          },
          {
            t: 'Registers',
            s: ['shift registers', 'SISO, SIPO, PISO, PIPO', 'applications of shift registers'],
          },
          {
            t: 'Counters',
            s: ['asynchronous counters', 'synchronous counters', 'mod-N counter design'],
          },
          {
            t: 'Sequential circuit design',
            s: ['state diagrams', 'state tables', 'excitation tables'],
          },
        ],
      },
      {
        n: 5,
        title: 'Memories and Digital IC Families',
        weightage: 10,
        topics: [
          {
            t: 'Semiconductor memories',
            s: ['ROM and RAM', 'static and dynamic RAM', 'memory organization'],
          },
          { t: 'PLDs', s: ['PLA and PAL', 'programmable logic basics', 'applications'] },
          {
            t: 'Digital IC families',
            s: ['TTL and CMOS', 'logic levels and noise margin', 'fan out and propagation delay'],
          },
          {
            t: 'ADC and DAC basics',
            s: ['DAC using R-2R ladder', 'successive approximation ADC', 'resolution and accuracy'],
          },
        ],
      },
    ],
  },
  {
    code: 'EDL301',
    name: 'Electronic Devices and Circuits Lab',
    branch: 'EC',
    semester: 3,
    credits: 2,
    is_lab: 1,
    units: [],
  },
];
