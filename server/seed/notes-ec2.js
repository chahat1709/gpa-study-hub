module.exports = {
  DCM501: {
    1: {
      blurb: 'Digital communication converts analog messages into samples taken at or above the Nyquist rate to avoid aliasing. PAM carries these samples as pulse amplitudes, and quantization maps them to discrete levels, introducing quantization noise that sets the SNR.',
      formulas: [
        'fs ≥ 2 fm (Nyquist)',
        'SQNR = 1.76 + 6.02n dB (n bits)',
        'Steps = 2^n'
      ]
    },
    2: {
      blurb: 'PCM converts each quantized sample into an n-bit code word, trading bandwidth for noise immunity. Companding (A-law/mu-law) improves small-signal accuracy, delta modulation transmits one bit per sample, and DPCM exploits correlation between samples.',
      formulas: [
        'PCM bit rate = n × fs',
        'PCM bandwidth = n × fs/2',
        'DM slope overload: (Δ/Ts) < max slope of signal'
      ]
    },
    3: {
      blurb: 'Baseband transmission sends digital pulses directly. Line codes like NRZ, RZ and Manchester shape the spectrum and embed timing, intersymbol interference limits symbol rate and is reduced by raised-cosine pulses, while matched filters maximize SNR at the receiver.',
      formulas: [
        'Nyquist rate for no ISI: R = 2B symbols/s',
        'Manchester: 0 = high-low, 1 = low-high'
      ]
    },
    4: {
      blurb: 'Digital modulation maps bits to carrier parameters. ASK varies amplitude, FSK varies frequency, and PSK varies phase — BPSK is the most robust binary scheme. QPSK doubles bit rate in the same bandwidth, and DPSK avoids coherent carrier recovery.',
      formulas: [
        'BPSK bandwidth = 2Rb/... = Rb (baseband signal rate doubled at passband)',
        'QPSK: 2 bits per symbol, BW halved vs BPSK',
        'PSK bit error: Pe = Q(√(2Eb/N0)) for BPSK'
      ]
},
    5: {
      blurb: 'Multiplexing shares one channel among many users: TDM assigns time slots, FDM assigns frequency bands. Synchronization aligns frames and bits at the receiver, and spread spectrum spreads energy over wide bandwidth for security and interference rejection.',
      formulas: [
        'TDM frame = one slot per channel',
        'Processing gain G = Bw/Bs (dB)'
      ]
    }
  },
  EBS502: {
    1: {
      blurb: 'An embedded system is a dedicated computer inside a larger system, constrained by cost, power, size and real-time response. Choosing the processor, memory and peripherals matches the design metrics to the application requirements.'
    },
    2: {
      blurb: '8051 advanced programming uses interrupts for event-driven responses, timers for precise delays and counting, and the UART for serial communication with programmable baud rates and modes 0-3.'
    },
    3: {
      blurb: 'Interfacing connects the 8051 to the outside world: LCDs display text via command and data modes, matrix keypads are scanned through ports, ADCs convert sensor voltages, and motors are driven with PWM for speed control.'
    },
    4: {
      blurb: 'Real-time systems must respond within deadlines. RTOS kernels schedule tasks by priority, semaphores and message queues synchronize them, and watchdogs recover from software hangs, with state machines structuring embedded firmware.'
    },
    5: {
      blurb: 'Embedded C uses memory qualifiers like code, data and xdata, and bit operations for hardware control. Keil provides the compile-assemble-link flow with simulator and debugger, while logic analyzers and oscilloscopes verify hardware behaviour.'
    }
  },
  MIN503: {
    1: {
      blurb: 'Measurement quality is judged by accuracy, precision, sensitivity and resolution. Errors are classified as gross, systematic or random, and instruments are calibrated against primary and secondary standards for traceability.'
    },
    2: {
      blurb: 'Analog instruments move a pointer with electromagnetic torque. PMMC instruments suit DC with high accuracy, moving-iron instruments work on AC, electrodynamometer wattmeters measure power, and multimeters combine several ranges with a loading effect to manage.'
    },
    3: {
      blurb: 'Bridges compare unknown impedances against standards. Wheatstone and Kelvin bridges measure resistance, Maxwell and Schering bridges measure inductance and capacitance, and the Q meter measures quality factor at radio frequencies.'
    },
    4: {
      blurb: 'Transducers convert physical quantities into electrical signals. Resistive types include potentiometers and strain gauges, inductive types include LVDT, capacitive types measure displacement, and temperature uses thermocouples, RTDs and thermistors.',
      formulas: [
        'Gauge factor GF = (ΔR/R)/(ΔL/L)',
        'LVDT output ∝ core displacement'
      ]
    },
    5: {
      blurb: 'Digital instruments convert measurement to numbers: ramp and dual-slope DVMs integrate the input, frequency counters measure cycles, and the CRO displays waveforms with time-base triggering and Lissajous patterns. Data acquisition systems digitize and log sensor data.'
    }
  },
  MOC601: {
    1: {
      blurb: 'Cellular networks divide a region into cells, reusing frequencies in clusters to serve many users. Co-channel and adjacent channel interference limit reuse distance, handoffs keep calls alive across cells, and Erlang traffic theory sizes the network for a grade of service.',
      formulas: [
        'Reuse distance D = R√(3N)',
        'C/I = √(3N) (approx for 6 interferers)',
        'Traffic A = λ × holding time (Erlangs)'
      ]
    },
    2: {
      blurb: 'GSM is a 2G system with mobile station, base station subsystem and network subsystem. Its radio interface uses TDMA frames and logical channels, calls go through setup, location updating and handover procedures, and GPRS adds packet data.',
      formulas: [
        'GSM bands: 900/1800 MHz',
        '8 time slots per carrier',
        'Frame = 4.615 ms, slot = 577 μs'
      ]
    },
    3: {
      blurb: 'CDMA lets all users share the same frequency, separated by orthogonal codes, using spread spectrum with processing gain. Soft handoff makes break-before-make connections unnecessary, and 3G UMTS with WCDMA delivers higher data rates and multimedia.',
      formulas: [
        'Processing gain = chip rate / data rate',
        'WCDMA chip rate = 3.84 Mcps'
      ]
    },
    4: {
      blurb: '4G LTE uses OFDMA on the downlink and SC-FDMA on the uplink with an all-IP core. MIMO multiplies capacity with multiple antennas, and 5G NR adds mmWave bands, massive MIMO and ultra-low latency for new services.',
      formulas: [
        'LTE peak rate ≈ bandwidth × spectral efficiency',
        'MIMO capacity ≈ N × SISO capacity'
      ]
    },
    5: {
      blurb: 'Short-range wireless completes the ecosystem: Wi-Fi follows IEEE 802.11 with WPA security, Bluetooth connects personal devices with piconets, ZigBee serves low-power sensor networks, and LPWAN technologies like LoRa and NB-IoT connect IoT devices over kilometers.'
    }
  },
  OFC602: {
    1: {
      blurb: 'Optical fibers guide light by total internal reflection between core and cladding. The acceptance angle and numerical aperture measure how much light enters the fiber, and single-mode fibers carry one mode while multimode fibers carry many.',
      formulas: [
        'Snell law: n1 sinθ1 = n2 sinθ2',
        'TIR when θ > θc = sin^-1(n2/n1)',
        'NA = √(n1^2 - n2^2)',
        'Acceptance angle θa = sin^-1(NA)'
      ]
    },
    2: {
      blurb: 'Step-index and graded-index fibers differ in refractive profile and modal dispersion. Attenuation from absorption, scattering and bending weakens the signal, and dispersion (modal and chromatic) spreads pulses, limiting bit rate and distance.',
      formulas: [
        'Attenuation (dB/km) = (10/L) log10(Pin/Pout)',
        'Dispersion limits: BL product (bit rate × distance)'
      ]
    },
    3: {
      blurb: 'LEDs and laser diodes convert electrical current into light. LEDs are cheap and robust with wide spectra, laser diodes are coherent and powerful for long distances, and source-to-fiber coupling uses splices and connectors with measured coupling efficiency.'
    },
    4: {
      blurb: 'Photodetectors convert light back to current: PIN diodes are fast and simple, APDs amplify internally with avalanche gain. Receiver design maximizes sensitivity against noise, and EDFAs amplify optical signals directly without regeneration.',
      formulas: [
        'Responsivity R = Ip/Po (A/W)',
        'Quantum efficiency η = electrons/photons'
      ]
    },
    5: {
      blurb: 'Optical link design balances power and rise time budgets to guarantee performance over distance. WDM packs many wavelengths into one fiber for enormous capacity, and passive optical networks bring fiber to the home (FTTH).',
      formulas: [
        'Power budget: Ps - Pr ≥ 2×connector loss + cable loss + margin',
        'Rise time budget: tr^2 ≥ Σ ti^2'
      ]
    }
  },
  INE603: {
    1: {
      blurb: 'Power devices switch and control high voltages and currents. The SCR latches on with a gate pulse and turns off when current falls below holding level, triacs switch AC both ways, and power MOSFETs and IGBTs combine high speed with high power, protected by snubbers and heat sinks.'
    },
    2: {
      blurb: 'Controlled rectifiers convert AC to variable DC by delaying the firing angle. Single-phase half and full wave circuits change average output voltage, and three-phase rectifiers supply high-power industrial loads with lower ripple.',
      formulas: [
        'Half wave: Vdc = Vm(1 + cosα)/(2π)',
        'Full wave: Vdc = Vm(1 + cosα)/π'
      ]
    },
    3: {
      blurb: 'Choppers convert fixed DC to variable DC with switching duty cycle, and inverters convert DC to AC at variable frequency and voltage using PWM. Cycloconverters change AC frequency directly for low-speed high-torque drives.',
      formulas: [
        'Step down chopper: Vout = D Vin',
        'Duty cycle D = Ton/T',
        'Inverter fundamental: V1 = 2Vdc/π (square wave)'
      ]
    },
    4: {
      blurb: 'Power electronics drives industry: AC motors are speed-controlled by voltage and frequency control with VFDs, DC motors by armature and chopper control with regeneration, and UPS plus SMPS provide clean, reliable power.',
      formulas: [
        'VFD: N ∝ f (frequency control)',
        'Chopper drive: Ea = D V'
      ]
    },
    5: {
      blurb: 'Automation relies on sensors for presence, level and flow, and PLCs execute ladder logic to control machines. Industrial safety standards, protective devices and earthing prevent electrical accidents in factories.'
    }
  }
};