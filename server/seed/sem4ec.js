module.exports = [
  {
    code: 'ACO401', name: 'Analog Communication Engineering', branch: 'EC', semester: 4, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Amplitude Modulation', weightage: 25, topics: [
        { t: 'Need for modulation', s: ['baseband and carrier signals', 'advantages of modulation', 'types of modulation'] },
        { t: 'Amplitude modulation principle', s: ['modulating and carrier signals', 'modulation index', 'AM waveform'] },
        { t: 'Power relations in AM', s: ['carrier and sideband power', 'total power and efficiency', 'power calculations'] },
        { t: 'DSB-SC, SSB and VSB', s: ['DSB-SC generation', 'SSB and its advantages', 'VSB for television'] }
      ] },
      { n: 2, title: 'AM Transmitters and Receivers', weightage: 20, topics: [
        { t: 'AM transmitter block diagram', s: ['crystal oscillator', 'modulation stage', 'power amplifiers'] },
        { t: 'Low level and high level modulation', s: ['comparison', 'circuit considerations', 'applications'] },
        { t: 'Superheterodyne receiver', s: ['block diagram', 'RF, mixer and IF stages', 'image frequency rejection'] },
        { t: 'Receiver characteristics', s: ['sensitivity and selectivity', 'fidelity', 'AGC and squelch'] }
      ] },
      { n: 3, title: 'Angle Modulation', weightage: 25, topics: [
        { t: 'Frequency modulation principle', s: ['frequency deviation', 'modulation index and bandwidth', 'FM waveform'] },
        { t: 'Phase modulation', s: ['phase deviation', 'relationship between FM and PM', 'Narrowband and wideband FM'] },
        { t: 'FM generation', s: ['direct method (varactor)', 'indirect method (Armstrong)', 'comparison'] },
        { t: 'FM demodulation', s: ['slope detector', 'Foster-Seeley discriminator', 'PLL demodulator'] }
      ] },
      { n: 4, title: 'Noise in Communication Systems', weightage: 15, topics: [
        { t: 'Sources and types of noise', s: ['thermal noise', 'shot noise', 'external noise'] },
        { t: 'Signal to noise ratio', s: ['SNR definition', 'noise figure', 'noise temperature'] },
        { t: 'Noise performance of AM and FM', s: ['SNR in AM', 'SNR improvement in FM', 'pre-emphasis and de-emphasis'] }
      ] },
      { n: 5, title: 'Pulse Modulation and Radio Wave Propagation', weightage: 15, topics: [
        { t: 'Pulse amplitude modulation', s: ['sampling concept', 'PAM generation and detection', 'applications'] },
        { t: 'PWM and PPM', s: ['pulse width modulation', 'pulse position modulation', 'comparison'] },
        { t: 'Radio wave propagation', s: ['ground wave', 'sky wave and ionosphere', 'space wave'] }
      ] }
    ]
  },
  {
    code: 'MPM402', name: 'Microprocessor and Microcontroller (8085 and 8051)', branch: 'EC', semester: 4, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: '8085 Architecture', weightage: 20, topics: [
        { t: '8085 microprocessor features', s: ['8 bit architecture', 'pin diagram', 'internal bus structure'] },
        { t: 'Registers and ALU', s: ['accumulator and flag register', 'general purpose registers', 'program counter and stack pointer'] },
        { t: 'Memory interfacing', s: ['address decoding', 'memory map', 'I/O mapped and memory mapped'] },
        { t: 'Timing and control', s: ['machine cycles', 'T states and clock', 'instruction cycle'] }
      ] },
      { n: 2, title: '8085 Programming', weightage: 25, topics: [
        { t: 'Instruction set', s: ['data transfer instructions', 'arithmetic and logical instructions', 'branch and control instructions'] },
        { t: 'Addressing modes', s: ['immediate and direct', 'register and register indirect', 'implied addressing'] },
        { t: 'Assembly programming', s: ['simple programs', 'loops and counters', 'delay routines'] },
        { t: 'Stack and subroutines', s: ['stack operations', 'CALL and RET', 'nested subroutines'] }
      ] },
      { n: 3, title: '8085 Interfacing', weightage: 15, topics: [
        { t: 'Interrupts of 8085', s: ['maskable and non-maskable', 'interrupt priorities', 'RIM and SIM instructions'] },
        { t: '8255 PPI', s: ['ports and modes', 'control word', 'interfacing examples'] },
        { t: 'Counters and timers', s: ['8253/8254 basics', 'programming', 'applications'] }
      ] },
      { n: 4, title: '8051 Microcontroller Architecture', weightage: 20, topics: [
        { t: '8051 features', s: ['8 bit microcontroller', 'on chip memory', 'special function registers'] },
        { t: 'Memory organization', s: ['internal RAM and register banks', 'bit addressable area', 'external memory'] },
        { t: 'Ports and timers', s: ['port structure', 'timer modes', 'serial port basics'] },
        { t: 'Interrupt structure', s: ['interrupt sources', 'interrupt enable and priority', 'interrupt service routines'] }
      ] },
      { n: 5, title: '8051 Programming and Interfacing', weightage: 20, topics: [
        { t: '8051 instruction set', s: ['data transfer and arithmetic', 'logical and bit operations', 'jump and call instructions'] },
        { t: 'Timer and counter programming', s: ['mode 1 and mode 2', 'delay generation', 'external counting'] },
        { t: 'Serial communication programming', s: ['UART modes', 'baud rate setting', 'transmit and receive routines'] },
        { t: 'Interfacing applications', s: ['LED and seven segment', 'keypad and LCD', 'ADC and DAC interfacing'] }
      ] }
    ]
  },
  {
    code: 'LIC403', name: 'Linear Integrated Circuits', branch: 'EC', semester: 4, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Operational Amplifier Fundamentals', weightage: 20, topics: [
        { t: 'Ideal op-amp', s: ['symbol and terminals', 'ideal characteristics', 'virtual short concept'] },
        { t: 'IC 741 op-amp', s: ['internal block diagram', 'input stage and gain stage', 'output stage'] },
        { t: 'Op-amp parameters', s: ['input offset voltage and current', 'CMRR and slew rate', 'gain bandwidth product'] }
      ] },
      { n: 2, title: 'Linear Applications of Op-Amp', weightage: 25, topics: [
        { t: 'Inverting and non-inverting amplifiers', s: ['circuit analysis', 'gain expressions', 'input impedance'] },
        { t: 'Summing and difference amplifiers', s: ['adder circuits', 'subtractor circuits', 'averaging amplifier'] },
        { t: 'Integrator and differentiator', s: ['ideal integrator', 'practical integrator', 'differentiator circuit'] },
        { t: 'Instrumentation amplifier', s: ['circuit configuration', 'gain derivation', 'applications'] }
      ] },
      { n: 3, title: 'Comparators and Waveform Generators', weightage: 20, topics: [
        { t: 'Comparators', s: ['open loop comparator', 'Schmitt trigger', 'hysteresis'] },
        { t: 'Astable and monostable multivibrators', s: ['using op-amp', 'using 555 timer', 'duty cycle control'] },
        { t: 'Waveform generators', s: ['square wave generator', 'triangular wave generator', 'sine wave generators'] }
      ] },
      { n: 4, title: 'Active Filters and Voltage Regulators', weightage: 20, topics: [
        { t: 'First order active filters', s: ['low pass filter', 'high pass filter', 'cutoff frequency'] },
        { t: 'Second order active filters', s: ['Butterworth response', 'band pass and band reject', 'filter design'] },
        { t: 'Voltage regulators', s: ['78xx and 79xx series', 'adjustable regulators', 'protection circuits'] }
      ] },
      { n: 5, title: 'Special Purpose ICs', weightage: 15, topics: [
        { t: '555 timer', s: ['block diagram', 'monostable and astable operation', 'applications'] },
        { t: 'PLL IC 565', s: ['phase locked loop', 'capture and lock range', 'applications'] },
        { t: 'DAC and ADC ICs', s: ['R-2R ladder DAC', 'successive approximation ADC', 'resolution and conversion time'] }
      ] }
    ]
  },
  { code: 'MPL401', name: 'Microprocessor Lab', branch: 'EC', semester: 4, credits: 2, is_lab: 1, units: [] }
];