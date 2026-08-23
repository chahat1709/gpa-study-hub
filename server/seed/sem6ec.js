module.exports = [
  {
    code: 'MOC601',
    name: 'Mobile Communication',
    branch: 'EC',
    semester: 6,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Cellular Concepts',
        weightage: 20,
        topics: [
          {
            t: 'Cellular system basics',
            s: ['cell and cluster', 'frequency reuse', 'cell splitting'],
          },
          {
            t: 'Interference',
            s: ['co-channel interference', 'adjacent channel interference', 'C/I ratio'],
          },
          {
            t: 'Handoff and roaming',
            s: ['handoff types', 'handoff strategies', 'roaming management'],
          },
          {
            t: 'Capacity and traffic',
            s: ['Erlang and traffic intensity', 'grade of service', 'blocking probability'],
          },
        ],
      },
      {
        n: 2,
        title: 'GSM System',
        weightage: 25,
        topics: [
          { t: 'GSM architecture', s: ['mobile station', 'BSS and NSS', 'operations subsystem'] },
          { t: 'GSM radio interface', s: ['frequency bands', 'TDMA frames', 'logical channels'] },
          { t: 'Call procedures', s: ['call setup', 'location updating', 'handover in GSM'] },
          { t: 'GPRS basics', s: ['GPRS architecture', 'data services', 'EDGE overview'] },
        ],
      },
      {
        n: 3,
        title: 'CDMA and 3G',
        weightage: 20,
        topics: [
          { t: 'Spread spectrum principles', s: ['DSSS', 'frequency hopping', 'processing gain'] },
          { t: 'CDMA system', s: ['CDMA concept', 'Walsh codes and PN sequences', 'soft handoff'] },
          { t: '3G UMTS', s: ['WCDMA basics', 'UMTS architecture', '3G data rates and services'] },
        ],
      },
      {
        n: 4,
        title: '4G and 5G',
        weightage: 20,
        topics: [
          { t: 'LTE basics', s: ['OFDMA and SC-FDMA', 'LTE architecture', 'LTE channels'] },
          { t: 'MIMO systems', s: ['MIMO concept', 'spatial multiplexing', 'beamforming'] },
          { t: '5G new radio', s: ['5G requirements', 'mmWave communication', '5G use cases'] },
        ],
      },
      {
        n: 5,
        title: 'Wireless Technologies',
        weightage: 15,
        topics: [
          { t: 'Wi-Fi', s: ['IEEE 802.11 standards', 'Wi-Fi security', 'WLAN setup'] },
          {
            t: 'Bluetooth and ZigBee',
            s: ['Bluetooth architecture', 'ZigBee basics', 'comparison'],
          },
          { t: 'IoT connectivity', s: ['LPWAN basics', 'LoRa and NB-IoT', 'IoT applications'] },
        ],
      },
    ],
  },
  {
    code: 'OFC602',
    name: 'Optical Fiber Communication',
    branch: 'EC',
    semester: 6,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Optical Fundamentals',
        weightage: 20,
        topics: [
          {
            t: 'Light propagation basics',
            s: ['reflection and refraction', 'Snell law', 'critical angle'],
          },
          {
            t: 'Total internal reflection',
            s: ['TIR condition', 'acceptance angle', 'numerical aperture'],
          },
          {
            t: 'Fiber structure and modes',
            s: ['core and cladding', 'mode concept', 'single mode and multimode'],
          },
        ],
      },
      {
        n: 2,
        title: 'Fiber Types and Signal Degradation',
        weightage: 20,
        topics: [
          { t: 'Fiber types', s: ['step index fiber', 'graded index fiber', 'comparison'] },
          { t: 'Attenuation', s: ['absorption losses', 'scattering losses', 'bending losses'] },
          {
            t: 'Dispersion',
            s: ['modal dispersion', 'chromatic dispersion', 'dispersion compensation'],
          },
        ],
      },
      {
        n: 3,
        title: 'Optical Sources',
        weightage: 20,
        topics: [
          {
            t: 'Light emitting diode',
            s: ['LED structure', 'LED characteristics', 'LED modulation'],
          },
          {
            t: 'Laser diode',
            s: ['laser principle', 'laser diode structure', 'comparison with LED'],
          },
          {
            t: 'Source to fiber coupling',
            s: ['coupling efficiency', 'fiber alignment', 'splices and connectors'],
          },
        ],
      },
      {
        n: 4,
        title: 'Optical Detectors and Receivers',
        weightage: 20,
        topics: [
          {
            t: 'Photodetectors',
            s: ['PIN photodiode', 'avalanche photodiode', 'responsivity and quantum efficiency'],
          },
          {
            t: 'Receiver design',
            s: ['receiver block diagram', 'noise in receivers', 'sensitivity'],
          },
          { t: 'Optical amplifiers', s: ['EDFA basics', 'amplifier types', 'applications'] },
        ],
      },
      {
        n: 5,
        title: 'Optical Systems and Applications',
        weightage: 20,
        topics: [
          { t: 'Link design', s: ['power budget', 'rise time budget', 'link calculations'] },
          {
            t: 'Wavelength division multiplexing',
            s: ['WDM principle', 'mux and demux', 'DWDM basics'],
          },
          {
            t: 'Optical networks',
            s: ['passive optical network', 'FTTH', 'optical network applications'],
          },
        ],
      },
    ],
  },
  {
    code: 'INE603',
    name: 'Industrial Electronics',
    branch: 'EC',
    semester: 6,
    credits: 4,
    is_lab: 0,
    units: [
      {
        n: 1,
        title: 'Power Semiconductor Devices',
        weightage: 25,
        topics: [
          {
            t: 'SCR',
            s: ['construction and working', 'SCR characteristics', 'SCR triggering methods'],
          },
          { t: 'Triac and diac', s: ['triac operation', 'diac characteristics', 'applications'] },
          { t: 'Power transistors', s: ['power MOSFET', 'IGBT', 'comparison of devices'] },
          {
            t: 'Device protection',
            s: ['snubber circuits', 'overvoltage and overcurrent protection', 'heat sinks'],
          },
        ],
      },
      {
        n: 2,
        title: 'Controlled Rectifiers',
        weightage: 20,
        topics: [
          {
            t: 'Single phase half wave controlled rectifier',
            s: ['circuit and waveforms', 'firing angle effect', 'output voltage'],
          },
          {
            t: 'Single phase full wave controlled rectifier',
            s: ['full bridge circuit', 'average output voltage', 'dual converter basics'],
          },
          {
            t: 'Three phase rectifiers',
            s: ['three phase half wave', 'three phase bridge', 'applications'],
          },
        ],
      },
      {
        n: 3,
        title: 'Choppers and Inverters',
        weightage: 20,
        topics: [
          { t: 'DC choppers', s: ['step down chopper', 'step up chopper', 'control strategies'] },
          {
            t: 'Inverters',
            s: ['single phase half bridge inverter', 'full bridge inverter', 'PWM techniques'],
          },
          {
            t: 'Cycloconverters basics',
            s: ['principle', 'applications', 'comparison with other converters'],
          },
        ],
      },
      {
        n: 4,
        title: 'Industrial Applications',
        weightage: 20,
        topics: [
          {
            t: 'AC motor speed control',
            s: ['voltage control', 'frequency control', 'VFD basics'],
          },
          { t: 'DC drives', s: ['armature control', 'chopper fed drives', 'regenerative braking'] },
          { t: 'UPS and SMPS', s: ['UPS types', 'SMPS working', 'power quality basics'] },
        ],
      },
      {
        n: 5,
        title: 'Sensors and Automation',
        weightage: 15,
        topics: [
          {
            t: 'Industrial sensors',
            s: ['proximity sensors', 'photoelectric sensors', 'level and flow sensors'],
          },
          {
            t: 'PLC basics',
            s: ['PLC architecture', 'ladder logic programming', 'PLC applications'],
          },
          {
            t: 'Industrial safety',
            s: ['safety standards', 'electrical safety in industry', 'protective devices'],
          },
        ],
      },
    ],
  },
  {
    code: 'MJP601',
    name: 'Major Project',
    branch: 'EC',
    semester: 6,
    credits: 4,
    is_lab: 1,
    units: [],
  },
];
