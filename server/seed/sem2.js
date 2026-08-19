module.exports = [
  {
    code: 'MTH201', name: 'Mathematics-II', branch: 'COMMON', semester: 2, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Differential Equations', weightage: 25, topics: [
        { t: 'Formation and order of differential equations', s: ['order and degree', 'formation from family of curves', 'general and particular solutions'] },
        { t: 'First order and first degree equations', s: ['variables separable method', 'homogeneous equations', 'linear and Bernoulli equations'] },
        { t: 'Exact differential equations', s: ['condition of exactness', 'integrating factors', 'solution procedure'] },
        { t: 'Linear differential equations of second order', s: ['constant coefficient equations', 'complementary function', 'particular integral'] }
      ] },
      { n: 2, title: 'Laplace Transforms', weightage: 20, topics: [
        { t: 'Definition and standard transforms', s: ['definition of Laplace transform', 'transforms of standard functions', 'linearity property'] },
        { t: 'Properties of Laplace transform', s: ['first and second shifting theorems', 'transforms of derivatives and integrals', 'multiplication by t'] },
        { t: 'Inverse Laplace transform', s: ['partial fraction method', 'inverse of standard forms', 'convolution theorem'] },
        { t: 'Applications to differential equations', s: ['solving first order ODE', 'solving second order ODE', 'initial value problems'] }
      ] },
      { n: 3, title: 'Vector Calculus', weightage: 15, topics: [
        { t: 'Vectors and their differentiation', s: ['vector functions', 'velocity and acceleration', 'tangent vectors'] },
        { t: 'Gradient, divergence and curl', s: ['gradient of scalar field', 'divergence of vector field', 'curl and its physical meaning'] },
        { t: 'Line and surface integrals', s: ['line integrals', 'surface integrals', 'Green theorem statement'] }
      ] },
      { n: 4, title: 'Probability and Statistics', weightage: 20, topics: [
        { t: 'Measures of central tendency', s: ['mean, median and mode', 'grouped and ungrouped data', 'comparison of measures'] },
        { t: 'Measures of dispersion', s: ['range, variance and standard deviation', 'coefficient of variation', 'skewness basics'] },
        { t: 'Probability basics', s: ['sample space and events', 'addition and multiplication rules', 'conditional probability and Bayes theorem'] },
        { t: 'Probability distributions', s: ['binomial distribution', 'Poisson distribution', 'normal distribution'] }
      ] },
      { n: 5, title: 'Numerical Methods', weightage: 20, topics: [
        { t: 'Solution of algebraic equations', s: ['bisection method', 'Newton-Raphson method', 'regula falsi method'] },
        { t: 'Numerical integration', s: ['trapezoidal rule', 'Simpson 1/3 rule', 'error estimation'] },
        { t: 'Numerical solution of differential equations', s: ['Euler method', 'Runge-Kutta method of order 4', 'comparison of methods'] }
      ] }
    ]
  },
  {
    code: 'ELE201', name: 'Basic Electrical Engineering', branch: 'COMMON', semester: 2, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'DC Circuits', weightage: 25, topics: [
        { t: 'Ohm law and Kirchhoff laws', s: ['Ohm law and resistance', 'Kirchhoff voltage law', 'Kirchhoff current law'] },
        { t: 'Series and parallel circuits', s: ['series combination of resistors', 'parallel combination', 'voltage and current division'] },
        { t: 'Mesh and nodal analysis', s: ['mesh equations', 'nodal equations', 'superposition theorem'] },
        { t: 'Power and energy in DC circuits', s: ['electric power', 'heating effect', 'efficiency of electrical devices'] }
      ] },
      { n: 2, title: 'AC Fundamentals', weightage: 25, topics: [
        { t: 'Sinusoidal waveforms', s: ['amplitude, frequency and phase', 'angular velocity', 'period and frequency relation'] },
        { t: 'RMS and average values', s: ['average value of sinusoid', 'RMS value', 'form factor and peak factor'] },
        { t: 'R, L, C in AC circuits', s: ['purely resistive circuit', 'purely inductive circuit', 'purely capacitive circuit'] },
        { t: 'R-L-C series circuit and power factor', s: ['impedance triangle', 'power in AC circuits', 'power factor and correction'] }
      ] },
      { n: 3, title: 'Transformers', weightage: 20, topics: [
        { t: 'Working principle of transformer', s: ['mutual induction', 'core and windings', 'ideal transformer'] },
        { t: 'EMF equation and turns ratio', s: ['EMF equation of transformer', 'turns ratio and voltage ratio', 'current ratio'] },
        { t: 'Losses and efficiency', s: ['core losses', 'copper losses', 'efficiency and regulation'] }
      ] },
      { n: 4, title: 'Electrical Machines', weightage: 15, topics: [
        { t: 'DC machines basics', s: ['DC generator principle', 'DC motor principle', 'EMF and torque equations'] },
        { t: 'AC machines basics', s: ['three phase induction motor', 'rotating magnetic field', 'synchronous speed and slip'] },
        { t: 'Applications of machines', s: ['domestic and industrial applications', 'rating and selection', 'starting methods overview'] }
      ] },
      { n: 5, title: 'Wiring, Batteries and Safety', weightage: 15, topics: [
        { t: 'House wiring systems', s: ['wiring materials', 'switch, socket and fuse', 'wiring circuits and diagrams'] },
        { t: 'Earthing and protection', s: ['types of earthing', 'earth resistance', 'circuit breakers and MCB'] },
        { t: 'Batteries', s: ['primary and secondary cells', 'lead acid battery', 'charging and maintenance'] },
        { t: 'Electrical safety', s: ['electric shock and effects', 'first aid for shock', 'safety rules and precautions'] }
      ] }
    ]
  },
  {
    code: 'PRC201', name: 'Programming in C', branch: 'COMMON', semester: 2, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Introduction to C Programming', weightage: 15, topics: [
        { t: 'Algorithms and flowcharts', s: ['steps to solve problems', 'flowchart symbols', 'pseudocode'] },
        { t: 'Structure of a C program', s: ['header files and main function', 'preprocessor directives', 'compilation process'] },
        { t: 'Data types and operators', s: ['basic data types', 'arithmetic and relational operators', 'logical and bitwise operators'] },
        { t: 'Input and output statements', s: ['printf and scanf', 'format specifiers', 'escape sequences'] }
      ] },
      { n: 2, title: 'Control Structures', weightage: 20, topics: [
        { t: 'Decision making statements', s: ['if and if-else', 'nested if and else-if ladder', 'switch statement'] },
        { t: 'Looping statements', s: ['while loop', 'do-while loop', 'for loop'] },
        { t: 'Jump statements', s: ['break and continue', 'goto statement', 'nested loops'] }
      ] },
      { n: 3, title: 'Arrays and Strings', weightage: 20, topics: [
        { t: 'One dimensional arrays', s: ['declaration and initialization', 'array operations', 'searching and sorting basics'] },
        { t: 'Two dimensional arrays', s: ['declaration and initialization', 'matrix operations', 'row and column processing'] },
        { t: 'Strings', s: ['string declaration and functions', 'string input and output', 'string manipulation programs'] }
      ] },
      { n: 4, title: 'Functions', weightage: 20, topics: [
        { t: 'Function declaration and definition', s: ['function prototype', 'call by value', 'return values'] },
        { t: 'Recursion', s: ['recursive functions', 'factorial and Fibonacci', 'advantages and disadvantages'] },
        { t: 'Storage classes', s: ['auto and register', 'static and extern', 'scope of variables'] }
      ] },
      { n: 5, title: 'Pointers, Structures and Files', weightage: 25, topics: [
        { t: 'Pointers', s: ['pointer declaration', 'pointer arithmetic', 'pointers and arrays'] },
        { t: 'Structures and unions', s: ['structure declaration', 'array of structures', 'union basics'] },
        { t: 'File handling', s: ['file opening modes', 'reading and writing files', 'file error handling'] }
      ] }
    ]
  },
  { code: 'CPL201', name: 'C Programming Lab', branch: 'COMMON', semester: 2, credits: 2, is_lab: 1, units: [] }
];