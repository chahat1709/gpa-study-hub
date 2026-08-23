const Database = require('better-sqlite3');
const db = new Database('gpa_hub.db');
const tables = [
  'subjects',
  'units',
  'syllabus',
  'question_banks',
  'pyqs',
  'notes',
  'labs',
  'projects',
  'student_progress',
];
for (const t of tables) {
  console.log(t, db.prepare('SELECT COUNT(*) c FROM ' + t).get().c);
}
console.log('--- EC sem3 subjects ---');
console.log(
  db.prepare("SELECT code, name, is_lab FROM subjects WHERE branch='EC' AND semester=3").all()
);
console.log('--- sample ELE201 questions ---');
console.log(
  db
    .prepare(
      "SELECT question_text, question_type, marks, difficulty, bloom_level FROM question_banks WHERE subject_id IN (SELECT id FROM subjects WHERE code='ELE201') LIMIT 5"
    )
    .all()
);
console.log('--- sample notes ---');
console.log(db.prepare('SELECT title, content_type FROM notes LIMIT 5').all());
console.log('--- sample pyq ---');
console.log(db.prepare('SELECT year, exam_type, question_text, marks FROM pyqs LIMIT 3').all());
console.log('--- sample lab ---');
console.log(
  db
    .prepare(
      'SELECT l.experiment_number, l.title, s.code FROM labs l JOIN subjects s ON s.id = l.subject_id LIMIT 5'
    )
    .all()
);
console.log('--- sample project ---');
console.log(
  db.prepare('SELECT title, branch, semester, type, difficulty FROM projects LIMIT 5').all()
);
db.close();
