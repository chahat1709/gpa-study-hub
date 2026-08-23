module.exports = [
  {
    code: 'MTH101',
    name: 'Mathematics-I',
    branch: 'COMMON',
    semester: 1,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Matrices and Determinants',
        weightage: 20,
        topics: [
          {
            t: 'Types of matrices and equality of matrices',
            s: [
              'row and column matrices',
              'square and diagonal matrices',
              'scalar and identity matrices',
            ],
          },
          {
            t: 'Determinant of a matrix and its properties',
            s: [
              'expansion of determinants',
              'minors and cofactors',
              'evaluation of 3x3 determinants',
            ],
          },
          {
            t: 'Inverse of a matrix using adjoint method',
            s: [
              'adjoint of a matrix',
              'condition for invertibility',
              'solution of linear equations',
            ],
          },
          {
            t: 'Rank of a matrix and Cramer rule',
            s: [
              'rank by elementary operations',
              'Cramer rule for 2x2 and 3x3 systems',
              'consistency of equations',
            ],
          },
          {
            t: 'Eigen values and eigen vectors',
            s: [
              'characteristic equation',
              'eigen values of 2x2 and 3x3 matrices',
              'properties of eigen values',
            ],
          },
        ],
      },
      {
        n: 2,
        title: 'Trigonometry',
        weightage: 15,
        topics: [
          {
            t: 'Angles, radian measure and allied angles',
            s: ['degree and radian conversion', 'trigonometric ratios', 'allied angle formulas'],
          },
          {
            t: 'Compound and multiple angle formulas',
            s: ['sin(A+B) and cos(A+B)', 'double and triple angles', 'factorization formulas'],
          },
          {
            t: 'Inverse trigonometric functions',
            s: ['principal values', 'basic identities', 'simple equations'],
          },
          {
            t: 'Properties of triangles',
            s: ['sine rule and cosine rule', 'area of a triangle', 'solution of triangles'],
          },
        ],
      },
      {
        n: 3,
        title: 'Limits and Continuity',
        weightage: 15,
        topics: [
          {
            t: 'Concept of limit and standard limits',
            s: [
              'left and right hand limits',
              'standard limits with sin x and e',
              'indeterminate forms',
            ],
          },
          {
            t: 'Continuity of a function',
            s: [
              'definition of continuity',
              'continuity at a point',
              'continuity of common functions',
            ],
          },
          {
            t: 'Differentiability',
            s: [
              'derivative as a limit',
              'continuity and differentiability',
              'rules of differentiation',
            ],
          },
        ],
      },
      {
        n: 4,
        title: 'Differentiation and its Applications',
        weightage: 25,
        topics: [
          {
            t: 'Rules of differentiation',
            s: [
              'product rule and quotient rule',
              'chain rule',
              'derivatives of standard functions',
            ],
          },
          {
            t: 'Implicit and parametric differentiation',
            s: ['implicit functions', 'parametric forms', 'logarithmic differentiation'],
          },
          {
            t: 'Higher order derivatives',
            s: ['second order derivatives', 'successive differentiation', 'maxima and minima'],
          },
          {
            t: 'Tangent, normal, maxima and minima',
            s: [
              'equation of tangent and normal',
              'increasing and decreasing functions',
              'maxima and minima of functions',
            ],
          },
        ],
      },
      {
        n: 5,
        title: 'Integral Calculus',
        weightage: 25,
        topics: [
          {
            t: 'Methods of integration',
            s: ['substitution method', 'integration by parts', 'integration of rational functions'],
          },
          {
            t: 'Definite integrals',
            s: [
              'fundamental theorem of calculus',
              'properties of definite integrals',
              'evaluation of definite integrals',
            ],
          },
          {
            t: 'Applications of integration',
            s: ['area under a curve', 'mean value of a function', 'length of a curve'],
          },
        ],
      },
    ],
  },
  {
    code: 'PHY101',
    name: 'Applied Physics-I',
    branch: 'COMMON',
    semester: 1,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Units, Vectors and Motion',
        weightage: 20,
        topics: [
          {
            t: 'SI units and dimensional analysis',
            s: [
              'fundamental and derived units',
              'dimensional formula',
              'applications of dimensional analysis',
            ],
          },
          {
            t: 'Scalars and vectors',
            s: [
              'addition and subtraction of vectors',
              'resolution of vectors',
              'unit vectors and dot product',
            ],
          },
          {
            t: 'Motion in one dimension',
            s: ['equations of motion', 'velocity and acceleration', 'graphs of motion'],
          },
          {
            t: 'Projectile motion',
            s: ['trajectory of a projectile', 'time of flight and range', 'maximum height'],
          },
        ],
      },
      {
        n: 2,
        title: 'Forces, Work, Energy and Power',
        weightage: 20,
        topics: [
          {
            t: 'Newton laws of motion',
            s: ['first, second and third laws', 'linear momentum', 'impulse'],
          },
          {
            t: 'Friction',
            s: ['static and kinetic friction', 'laws of friction', 'angle of repose'],
          },
          {
            t: 'Work and energy',
            s: ['work done by a force', 'kinetic and potential energy', 'work energy theorem'],
          },
          {
            t: 'Power and conservation of energy',
            s: ['power and its units', 'conservation of mechanical energy', 'collision basics'],
          },
        ],
      },
      {
        n: 3,
        title: 'Properties of Matter',
        weightage: 20,
        topics: [
          {
            t: 'Elasticity and Hooke law',
            s: ['stress and strain', 'moduli of elasticity', 'stress strain curve'],
          },
          {
            t: 'Surface tension',
            s: ['molecular theory', 'surface energy', 'capillary rise and drops'],
          },
          {
            t: 'Viscosity',
            s: [
              'viscous force and coefficient of viscosity',
              'Poiseuille formula',
              'Stokes law and terminal velocity',
            ],
          },
        ],
      },
      {
        n: 4,
        title: 'Heat and Thermodynamics',
        weightage: 20,
        topics: [
          {
            t: 'Temperature and thermal expansion',
            s: ['temperature scales', 'linear, area and volume expansion', 'coefficient relations'],
          },
          {
            t: 'Heat transfer',
            s: [
              'conduction, convection and radiation',
              'thermal conductivity',
              'Newton law of cooling',
            ],
          },
          {
            t: 'Gas laws and kinetic theory',
            s: [
              'Boyle and Charles laws',
              'ideal gas equation',
              'kinetic interpretation of temperature',
            ],
          },
          {
            t: 'Laws of thermodynamics',
            s: ['first law and internal energy', 'second law and entropy', 'heat engines'],
          },
        ],
      },
      {
        n: 5,
        title: 'Wave Motion and Sound',
        weightage: 20,
        topics: [
          {
            t: 'Simple harmonic motion',
            s: ['displacement, velocity and acceleration', 'energy in SHM', 'simple pendulum'],
          },
          {
            t: 'Progressive waves',
            s: [
              'wave equation',
              'transverse and longitudinal waves',
              'velocity, frequency and wavelength',
            ],
          },
          {
            t: 'Sound characteristics and Doppler effect',
            s: ['pitch, loudness and quality', 'intensity of sound', 'Doppler effect in sound'],
          },
        ],
      },
    ],
  },
  {
    code: 'ENG101',
    name: 'Communication Skills in English',
    branch: 'COMMON',
    semester: 1,
    credits: 3,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Basics of Communication',
        weightage: 20,
        topics: [
          {
            t: 'Process of communication',
            s: ['sender, message and receiver', 'encoding and decoding', 'feedback loop'],
          },
          {
            t: 'Types of communication',
            s: ['verbal and non-verbal', 'formal and informal', 'one-way and two-way'],
          },
          {
            t: 'Barriers to communication',
            s: ['physical barriers', 'psychological barriers', 'linguistic barriers'],
          },
          {
            t: 'Seven Cs of effective communication',
            s: ['clear, concise, concrete', 'correct, coherent, complete, courteous'],
          },
        ],
      },
      {
        n: 2,
        title: 'Grammar and Vocabulary',
        weightage: 25,
        topics: [
          {
            t: 'Parts of speech and sentence structure',
            s: ['nouns, verbs, adjectives', 'subject-verb agreement', 'types of sentences'],
          },
          {
            t: 'Tenses',
            s: ['present, past and future tenses', 'perfect and continuous forms', 'common errors'],
          },
          {
            t: 'Articles, prepositions and conjunctions',
            s: ['use of a, an, the', 'common prepositions', 'joining clauses'],
          },
          {
            t: 'Vocabulary building',
            s: ['word roots and affixes', 'synonyms and antonyms', 'one word substitution'],
          },
        ],
      },
      {
        n: 3,
        title: 'Reading Comprehension',
        weightage: 15,
        topics: [
          {
            t: 'Skimming and scanning',
            s: [
              'quick reading techniques',
              'locating specific information',
              'identifying main idea',
            ],
          },
          {
            t: 'Comprehension passages',
            s: ['answering factual questions', 'inference questions', 'vocabulary in context'],
          },
          {
            t: 'Precis and note making',
            s: ['summarizing passages', 'note taking formats', 'headings and subheadings'],
          },
        ],
      },
      {
        n: 4,
        title: 'Written Communication',
        weightage: 20,
        topics: [
          {
            t: 'Business letters and email',
            s: ['letter format and parts', 'types of business letters', 'email etiquette'],
          },
          {
            t: 'Reports and notices',
            s: ['structure of a report', 'types of reports', 'notice and circular format'],
          },
          {
            t: 'Minutes of meeting and memo',
            s: ['recording decisions', 'memo format', 'action points'],
          },
        ],
      },
      {
        n: 5,
        title: 'Oral Communication',
        weightage: 20,
        topics: [
          {
            t: 'Listening skills',
            s: ['types of listening', 'active listening', 'overcoming listening barriers'],
          },
          {
            t: 'Presentations and public speaking',
            s: ['planning a presentation', 'body language and voice', 'handling questions'],
          },
          {
            t: 'Group discussion and interviews',
            s: ['GD techniques', "GD dos and don'ts", 'interview preparation and etiquette'],
          },
        ],
      },
    ],
  },
  {
    code: 'EWP101',
    name: 'Electronics Workshop Practice',
    branch: 'COMMON',
    semester: 1,
    credits: 2,
    is_lab: 1,
    units: [],
  },
];
