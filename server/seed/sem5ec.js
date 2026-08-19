module.exports = [
  {
    code: 'DCM501', name: 'Digital Communication', branch: 'EC', semester: 5, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Sampling and Quantization', weightage: 20, topics: [
        { t: 'Sampling theorem', s: ['uniform sampling', 'Nyquist rate', 'aliasing'] },
        { t: 'Pulse amplitude modulation', s: ['PAM types', 'natural and flat top sampling', 'reconstruction'] },
        { t: 'Quantization', s: ['uniform quantization', 'quantization error', 'signal to quantization noise ratio'] }
      ] },
      { n: 2, title: 'Pulse Code Modulation', weightage: 20, topics: [
        { t: 'PCM system', s: ['sampling, quantizing and encoding', 'PCM waveform', 'bandwidth requirement'] },
        { t: 'Companding', s: ['need for companding', 'A-law and mu-law', 'companding circuits'] },
        { t: 'Delta modulation and DPCM', s: ['delta modulation', 'slope overload and granular noise', 'adaptive delta modulation'] },
        { t: 'Differential PCM', s: ['DPCM principle', 'predictor design', 'comparison with PCM'] }
      ] },
      { n: 3, title: 'Baseband Transmission', weightage: 15, topics: [
        { t: 'Line coding schemes', s: ['NRZ and RZ formats', 'Manchester encoding', 'AMI and HDB3'] },
        { t: 'Inter symbol interference', s: ['cause of ISI', 'Nyquist criterion', 'raised cosine pulse'] },
        { t: 'Matched filter and equalization', s: ['matched filter concept', 'eye diagram', 'equalizer basics'] }
      ] },
      { n: 4, title: 'Digital Modulation Techniques', weightage: 30, topics: [
        { t: 'ASK modulation', s: ['generation and detection', 'bandwidth', 'applications'] },
        { t: 'FSK modulation', s: ['generation and detection', 'coherent and non-coherent', 'bandwidth'] },
        { t: 'PSK modulation', s: ['BPSK generation and detection', 'BPSK waveform', 'error probability'] },
        { t: 'QPSK and advanced schemes', s: ['QPSK generation', 'DPSK', 'QAM basics'] }
      ] },
      { n: 5, title: 'Multiplexing and Synchronization', weightage: 15, topics: [
        { t: 'Time division multiplexing', s: ['TDM principle', 'T1 carrier basics', 'synchronization in TDM'] },
        { t: 'Frequency division multiplexing', s: ['FDM principle', 'channel spacing', 'comparison with TDM'] },
        { t: 'Spread spectrum basics', s: ['direct sequence spread spectrum', 'frequency hopping', 'applications'] }
      ] }
    ]
  },
  {
    code: 'EBS502', name: 'Embedded Systems', branch: 'EC', semester: 5, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Introduction to Embedded Systems', weightage: 15, topics: [
        { t: 'Embedded system definition', s: ['characteristics', 'applications', 'design metrics'] },
        { t: 'Embedded system components', s: ['processor selection', 'memory types', 'peripheral devices'] },
        { t: 'Embedded vs general purpose systems', s: ['comparison', 'real time requirements', 'power constraints'] }
      ] },
      { n: 2, title: '8051 Advanced Programming', weightage: 25, topics: [
        { t: 'Interrupt programming', s: ['interrupt registers', 'enabling and priority', 'interrupt service routines'] },
        { t: 'Timer and counter programming', s: ['timer modes', 'mode 0, 1 and 2', 'real time clock basics'] },
        { t: 'Serial communication', s: ['UART modes', 'baud rate generation', 'serial data transfer'] }
      ] },
      { n: 3, title: 'Peripheral Interfacing', weightage: 25, topics: [
        { t: 'LCD interfacing', s: ['LCD pins and commands', '4 bit and 8 bit modes', 'display routines'] },
        { t: 'Keypad and display interfacing', s: ['matrix keypad scanning', 'seven segment multiplexing', 'decoder drivers'] },
        { t: 'ADC and sensor interfacing', s: ['ADC0808/0809 interfacing', 'temperature sensors', 'data conversion routines'] },
        { t: 'Motor control', s: ['DC motor control', 'stepper motor control', 'PWM generation'] }
      ] },
      { n: 4, title: 'Real Time Concepts', weightage: 15, topics: [
        { t: 'Real time operating systems', s: ['task and process', 'scheduling policies', 'priority inversion'] },
        { t: 'RTOS services', s: ['semaphores and mutex', 'message queues', 'event flags'] },
        { t: 'Embedded software design', s: ['state machines', 'watchdog timers', 'power management'] }
      ] },
      { n: 5, title: 'Embedded C and Development Tools', weightage: 20, topics: [
        { t: 'Embedded C programming', s: ['data types and memory qualifiers', 'bit manipulation', 'delay routines'] },
        { t: 'Development tools', s: ['Keil IDE workflow', 'compiler and assembler', 'simulator and debugger'] },
        { t: 'Hardware tools and testing', s: ['logic analyzer basics', 'oscilloscope in debugging', 'in circuit testing'] }
      ] }
    ]
  },
  {
    code: 'MIN503', name: 'Measurement and Instrumentation', branch: 'EC', semester: 5, credits: 4, is_lab: 0,
    units: [
      { n: 1, title: 'Measurement Fundamentals', weightage: 15, topics: [
        { t: 'Measurement terms', s: ['accuracy and precision', 'sensitivity and resolution', 'hysteresis and drift'] },
        { t: 'Errors in measurement', s: ['gross and systematic errors', 'random errors', 'error analysis'] },
        { t: 'Standards of measurement', s: ['primary and secondary standards', 'calibration', 'traceability'] }
      ] },
      { n: 2, title: 'Analog Instruments', weightage: 25, topics: [
        { t: 'PMMC instrument', s: ['construction and working', 'torque equations', 'ammeter and voltmeter'] },
        { t: 'Moving iron instruments', s: ['attraction and repulsion types', 'advantages and disadvantages', 'applications'] },
        { t: 'Wattmeter and energy meter', s: ['electrodynamometer wattmeter', 'induction energy meter', 'power measurement'] },
        { t: 'Multimeter', s: ['voltage and current ranges', 'resistance measurement', 'loading effect'] }
      ] },
      { n: 3, title: 'Bridges', weightage: 20, topics: [
        { t: 'DC bridges', s: ['Wheatstone bridge', 'Kelvin bridge', 'sensitivity of bridges'] },
        { t: 'AC bridges', s: ['Maxwell bridge', 'Schering bridge', 'Hay bridge'] },
        { t: 'Q meter and applications', s: ['Q meter principle', 'inductance and capacitance measurement', 'bridge errors'] }
      ] },
      { n: 4, title: 'Transducers', weightage: 25, topics: [
        { t: 'Transducer fundamentals', s: ['classification', 'active and passive transducers', 'transducer selection'] },
        { t: 'Resistive transducers', s: ['potentiometer', 'strain gauge', 'resistance thermometer'] },
        { t: 'Inductive and capacitive transducers', s: ['LVDT', 'capacitive displacement transducer', 'applications'] },
        { t: 'Temperature and pressure transducers', s: ['thermocouple and RTD', 'thermistor', 'pressure measurement'] }
      ] },
      { n: 5, title: 'Digital Instruments and Display', weightage: 15, topics: [
        { t: 'Digital voltmeters', s: ['ramp type DVM', 'dual slope DVM', 'successive approximation DVM'] },
        { t: 'Digital multimeter and frequency counter', s: ['DMM features', 'frequency measurement', 'period measurement'] },
        { t: 'CRO', s: ['block diagram', 'time base and triggering', 'Lissajous patterns'] },
        { t: 'Data acquisition systems', s: ['DAS block diagram', 'sampling and conversion', 'PC based instrumentation'] }
      ] }
    ]
  },
  { code: 'EBL501', name: 'Embedded Systems Lab', branch: 'EC', semester: 5, credits: 2, is_lab: 1, units: [] }
];