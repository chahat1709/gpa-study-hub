require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const sem1 = require('./seed/sem1');
const sem2 = require('./seed/sem2');
const sem3ec = require('./seed/sem3');
const sem3ict = require('./seed/sem3ict');
const sem4ec = require('./seed/sem4ec');
const sem4ict = require('./seed/sem4ict');
const sem5ec = require('./seed/sem5ec');
const sem5ict = require('./seed/sem5ict');
const sem6ec = require('./seed/sem6ec');
const sem6ict = require('./seed/sem6ict');
const notesCommon = require('./seed/notes-common');
const notesEc1 = require('./seed/notes-ec1');
const notesEc2 = require('./seed/notes-ec2');
const notesIct = require('./seed/notes-ict');
const mcqsA = require('./seed/mcqs-a');
const mcqsB = require('./seed/mcqs-b');
const mcqsC = require('./seed/mcqs-c');
const labsA = require('./seed/labs-a');
const labsB = require('./seed/labs-b');
const projects = require('./seed/projects');

const SEED_KEY = 'seed_gtu_2024_25_v1';
const force = process.argv.includes('--force');

const db = new Database(path.join(__dirname, 'gpa_hub.db'));
db.pragma('journal_mode = WAL');

const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get(SEED_KEY);
if (existing && !force) {
  console.log(`Seed already applied (settings key ${SEED_KEY}). Run with --force to re-seed.`);
  process.exit(0);
}

const NOTES = Object.assign({}, notesCommon, notesEc1, notesEc2, notesIct);
const MCQS = Object.assign({}, mcqsA, mcqsB, mcqsC);
const LABS = Object.assign({}, labsA, labsB);

const SUBJECTS = [].concat(
  sem1,
  sem2,
  sem3ec,
  sem3ict,
  sem4ec,
  sem4ict,
  sem5ec,
  sem5ict,
  sem6ec,
  sem6ict
);

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

const rng = mulberry32(20250816);

const insertSubject = db.prepare(
  `INSERT OR IGNORE INTO subjects (id, code, name, branch, semester, credits, is_lab) VALUES (?, ?, ?, ?, ?, ?, ?)`
);
const insertUnit = db.prepare(
  `INSERT OR IGNORE INTO units (id, subject_id, unit_number, title, topics, weightage) VALUES (?, ?, ?, ?, ?, ?)`
);
const insertSyllabus = db.prepare(
  `INSERT OR IGNORE INTO syllabus (id, subject_id, unit_id, topic, subtopics, learning_outcomes, bloom_level, hours_allocated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertQuestion = db.prepare(
  `INSERT OR IGNORE INTO question_banks (id, subject_id, unit_id, question_text, question_type, options, correct_answer, explanation, marks, difficulty, bloom_level, co_code, source, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL)`
);
const insertPyq = db.prepare(
  `INSERT OR IGNORE INTO pyqs (id, subject_id, year, semester, exam_type, question_number, question_text, question_type, options, correct_answer, solution, marks, unit_id, co_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertNote = db.prepare(
  `INSERT OR IGNORE INTO notes (id, subject_id, unit_id, title, content, content_type, file_url, tags, is_verified, created_by) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 1, NULL)`
);
const insertLab = db.prepare(
  `INSERT OR IGNORE INTO labs (id, subject_id, experiment_number, title, aim, apparatus, theory, procedure, observations, calculations, result, viva_questions, precautions, reference_material) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertProject = db.prepare(
  `INSERT OR IGNORE INTO projects (id, subject_id, branch, semester, title, type, description, objectives, technologies, prerequisites, timeline_weeks, deliverables, difficulty, github_url, report_url, created_by) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`
);

const BLOOM = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate'];

function coCode(unitNumber) {
  return 'CO' + unitNumber;
}

function topicsJson(topics) {
  return JSON.stringify(topics.map(t => t.t));
}

function buildNumerics() {
  return {
    MTH101: [
      {
        unit: 1,
        gen: () => {
          const a = 2 + Math.floor(rng() * 4),
            b = 1 + Math.floor(rng() * 4),
            c = 1 + Math.floor(rng() * 3),
            d = 2 + Math.floor(rng() * 4);
          const det = a * d - b * c;
          if (det === 0) return null;
          return {
            q: `Find the determinant and the inverse of the matrix [[${a}, ${b}], [${c}, ${d}]].`,
            a: `det = ${det}; A^-1 = (1/${det}) [[${d}, ${-b}], [${-c}, ${a}]]`,
            sol: `det = ad - bc = ${a}(${d}) - (${b})(${c}) = ${det}. Inverse = adj(A)/det where adj(A) = [[d, -b], [-c, a]].`,
          };
        },
      },
      {
        unit: 4,
        gen: () => {
          const a = 1 + Math.floor(rng() * 3),
            b = 1 + Math.floor(rng() * 5),
            c = 2 + Math.floor(rng() * 6),
            x0 = 1 + Math.floor(rng() * 3);
          const val = 3 * a * x0 * x0 + 2 * b * x0 + c;
          return {
            q: `Find dy/dx at x = ${x0} for y = ${a}x^3 + ${b}x^2 + ${c}x.`,
            a: `dy/dx = ${3 * a}x^2 + ${2 * b}x + ${c}; at x = ${x0}, value = ${val}`,
            sol: `dy/dx = ${3 * a}x^2 + ${2 * b}x + ${c}. Substituting x = ${x0}: ${3 * a}(${x0})^2 + ${2 * b}(${x0}) + ${c} = ${val}.`,
          };
        },
      },
      {
        unit: 5,
        gen: () => {
          const a = 1 + Math.floor(rng() * 3),
            b = 1 + Math.floor(rng() * 3),
            c = 1 + Math.floor(rng() * 4),
            p = 2 + Math.floor(rng() * 3);
          const val = (a * Math.pow(p, 3)) / 3 + (b * p * p) / 2 + c * p;
          return {
            q: `Evaluate ∫ from 0 to ${p} (${a}x^2 + ${b}x + ${c}) dx.`,
            a: `= ${a}/3 x^3 + ${b}/2 x^2 + ${c}x evaluated from 0 to ${p} = ${val}`,
            sol: `∫(ax^2 + bx + c)dx = a x^3/3 + b x^2/2 + cx. At x=${p}: ${val}. At x=0: 0. Result = ${val}.`,
          };
        },
      },
    ],
    MTH201: [
      {
        unit: 1,
        gen: () => {
          const k = 1 + Math.floor(rng() * 3),
            y0 = 2 + Math.floor(rng() * 3),
            t = 2;
          const y = y0 * Math.exp(k * t);
          return {
            q: `Solve dy/dx = ${k}y with y(0) = ${y0} and find y(2).`,
            a: `y = ${y0} e^(${k}x); y(2) = ${y.toFixed(3)}`,
            sol: `Separable: dy/y = k dx → ln y = kx + C → y = Ce^(kx). With y(0)=${y0}, C=${y0}. y(2) = ${y0} e^(${k}·2) = ${y.toFixed(3)}.`,
          };
        },
      },
      {
        unit: 2,
        gen: () => {
          const a = 1 + Math.floor(rng() * 3),
            s = 2 + Math.floor(rng() * 3);
          const val = a / (s * s + a * a);
          return {
            q: `Find the Laplace transform of sin(${a}t) and evaluate it at s = ${s}.`,
            a: `L{sin(${a}t)} = ${a}/(s^2 + ${a * a}); at s=${s} = ${val.toFixed(4)}`,
            sol: `L{sin at} = a/(s^2 + a^2). With a=${a}, s=${s}: ${a}/(${s * s} + ${a * a}) = ${val.toFixed(4)}.`,
          };
        },
      },
      {
        unit: 5,
        gen: () => {
          const n = 2 + Math.floor(rng() * 3),
            target = n * n;
          let x = target;
          const steps = [];
          for (let i = 0; i < 3; i++) {
            x = x - (x * x - target) / (2 * x);
            steps.push(x.toFixed(4));
          }
          return {
            q: `Find √${target} using the Newton-Raphson method starting from x0 = ${target}.`,
            a: `√${target} = ${n} (after iterations: ${steps.join(', ')})`,
            sol: `f(x) = x^2 - ${target}, f'(x) = 2x. x_{k+1} = x_k - (x_k^2 - ${target})/(2x_k). Iterations: ${steps.join(' → ')}.`,
          };
        },
      },
    ],
    ELE201: [
      {
        unit: 1,
        gen: () => {
          const v = 10 + Math.floor(rng() * 30),
            r = 5 + Math.floor(rng() * 15);
          return {
            q: `A ${v} V source is connected across a ${r} ohm resistor. Find the current and power.`,
            a: `I = V/R = ${v}/${r} = ${(v / r).toFixed(3)} A; P = VI = ${((v * v) / r).toFixed(3)} W`,
            sol: `I = V/R = ${v}/${r} = ${(v / r).toFixed(3)} A. P = V·I = ${v} × ${(v / r).toFixed(3)} = ${((v * v) / r).toFixed(3)} W.`,
          };
        },
      },
      {
        unit: 1,
        gen: () => {
          const r1 = 4 + Math.floor(rng() * 5),
            r2 = 6 + Math.floor(rng() * 5),
            r3 = 10 + Math.floor(rng() * 6);
          return {
            q: `Find the total resistance of ${r1}, ${r2} and ${r3} ohms connected (a) in series and (b) in parallel.`,
            a: `Series: ${r1 + r2 + r3} ohm; Parallel: ${(1 / (1 / r1 + 1 / r2 + 1 / r3)).toFixed(3)} ohm`,
            sol: `Series: R = ${r1}+${r2}+${r3} = ${r1 + r2 + r3}. Parallel: 1/R = 1/${r1} + 1/${r2} + 1/${r3} → R = ${(1 / (1 / r1 + 1 / r2 + 1 / r3)).toFixed(3)}.`,
          };
        },
      },
      {
        unit: 3,
        gen: () => {
          const v1 = 110 + Math.floor(rng() * 40),
            n1 = 1000,
            ratio = 2 + Math.floor(rng() * 4);
          const v2 = v1 / ratio;
          return {
            q: `A transformer has ${n1} primary turns and ${Math.round(n1 / ratio)} secondary turns. Find the secondary voltage for ${v1} V input.`,
            a: `V2 = V1 × N2/N1 = ${v1} × ${(Math.round(n1 / ratio) / n1).toFixed(3)} = ${v2.toFixed(1)} V`,
            sol: `Turns ratio = N2/N1 = ${Math.round(n1 / ratio)}/${n1} = ${(Math.round(n1 / ratio) / n1).toFixed(3)}. V2 = ${v1} × ${(Math.round(n1 / ratio) / n1).toFixed(3)} = ${v2.toFixed(1)} V.`,
          };
        },
      },
    ],
    CTN302: [
      {
        unit: 2,
        gen: () => {
          const r = 1 + Math.floor(rng() * 4),
            c = 100 + Math.floor(rng() * 900),
            v = 10 + Math.floor(rng() * 20);
          const tau = (r * c) / 1e6;
          const t = tau;
          const vc = v * (1 - Math.exp(-1));
          return {
            q: `An RC circuit with R = ${r} kΩ and C = ${c} μF is charged from a ${v} V source. Find the time constant and the capacitor voltage at t = τ.`,
            a: `τ = RC = ${tau.toFixed(3)} s; v_c(τ) = ${vc.toFixed(2)} V`,
            sol: `τ = R·C = ${r}×10^3 × ${c}×10^-6 = ${tau.toFixed(3)} s. v_c(t) = V(1 - e^(-t/τ)); at t=τ, v_c = ${v}(1 - e^-1) = ${vc.toFixed(2)} V.`,
          };
        },
      },
      {
        unit: 3,
        gen: () => {
          const l = 10 + Math.floor(rng() * 90),
            c = 0.1 + rng() * 0.9;
          const f0 = 1 / (2 * Math.PI * Math.sqrt(l * 1e-3 * c * 1e-6));
          return {
            q: `Find the resonant frequency of a series circuit with L = ${l} mH and C = ${c.toFixed(2)} μF.`,
            a: `f0 = 1/(2π√(LC)) = ${f0.toFixed(2)} Hz`,
            sol: `f0 = 1/(2π√(LC)) = 1/(2π√(${l}×10^-3 × ${c.toFixed(2)}×10^-6)) = ${f0.toFixed(2)} Hz.`,
          };
        },
      },
    ],
    EDC301: [
      {
        unit: 2,
        gen: () => {
          const vm = 10 + Math.floor(rng() * 10);
          const vdc = (2 * vm) / Math.PI;
          return {
            q: `A full wave rectifier has peak output voltage ${vm} V. Find the DC output voltage and ripple factor.`,
            a: `Vdc = 2Vm/π = ${vdc.toFixed(2)} V; ripple factor = 0.48`,
            sol: `Vdc = 2Vm/π = 2×${vm}/π = ${vdc.toFixed(2)} V. Ripple factor of FWR ≈ 0.48.`,
          };
        },
      },
      {
        unit: 3,
        gen: () => {
          const ib = 20 + Math.floor(rng() * 40),
            beta = 100;
          return {
            q: `A BJT has base current ${ib} μA and β = ${beta}. Find the collector and emitter currents.`,
            a: `IC = β·IB = ${(beta * ib) / 1000} mA; IE = IC + IB = ${((beta * ib + ib) / 1000).toFixed(3)} mA`,
            sol: `IC = β·IB = ${beta} × ${ib} μA = ${(beta * ib) / 1000} mA. IE = IC + IB = ${(beta * ib) / 1000} mA + ${ib} μA = ${((beta * ib + ib) / 1000).toFixed(3)} mA.`,
          };
        },
      },
    ],
    DGE303: [
      {
        unit: 1,
        gen: () => {
          const dec = 8 + Math.floor(rng() * 25);
          return {
            q: `Convert the decimal number ${dec} to binary and hexadecimal.`,
            a: `Binary: ${dec.toString(2)}; Hex: ${dec.toString(16).toUpperCase()}`,
            sol: `Repeated division by 2 gives ${dec.toString(2)}. Grouping 4 bits gives hex ${dec.toString(16).toUpperCase()}.`,
          };
        },
      },
    ],
    ACO401: [
      {
        unit: 1,
        gen: () => {
          const pc = 50 + Math.floor(rng() * 50),
            m = 0.5 + rng() * 0.5;
          const pt = pc * (1 + (m * m) / 2);
          return {
            q: `An AM transmitter has carrier power ${pc} W and modulation index ${m.toFixed(2)}. Find the total power.`,
            a: `Pt = Pc(1 + m^2/2) = ${pt.toFixed(2)} W`,
            sol: `Pt = Pc(1 + m^2/2) = ${pc}(1 + ${((m * m) / 2).toFixed(3)}) = ${pt.toFixed(2)} W.`,
          };
        },
      },
    ],
    DCM501: [
      {
        unit: 1,
        gen: () => {
          const n = 6 + Math.floor(rng() * 6);
          const sqnr = 1.76 + 6.02 * n;
          return {
            q: `A PCM system uses ${n} bits per sample. Find the signal to quantization noise ratio in dB.`,
            a: `SQNR = 6.02n + 1.76 = ${sqnr.toFixed(2)} dB`,
            sol: `SQNR = 6.02n + 1.76 = 6.02×${n} + 1.76 = ${sqnr.toFixed(2)} dB.`,
          };
        },
      },
      {
        unit: 2,
        gen: () => {
          const fs = 4000 + Math.floor(rng() * 4000),
            n = 8;
          return {
            q: `A PCM system samples at ${fs} Hz with ${n} bits per sample. Find the bit rate.`,
            a: `Bit rate = n × fs = ${n} × ${fs} = ${n * fs} bps`,
            sol: `Bit rate = n·fs = ${n} × ${fs} = ${n * fs} bps.`,
          };
        },
      },
    ],
    OFC602: [
      {
        unit: 1,
        gen: () => {
          const n1 = 1.5,
            n2 = 1.46 + rng() * 0.02;
          const na = Math.sqrt(n1 * n1 - n2 * n2);
          return {
            q: `A fiber has core index ${n1} and cladding index ${n2.toFixed(3)}. Find the numerical aperture.`,
            a: `NA = √(n1^2 - n2^2) = ${na.toFixed(4)}`,
            sol: `NA = √(${n1}^2 - ${n2.toFixed(3)}^2) = √(${(n1 * n1).toFixed(4)} - ${(n2 * n2).toFixed(4)}) = ${na.toFixed(4)}.`,
          };
        },
      },
      {
        unit: 2,
        gen: () => {
          const pin = 1,
            length = 10 + Math.floor(rng() * 40),
            atten = 0.2 + rng() * 0.3;
          const pout = pin * Math.pow(10, (-atten * length) / 10);
          return {
            q: `A fiber of length ${length} km has attenuation ${atten.toFixed(2)} dB/km. Find the output power for 1 mW input.`,
            a: `Pout = Pin × 10^(-αL/10) = ${(pout * 1000).toFixed(3)} mW`,
            sol: `P(dBm) = 10 log10(Pin) - αL = 0 - ${(atten * length).toFixed(1)} = ${(-atten * length).toFixed(1)} dBm → Pout = ${(pout * 1000).toFixed(3)} mW.`,
          };
        },
      },
    ],
    MOC601: [
      {
        unit: 1,
        gen: () => {
          const r = 1 + Math.floor(rng() * 2),
            n = 3 + Math.floor(rng() * 2);
          const d = r * Math.sqrt(3 * n);
          return {
            q: `A cellular system has cell radius ${r} km and cluster size ${n}. Find the frequency reuse distance.`,
            a: `D = R√(3N) = ${d.toFixed(2)} km`,
            sol: `D = R√(3N) = ${r}√(3×${n}) = ${r}×${Math.sqrt(3 * n).toFixed(3)} = ${d.toFixed(2)} km.`,
          };
        },
      },
    ],
  };
}

const NUMERICS = buildNumerics();

function buildQuestionsForSubject(subject, unitById) {
  const questions = [];
  const handMcqs = MCQS[subject.code] || [];
  for (const m of handMcqs) {
    const unitId = unitById[subject.code + ':' + m.unit];
    questions.push({
      text: m.q,
      type: 'MCQ',
      options: JSON.stringify(m.opts),
      answer: m.opts[m.a],
      explanation: m.e,
      marks: 1,
      difficulty: m.diff,
      bloom: m.bloom,
      co: m.co,
      unit_id: unitId,
      source: 'manual',
    });
  }
  for (const unit of subject.units) {
    const unitId = unitById[subject.code + ':' + unit.n];
    const topics = unit.topics;
    const otherTopics = SUBJECTS.flatMap(s =>
      s.code === subject.code ? [] : s.units.flatMap(u => u.topics.map(t => t.t))
    );
    const unitOtherTopics = subject.units
      .filter(u => u.n !== unit.n)
      .flatMap(u => u.topics.map(t => t.t));

    for (const topic of topics) {
      questions.push({
        text: `Define ${topic.t}.`,
        type: 'DESCRIPTIVE',
        options: null,
        answer: topic.t,
        explanation: `Definition of ${topic.t} as covered in unit ${unit.n}.`,
        marks: 2,
        difficulty: 'Easy',
        bloom: 'Remember',
        co: coCode(unit.n),
        unit_id: unitId,
        source: 'manual',
      });
      questions.push({
        text: `Explain ${topic.t} in detail with suitable examples and diagrams.`,
        type: 'DESCRIPTIVE',
        options: null,
        answer: `${topic.t}: ${topic.s.join(', ')}.`,
        explanation: `Detailed explanation expected covering: ${topic.s.join(', ')}.`,
        marks: 7,
        difficulty: 'Medium',
        bloom: 'Understand',
        co: coCode(unit.n),
        unit_id: unitId,
        source: 'manual',
      });
      questions.push({
        text: `Describe the concept of ${topic.t} briefly.`,
        type: 'DESCRIPTIVE',
        options: null,
        answer: topic.t,
        explanation: 'Short description with key points.',
        marks: 3,
        difficulty: 'Easy',
        bloom: 'Understand',
        co: coCode(unit.n),
        unit_id: unitId,
        source: 'manual',
      });
      const opts = [topic.t];
      while (opts.length < 4 && otherTopics.length > 0) {
        const t = pick(otherTopics, rng);
        if (!opts.includes(t)) opts.push(t);
      }
      questions.push({
        text: `Which of the following is a topic covered in "${unit.title}"?`,
        type: 'MCQ',
        options: JSON.stringify(opts),
        answer: topic.t,
        explanation: `${topic.t} is part of ${unit.title}.`,
        marks: 1,
        difficulty: 'Easy',
        bloom: 'Remember',
        co: coCode(unit.n),
        unit_id: unitId,
        source: 'manual',
      });
    }
    const tf =
      topics.length >= 2
        ? [
            {
              text: `${topics[0].t} is a topic in "${unit.title}".`,
              answer: 'True',
              correct: true,
            },
            {
              text: `${unitOtherTopics[0] || 'Quantum computing'} is a topic in "${unit.title}".`,
              answer: 'False',
              correct: false,
            },
          ]
        : [];
    for (const t of tf) {
      questions.push({
        text: t.text,
        type: 'TRUE_FALSE',
        options: JSON.stringify(['True', 'False']),
        answer: t.answer,
        explanation: t.correct
          ? 'This topic belongs to this unit.'
          : 'This topic belongs to another unit.',
        marks: 1,
        difficulty: 'Easy',
        bloom: 'Remember',
        co: coCode(unit.n),
        unit_id: unitId,
        source: 'manual',
      });
    }
    const numerics = (NUMERICS[subject.code] || []).filter(num => num.unit === unit.n);
    for (const num of numerics) {
      const item = num.gen();
      if (!item) continue;
      questions.push({
        text: item.q,
        type: 'NUMERICAL',
        options: null,
        answer: item.a,
        explanation: item.sol,
        marks: 4,
        difficulty: 'Medium',
        bloom: 'Apply',
        co: coCode(unit.n),
        unit_id: unitId,
        source: 'manual',
      });
    }
  }
  return questions;
}

function buildPyqsForSubject(subject, questions, unitById) {
  const pyqs = [];
  const descriptive = questions.filter(q => q.type === 'DESCRIPTIVE' || q.type === 'NUMERICAL');
  const years = [2024, 2023, 2022, 2021, 2020, 2019];
  let qn = 1;
  for (const year of years) {
    const exam = year % 2 === 0 ? 'WINTER' : 'SUMMER';
    const count = 4 + Math.floor(rng() * 2);
    for (let i = 0; i < count && descriptive.length > 0; i++) {
      const q = descriptive[Math.floor(rng() * descriptive.length)];
      pyqs.push({
        subject_id: subject.id,
        year,
        semester: subject.semester,
        exam_type: exam,
        question_number: qn++,
        question_text: q.text,
        question_type: q.type,
        options: q.options,
        correct_answer: q.answer,
        solution: q.explanation,
        marks: q.marks,
        unit_id: q.unit_id,
        co_code: q.co,
      });
    }
  }
  return pyqs;
}

function buildNotesForSubject(subject, unitById) {
  const notes = [];
  const data = NOTES[subject.code] || {};
  for (const unit of subject.units) {
    const unitId = unitById[subject.code + ':' + unit.n];
    const info = data[unit.n] || {};
    const topicLines = unit.topics.map(t => `- **${t.t}** — ${t.s.join(', ')}`).join('\n');
    const blurb = info.blurb || `Study notes covering ${unit.title} for ${subject.name}.`;
    const content = `# ${unit.title}\n\n${blurb}\n\n## Topics covered\n\n${topicLines}`;
    notes.push({
      subject_id: subject.id,
      unit_id: unitId,
      title: `${unit.title} — Study Notes`,
      content,
      content_type: 'THEORY',
      tags: JSON.stringify(['gtu', subject.code, `unit-${unit.n}`]),
    });
    if (info.formulas && info.formulas.length > 0) {
      const formulaContent =
        `# ${unit.title} — Formula Sheet\n\n` + info.formulas.map(f => `- ${f}`).join('\n');
      notes.push({
        subject_id: subject.id,
        unit_id: unitId,
        title: `${unit.title} — Formula Sheet`,
        content: formulaContent,
        content_type: 'FORMULA',
        tags: JSON.stringify(['formula', subject.code, `unit-${unit.n}`]),
      });
    }
  }
  return notes;
}

function insertSubjectData(subject) {
  const branches = subject.branch === 'COMMON' ? ['EC', 'ICT'] : [subject.branch];
  const rows = [];
  for (const branch of branches) {
    const id = uuidv4();
    insertSubject.run(
      id,
      subject.code,
      subject.name,
      branch,
      subject.semester,
      subject.credits,
      subject.is_lab
    );
    rows.push({
      id,
      code: subject.code,
      branch,
      name: subject.name,
      semester: subject.semester,
      is_lab: subject.is_lab,
    });
  }
  return rows;
}

function run() {
  const counts = {
    subjects: 0,
    units: 0,
    syllabus: 0,
    questions: 0,
    pyqs: 0,
    notes: 0,
    labs: 0,
    projects: 0,
  };
  const unitById = {};

  const tx = db.transaction(() => {
    for (const subject of SUBJECTS) {
      const subjectRows = insertSubjectData(subject);
      counts.subjects += subjectRows.length;
      for (const row of subjectRows) {
        if (subject.is_lab) continue;
        for (const unit of subject.units) {
          const unitId = uuidv4();
          insertUnit.run(
            unitId,
            row.id,
            unit.n,
            unit.title,
            topicsJson(unit.topics),
            unit.weightage
          );
          unitById[row.code + ':' + unit.n] = unitId;
          counts.units++;
          const blooms = [BLOOM[0], BLOOM[1], BLOOM[2], BLOOM[4]];
          unit.topics.forEach((topic, i) => {
            insertSyllabus.run(
              uuidv4(),
              row.id,
              unitId,
              topic.t,
              JSON.stringify(topic.s),
              JSON.stringify([coCode(unit.n)]),
              blooms[i % blooms.length],
              (i % 2) + 1
            );
            counts.syllabus++;
          });
        }
      }
    }

    for (const subject of SUBJECTS) {
      if (subject.is_lab) continue;
      for (const branch of subject.branch === 'COMMON' ? ['EC', 'ICT'] : [subject.branch]) {
        const subjectRow = db
          .prepare('SELECT id FROM subjects WHERE code = ? AND branch = ? AND semester = ?')
          .get(subject.code, branch, subject.semester);
        if (!subjectRow) continue;
        const full = Object.assign({}, subject, { id: subjectRow.id });
        const questions = buildQuestionsForSubject(full, unitById);
        for (const q of questions) {
          insertQuestion.run(
            uuidv4(),
            full.id,
            q.unit_id,
            q.text,
            q.type,
            q.options,
            q.answer,
            q.explanation,
            q.marks,
            q.difficulty,
            q.bloom,
            q.co,
            q.source
          );
          counts.questions++;
        }
        const pyqs = buildPyqsForSubject(full, questions, unitById);
        for (const p of pyqs) {
          insertPyq.run(
            uuidv4(),
            p.subject_id,
            p.year,
            p.semester,
            p.exam_type,
            p.question_number,
            p.question_text,
            p.question_type,
            p.options,
            p.correct_answer,
            p.solution,
            p.marks,
            p.unit_id,
            p.co_code
          );
          counts.pyqs++;
        }
        const notes = buildNotesForSubject(full, unitById);
        for (const n of notes) {
          insertNote.run(
            uuidv4(),
            n.subject_id,
            n.unit_id,
            n.title,
            n.content,
            n.content_type,
            n.tags
          );
          counts.notes++;
        }
      }
    }

    for (const [code, experiments] of Object.entries(LABS)) {
      const rows = db.prepare('SELECT id FROM subjects WHERE code = ?').all(code);
      if (rows.length === 0) continue;
      for (const row of rows) {
        for (const exp of experiments) {
          insertLab.run(
            uuidv4(),
            row.id,
            exp.n,
            exp.title,
            exp.aim,
            JSON.stringify(exp.apparatus || []),
            exp.theory || '',
            exp.procedure.join('\n'),
            exp.observations || '',
            exp.calculations || '',
            exp.result || '',
            JSON.stringify(exp.viva || []),
            JSON.stringify(exp.precautions || []),
            exp.reference_material || ''
          );
          counts.labs++;
        }
      }
    }

    for (const project of projects) {
      insertProject.run(
        uuidv4(),
        project.branch,
        project.semester,
        project.title,
        project.type,
        project.description,
        JSON.stringify(project.objectives || []),
        JSON.stringify(project.technologies || []),
        project.prerequisites || '',
        project.timeline_weeks || 0,
        JSON.stringify(project.deliverables || []),
        project.difficulty || 'Beginner',
        project.github_url || '',
        project.report_url || ''
      );
      counts.projects++;
    }

    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
      SEED_KEY,
      new Date().toISOString()
    );
  });

  tx();

  console.log('Seed complete (GTU 2024-25):');
  for (const [key, value] of Object.entries(counts)) {
    console.log(`  ${key}: ${value}`);
  }
  db.close();
}

run();
