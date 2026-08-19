module.exports = {
  EDC301: {
    1: {
      blurb: 'Semiconductors conduct between metals and insulators, with doping creating excess electrons or holes. The PN junction forms a depletion region and rectifies current, and the zener diode operates in reverse breakdown for voltage regulation.',
      formulas: [
        'Diode current (Shockley): I = Is(e^(V/nVT) - 1), VT ≈ 26 mV at 300K',
        'α = IC/IE, β = IC/IB (transistor relations)',
        'Zener voltage = breakdown voltage'
      ]
    },
    2: {
      blurb: 'Rectifiers convert AC to DC: half-wave conducts one half cycle, full-wave and bridge use both halves. Capacitor filters smooth the output, clippers and clampers shape waveforms, and zener regulators hold output voltage constant despite line and load changes.',
      formulas: [
        'Vdc (HWR) = Vm/π',
        'Vdc (FWR) = 2Vm/π',
        'Ripple factor γ = 1.21 (HWR), 0.48 (FWR)',
        'Efficiency η = 40.6% (HWR), 81.2% (FWR)',
        'PIV of bridge rectifier = Vm'
      ]
    },
    3: {
      blurb: 'The BJT is a three-terminal amplifying device whose collector current is controlled by base current. Its input and output characteristics differ across CB, CE and CC configurations, and biasing circuits fix the operating point against temperature and β variation.',
      formulas: [
        'IE = IB + IC',
        'IC = β IB',
        'IC = α IE',
        'β = α/(1-α)',
        'Voltage divider bias: V_B = Vcc R2/(R1+R2)'
      ]
    },
    4: {
      blurb: 'Small-signal analysis models the BJT with h-parameters to compute gain and impedances of CE, CB and CC amplifiers. Multistage RC-coupled amplifiers increase gain but narrow bandwidth, and negative feedback trades gain for stability and wider bandwidth.',
      formulas: [
        'Av (CE) = -hfe RL\' / hie',
        'Gain with feedback: Af = A/(1 + Aβ)',
        'Bandwidth with feedback: BWf = BW(1 + Aβ)'
      ]
    },
    5: {
      blurb: 'FETs are voltage-controlled devices with very high input impedance. JFET and MOSFET characteristics and biasing differ from BJTs, and power devices like SCR, triac and IGBT switch large currents in industrial circuits.',
      formulas: [
        'JFET: ID = IDSS(1 - VGS/Vp)^2',
        'Transconductance gm = ΔID/ΔVGS',
        'gm = gm0(1 - VGS/Vp)'
      ]
    }
  },
  CTN302: {
    1: {
      blurb: 'Network theorems simplify complex linear circuits. Superposition handles multiple sources one at a time, while Thevenin and Norton replace any two-terminal network with an equivalent source and resistance, and maximum power transfer fixes the load for maximum power.',
      formulas: [
        'Thevenin: V_L = Vth RL/(Rth + RL)',
        'Norton: I_L = IN RN/(RN + RL)',
        'Max power when RL = Rth, Pmax = Vth^2/(4Rth)'
      ]
    },
    2: {
      blurb: 'Transients are the temporary behaviour of circuits when switched. RL and RC circuits charge and decay exponentially with a time constant, RLC circuits show under, over or critically damped responses, and Laplace transforms solve these easily in s-domain.',
      formulas: [
        'Time constant τ = L/R or RC',
        'i(t) = (V/R)(1 - e^(-t/τ)) (RL growth)',
        'v_c(t) = V(1 - e^(-t/RC)) (charging)',
        'v_c(t) = V0 e^(-t/RC) (discharging)'
      ]
    },
    3: {
      blurb: 'AC steady-state analysis uses phasors and complex impedance. Series resonance occurs when XL = XC, giving maximum current and voltage magnification, while parallel resonance gives maximum impedance. Power is split into real, reactive and apparent components.',
      formulas: [
        'f0 = 1/(2π√(LC))',
        'Q = XL/R = 1/R √(L/C)',
        'BW = f0/Q',
        'S = √(P^2 + Q^2)',
        'Q = P tanφ (reactive power)'
      ]
    },
    4: {
      blurb: 'Graph theory represents networks as nodes and branches, with trees, cut sets and tie sets used to formulate mesh and nodal equations in matrix form. Passive filters pass or reject frequency bands, with cutoff frequency at -3 dB.',
      formulas: [
        'Cutoff: f_c = 1/(2πRC)',
        'Low pass: gain = 1/√(1 + (f/fc)^2)'
      ]
    },
    5: {
      blurb: 'Two-port networks are described by z, y, h and ABCD parameters relating input and output voltages and currents. Ports can be connected in series, parallel or cascade, and characteristic impedance matters for ladder networks and matching.',
      formulas: [
        'z-parameters: V1 = z11 I1 + z12 I2, V2 = z21 I1 + z22 I2',
        'h-parameters: V1 = h11 I1 + h12 V2, I2 = h21 I1 + h22 V2'
      ]
    }
  },
  DGE303: {
    1: {
      blurb: 'Digital systems work with binary, octal and hexadecimal numbers. Complements perform subtraction in digital hardware, and codes like BCD, Excess-3, Gray and ASCII represent numbers and characters, with parity checking detecting errors.',
      formulas: [
        '2s complement = 1s complement + 1',
        'BCD: each decimal digit in 4 bits',
        'Gray code: G_i = B_i XOR B_{i+1}'
      ]
    },
    2: {
      blurb: 'Logic gates implement Boolean functions, with NAND and NOR being universal gates. Boolean theorems and De Morgan laws simplify expressions, SOP and POS forms standardize them, and Karnaugh maps minimize logic with grouping rules and don\'t-care conditions.',
      formulas: [
        'De Morgan: (A·B)\' = A\' + B\', (A+B)\' = A\'·B\'',
        'A + A\'B = A + B (absorption)',
        'XOR: A⊕B = A\'B + AB\''
      ]
    },
    3: {
      blurb: 'Combinational circuits produce outputs only from current inputs. Adders and subtractors perform binary arithmetic, encoders and decoders convert codes, and multiplexers route one of many inputs to an output, with MUX also acting as a universal logic element.',
      formulas: [
        'Full adder sum S = A⊕B⊕Cin, Cout = AB + Cin(A⊕B)',
        'n:1 MUX needs n select inputs'
      ]
    },
    4: {
      blurb: 'Sequential circuits use flip-flops to store state. SR, JK, D and T flip-flops differ in their excitation behaviour, registers shift data serially or in parallel, and counters count clock pulses in asynchronous or synchronous fashion for mod-N counting.',
      formulas: [
        'JK no invalid state; T toggles when T=1',
        'Mod-N counter needs n flip-flops where 2^n ≥ N'
      ]
    },
    5: {
      blurb: 'Memories store data permanently (ROM) or temporarily (RAM). PLDs like PLA and PAL implement custom logic, digital IC families TTL and CMOS trade speed against power, and ADCs/DACs convert between analog and digital domains with resolution set by bit count.',
      formulas: [
        'Resolution = Vref/2^n',
        'Steps = 2^n'
      ]
    }
  },
  ACO401: {
    1: {
      blurb: 'Modulation shifts the message spectrum to higher frequencies so signals travel over long distances and share the medium. In AM the carrier amplitude varies with the message, generating sidebands whose power depends on the modulation index.',
      formulas: [
        'm = Vm/Vc',
        'P_total = Pc(1 + m^2/2)',
        'Efficiency = m^2/(2 + m^2) × 100%',
        'Bandwidth = 2fm'
      ]
    },
    2: {
      blurb: 'AM transmitters build the modulated signal with a crystal oscillator and power amplifiers, using low-level or high-level modulation. The superheterodyne receiver converts all stations to a fixed intermediate frequency, giving high selectivity with image rejection.',
      formulas: [
        'f_IF = f_LO - f_signal',
        'Image frequency = f_signal + 2 f_IF'
      ]
    },
    3: {
      blurb: 'Angle modulation varies the carrier frequency or phase with the message. FM spreads energy over bandwidth depending on deviation, and is generated directly by varactor or indirectly by the Armstrong method, with discriminators and PLLs demodulating it.',
      formulas: [
        'Δf = kf Vm',
        'β = Δf/fm',
        'Carson rule: BW = 2(Δf + fm)',
        'NBFM β<1, WBFM β>1'
      ]
    },
    4: {
      blurb: 'Noise corrupts signals, with thermal and shot noise in receivers and external noise from the environment. SNR and noise figure measure quality, and FM gives better noise immunity than AM, improved further by pre-emphasis and de-emphasis.',
      formulas: [
        'SNR = Psignal/Pnoise',
        'Noise figure F = (SNR)_in/(SNR)_out',
        'Noise temperature Te = T0(F-1)'
      ]
    },
    5: {
      blurb: 'Pulse modulation samples the message into pulses: PAM varies amplitude, PWM varies width and PPM varies position. Radio waves propagate as ground, sky or space waves depending on frequency and ionosphere conditions.',
      formulas: [
        'PAM: sampled at fs ≥ 2fm',
        'Sky wave uses ionosphere reflection'
      ]
    }
  },
  MPM402: {
    1: {
      blurb: 'The 8085 is an 8-bit microprocessor with an accumulator, flag register, general-purpose registers and a stack. Its pin diagram shows the multiplexed address/data bus, and memory is interfaced through address decoding with machine cycles defining timing.',
      formulas: [
        '16 address lines → 64 KB memory',
        'One machine cycle = 3-6 T states'
      ]
    },
    2: {
      blurb: 'The 8085 instruction set covers data transfer, arithmetic, logical and branch instructions with five addressing modes. Assembly programs use loops, counters and delay routines, while subroutines called with CALL/RET use the stack for nested calls.',
      formulas: [
        'Addressing modes: immediate, direct, register, register indirect, implied',
        '16-bit address from H:L register pair'
      ]
    },
    3: {
      blurb: 'Interfacing connects the 8085 to memory, I/O devices and peripherals. Maskable and non-maskable interrupts have fixed priorities managed by RIM/SIM, the 8255 PPI provides programmable ports, and the 8253/8254 supplies counters and timers.',
      formulas: [
        '8255 modes: mode 0 (basic I/O), mode 1 (strobed), mode 2 (bidirectional)',
        'Interrupt priority: TRAP > RST7.5 > RST6.5 > RST5.5 > INTR'
      ]
    },
    4: {
      blurb: 'The 8051 microcontroller integrates CPU, RAM, ROM, ports, timers and serial interface on one chip. Its special function registers control peripherals, internal memory has register banks and bit-addressable areas, and interrupts have fixed enable and priority registers.',
      formulas: [
        '128 bytes internal RAM + SFRs',
        '4 I/O ports P0-P3',
        '2 timers (T0, T1) with 4 modes'
      ]
    },
    5: {
      blurb: '8051 programming uses its instruction set for data transfer, arithmetic, logic, bit operations and jumps. Timers generate delays in modes 0-3, serial communication runs in UART modes with programmable baud rates, and peripherals like LEDs, seven-segments, keypads and LCDs are interfaced through ports.',
      formulas: [
        'Delay = (65536 - N) machine cycles in mode 1',
        'Baud rate = (fosc/12)/(32 × (256 - TH1))'
      ]
    }
  },
  LIC403: {
    1: {
      blurb: 'An ideal op-amp has infinite gain, infinite input impedance and zero output impedance, with a virtual short between inputs. The 741 has an input differential stage, gain stage and output stage, and parameters like offset, CMRR and slew rate limit real behaviour.',
      formulas: [
        'Virtual short: V+ = V- (with negative feedback)',
        'Slew rate = ΔV/Δt (V/μs)',
        'CMRR = Ad/Ac (dB)'
      ]
    },
    2: {
      blurb: 'Negative feedback configures the op-amp into useful linear circuits. Inverting and non-inverting amplifiers set gain by resistor ratios, summing and difference amplifiers mix signals, integrators and differentiators perform calculus, and the instrumentation amplifier rejects common-mode noise.',
      formulas: [
        'Inverting: Av = -Rf/R1',
        'Non-inverting: Av = 1 + Rf/R1',
        'Summing: Vout = -Rf(V1/R1 + V2/R2 + ...)',
        'Instrumentation: Vout = (1 + 2R/Rg)(V2 - V1)'
      ]
    },
    3: {
      blurb: 'Comparators decide which input is larger and can add hysteresis as a Schmitt trigger. Multivibrators using op-amps or the 555 timer generate square waves (astable) and one-shot pulses (monostable), from which triangular and sine waves are derived.',
      formulas: [
        'Schmitt: V_UTP - V_LTP = hysteresis',
        '555 astable: f = 1.44/((R1 + 2R2)C)',
        '555 monostable: T = 1.1 R C'
      ]
    },
    4: {
      blurb: 'Active filters use op-amps with RC networks to shape frequency response without inductors. First and second order Butterworth low-pass and high-pass filters have sharp roll-offs, and 78xx/79xx regulators provide fixed or adjustable DC supply with protection.',
      formulas: [
        'First order LPF: fc = 1/(2πRC)',
        'Roll-off: -20 dB/decade per order',
        'Second order: -40 dB/decade'
      ]
    },
    5: {
      blurb: 'Special ICs extend op-amp applications. The 555 timer works as monostable or astable, the 565 PLL locks onto input frequency for demodulation and frequency synthesis, and DACs like R-2R ladder plus successive approximation ADCs bridge analog and digital domains.',
      formulas: [
        'Vout (R-2R) = Vref × D/2^n',
        'ADC resolution = Vref/2^n'
      ]
    }
  }
};