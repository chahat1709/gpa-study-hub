module.exports = {
  MTH101: {
    1: {
      blurb:
        'Matrices are rectangular arrays of numbers used to represent systems of linear equations compactly. The determinant, inverse (via adjoint) and rank of a matrix decide whether a system has a unique, infinite or no solution. Eigen values and eigen vectors appear in circuits, vibrations and signal processing.',
      formulas: [
        '|A| for 2x2: ad - bc',
        'Inverse: A^-1 = adj(A) / |A| (only if |A| != 0)',
        'Cramer rule: x = |A1| / |A|, y = |A2| / |A|',
        'Characteristic equation: |A - λI| = 0',
      ],
    },
    2: {
      blurb:
        'Trigonometry connects angles of triangles with their side ratios. Compound-angle formulas expand sin(A+B) and related functions, while factorization formulas convert sums of sines/cosines into products, which simplifies many engineering expressions.',
      formulas: [
        'sin(A+B) = sinA cosB + cosA sinB',
        'cos(A+B) = cosA cosB - sinA sinB',
        'sin2A = 2 sinA cosA',
        'Sine rule: a/sinA = b/sinB = c/sinC',
        'Cosine rule: a^2 = b^2 + c^2 - 2bc cosA',
      ],
    },
    3: {
      blurb:
        'Limits describe the behaviour of a function as its input approaches a value, forming the foundation of calculus. A function is continuous when its limit equals its value, and differentiable when its derivative exists at every point of its domain.',
      formulas: ['lim(x->0) sinx/x = 1', 'lim(x->0) (e^x - 1)/x = 1', 'lim(x->0) (1+x)^(1/x) = e'],
    },
    4: {
      blurb:
        'Differentiation measures the rate of change of a function. Rules like the product, quotient and chain rules let us differentiate almost any combination of standard functions, and the derivative is used to find tangents, normals, maxima and minima.',
      formulas: [
        'd/dx(x^n) = n x^(n-1)',
        'd/dx(sinx) = cosx, d/dx(cosx) = -sinx',
        'd/dx(e^x) = e^x, d/dx(lnx) = 1/x',
        "Product rule: (uv)' = u'v + uv'",
        'Chain rule: dy/dx = dy/du * du/dx',
      ],
    },
    5: {
      blurb:
        'Integration is the reverse of differentiation and is used to compute areas, volumes and mean values. Substitution, integration by parts and partial fractions handle most standard integrals, and the fundamental theorem links definite integrals to antiderivatives.',
      formulas: [
        '∫x^n dx = x^(n+1)/(n+1) + C',
        '∫sinx dx = -cosx + C, ∫cosx dx = sinx + C',
        'Integration by parts: ∫u dv = uv - ∫v du',
        'Area = ∫a^b y dx',
      ],
    },
  },
  PHY101: {
    1: {
      blurb:
        'Every physical quantity is expressed in SI units with a dimensional formula. Vectors combine direction with magnitude, and equations of motion describe bodies moving with constant acceleration, including projectiles whose path is a parabola.',
      formulas: [
        'v = u + at',
        's = ut + (1/2)at^2',
        'v^2 = u^2 + 2as',
        'Range R = u^2 sin2θ / g',
        'Max height H = u^2 sin^2θ / 2g',
        'Time of flight T = 2u sinθ / g',
      ],
    },
    2: {
      blurb:
        'Newtons laws relate force to acceleration and momentum. Work is the product of force and displacement along the force, and the work-energy theorem connects work done to the change in kinetic energy. Power is the rate of doing work.',
      formulas: [
        'F = ma',
        'Momentum p = mv',
        'Work W = F s cosθ',
        'KE = (1/2)mv^2',
        'PE = mgh',
        'Power P = W/t = Fv',
      ],
    },
    3: {
      blurb:
        'Elasticity describes how materials deform under stress and return to shape. Surface tension acts on liquid surfaces like a stretched film, and viscosity is the internal friction of fluids that opposes relative motion between layers.',
      formulas: [
        'Stress = F/A, Strain = ΔL/L',
        'Hooke law: Stress = Y × Strain',
        'Surface tension T = F/L',
        'Capillary rise h = 2T cosθ / (rρg)',
        'Stokes law: F = 6πηrv',
        'Terminal velocity v_t = 2r^2(ρ-σ)g / 9η',
      ],
    },
    4: {
      blurb:
        'Heat is energy in transit due to temperature difference. Solids expand on heating with linear, areal and volume coefficients, heat transfers by conduction, convection and radiation, and the laws of thermodynamics govern energy conversion in heat engines.',
      formulas: [
        'ΔL = L0 α ΔT, ΔA = A0 β ΔT, ΔV = V0 γ ΔT',
        'α : β : γ = 1 : 2 : 3',
        'Ideal gas: PV = nRT',
        'First law: ΔQ = ΔU + ΔW',
        'Efficiency η = 1 - T2/T1 (Carnot)',
      ],
    },
    5: {
      blurb:
        'Simple harmonic motion is the to-and-fro motion where acceleration is proportional to displacement. Progressive waves carry energy through a medium, and sound is characterized by pitch, loudness and quality, with its frequency shifting under the Doppler effect.',
      formulas: [
        'SHM: x = A sin(ωt + φ), ω = 2πf',
        'v = f λ',
        'Simple pendulum: T = 2π√(L/g)',
        'Intensity I = P/A',
        "Doppler shift f' = f (v ± vo)/(v ∓ vs)",
      ],
    },
  },
  ENG101: {
    1: {
      blurb:
        'Communication is the exchange of information between a sender and a receiver through a channel, with feedback completing the loop. Effective communication follows the Seven Cs and works around physical, psychological and linguistic barriers.',
    },
    2: {
      blurb:
        'Correct grammar and a strong vocabulary are the backbone of clear writing. Sentence structure, tenses, articles and prepositions must be used accurately, while word roots, synonyms and one-word substitutions expand expression.',
    },
    3: {
      blurb:
        'Reading comprehension requires skimming for the main idea and scanning for specific facts. Précis writing and note making condense passages into crisp summaries while preserving the essential meaning.',
    },
    4: {
      blurb:
        'Written communication includes business letters, emails, reports, notices, memos and minutes of meetings. Each format has a standard structure that makes the message clear, professional and easy to act upon.',
    },
    5: {
      blurb:
        'Oral communication covers listening, presentations, group discussions and interviews. Active listening and confident, well-structured speaking with appropriate body language are key to professional success.',
    },
  },
  MTH201: {
    1: {
      blurb:
        'A differential equation relates a function to its derivatives and arises in circuits, mechanics and growth models. First-order equations are solved by separation of variables, homogeneous substitutions or integrating factors, while second-order linear equations use complementary functions and particular integrals.',
      formulas: [
        'Separable: ∫g(y)dy = ∫f(x)dx',
        'Linear: dy/dx + Py = Q, IF = e^∫P dx',
        'Bernoulli: dy/dx + Py = Q y^n, substitute v = y^(1-n)',
        'CF for roots m1,m2: y = C1 e^(m1x) + C2 e^(m2x)',
      ],
    },
    2: {
      blurb:
        'The Laplace transform converts differential equations into algebraic equations in s-domain, making initial-value problems easy to solve. Its shifting theorems and convolution help find inverse transforms by partial fractions.',
      formulas: [
        'L{1} = 1/s',
        'L{t^n} = n!/s^(n+1)',
        'L{e^(at)} = 1/(s-a)',
        'L{sin at} = a/(s^2+a^2), L{cos at} = s/(s^2+a^2)',
        "L{f'(t)} = sF(s) - f(0)",
      ],
    },
    3: {
      blurb:
        'Vector calculus extends calculus to fields. The gradient measures how a scalar field changes, divergence measures the outflow of a vector field, and curl measures its rotation, all used in electromagnetic and fluid analysis.',
      formulas: [
        'grad φ = ∇φ = (∂φ/∂x)i + (∂φ/∂y)j + (∂φ/∂z)k',
        'div F = ∇·F = ∂Fx/∂x + ∂Fy/∂y + ∂Fz/∂z',
        'curl F = ∇×F',
      ],
    },
    4: {
      blurb:
        'Statistics summarizes data through measures of central tendency (mean, median, mode) and dispersion (range, variance, standard deviation). Probability rules, conditional probability and Bayes theorem, along with binomial, Poisson and normal distributions, model random phenomena.',
      formulas: [
        'Mean x̄ = Σx/n',
        'Variance σ^2 = Σ(x-x̄)^2/n',
        'P(A∪B) = P(A) + P(B) - P(A∩B)',
        'Bayes: P(A|B) = P(B|A)P(A) / P(B)',
        'Binomial: P(x) = nCx p^x q^(n-x)',
      ],
    },
    5: {
      blurb:
        'Numerical methods find approximate solutions where exact methods fail. Bisection and Newton-Raphson locate roots, trapezoidal and Simpson rules approximate integrals, and Euler and Runge-Kutta methods solve differential equations numerically.',
      formulas: [
        "Newton-Raphson: x_{n+1} = x_n - f(x_n)/f'(x_n)",
        'Trapezoidal: ∫ ≈ h/2 [y0 + 2(y1+...+y_{n-1}) + yn]',
        'Simpson 1/3: ∫ ≈ h/3 [y0 + 4(y1+y3+...) + 2(y2+y4+...) + yn]',
        'Euler: y_{n+1} = y_n + h f(x_n, y_n)',
      ],
    },
  },
  ELE201: {
    1: {
      blurb:
        'Ohm law and Kirchhoff laws form the basis of DC circuit analysis. Series and parallel combinations reduce networks, while mesh and nodal analysis solve multi-loop circuits systematically. Power dissipated in resistors is the product of voltage and current.',
      formulas: [
        'V = IR',
        'KVL: ΣV = 0 around a loop',
        'KCL: ΣI = 0 at a node',
        'Series: R = R1 + R2 + ...',
        'Parallel: 1/R = 1/R1 + 1/R2 + ...',
        'Power P = VI = I^2R = V^2/R',
      ],
    },
    2: {
      blurb:
        'AC analysis deals with sinusoidal waveforms described by amplitude, frequency and phase. Average and RMS values quantify alternating quantities, and R, L and C elements show characteristic phase behaviour that combines into the impedance of R-L-C circuits and power factor.',
      formulas: [
        'Average value = 2Vm/π (half cycle)',
        'RMS value = Vm/√2',
        'Form factor = RMS/Average = 1.11',
        'X_L = 2πfL, X_C = 1/(2πfC)',
        'Z = √(R^2 + (X_L - X_C)^2)',
        'Power factor cosφ = R/Z',
        'P = VI cosφ',
      ],
    },
    3: {
      blurb:
        'A transformer transfers electrical energy between circuits by mutual induction, stepping voltage up or down according to the turns ratio. Its EMF equation relates induced voltage to flux and frequency, and efficiency depends on core and copper losses.',
      formulas: [
        'E = 4.44 f Φm N',
        'V1/V2 = N1/N2 = I2/I1',
        'Efficiency η = Output/Input = (Input - Losses)/Input',
      ],
    },
    4: {
      blurb:
        'DC machines convert mechanical energy to electrical (generator) and electrical to mechanical (motor) using a commutator. AC machines include the three-phase induction motor, whose rotor speed lags the rotating magnetic field by slip.',
      formulas: [
        'E_g = (PΦZN)/(60A)',
        'Torque T = kΦIa',
        'Synchronous speed Ns = 120f/P',
        'Slip s = (Ns - N)/Ns',
      ],
    },
    5: {
      blurb:
        'House wiring distributes power safely through fuses, switches and sockets, with earthing protecting users from shock. Batteries store energy electrochemically, and electrical safety rules prevent hazards from shocks, short circuits and overloads.',
    },
  },
  PRC201: {
    1: {
      blurb:
        'C programs begin with an algorithm and flowchart, then follow a fixed structure with header files, the main function and statements. Data types, operators and the printf/scanf family handle basic computation and input-output.',
    },
    2: {
      blurb:
        'Control structures decide the flow of a program. if-else and switch make decisions, while while, do-while and for loops repeat code, with break and continue refining loop behaviour.',
    },
    3: {
      blurb:
        'Arrays store collections of same-type data accessed by index, and two-dimensional arrays represent matrices. Strings are character arrays manipulated with library functions like strlen, strcpy and strcmp.',
    },
    4: {
      blurb:
        'Functions break programs into reusable blocks with parameters and return values. Recursion lets a function call itself, and storage classes (auto, register, static, extern) control variable scope and lifetime.',
    },
    5: {
      blurb:
        'Pointers store memory addresses and enable dynamic behaviour, including pointer arithmetic and array access. Structures group related data of different types, and file functions read and write persistent data.',
    },
  },
};
