CREATE TABLE IF NOT EXISTS tutors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  no_hp TEXT,
  tarif_per_sesi INTEGER NOT NULL CHECK (tarif_per_sesi >= 0)
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  no_hp_ortu TEXT,
  jenjang TEXT CHECK (jenjang IN ('SD','SMP','SMA'))
);

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tutor_id INTEGER NOT NULL REFERENCES tutors(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  hari TEXT NOT NULL
    CHECK (hari IN ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')),
  jam_mulai TEXT NOT NULL,
  jam_selesai TEXT NOT NULL,
  tanggal_mulai TEXT NOT NULL,
  tanggal_selesai TEXT NOT NULL,
  catatan TEXT,
  CHECK (jam_selesai > jam_mulai),
  CHECK (tanggal_selesai >= tanggal_mulai)
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  tanggal TEXT NOT NULL,
  jam_mulai TEXT NOT NULL,
  jam_selesai TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'terjadwal'
    CHECK (status IN ('terjadwal','hadir','tidak_hadir','batal')),
  materi TEXT,
  catatan TEXT,
  UNIQUE (schedule_id, tanggal)
);

CREATE INDEX IF NOT EXISTS idx_schedules_tutor ON schedules(tutor_id, hari);
CREATE INDEX IF NOT EXISTS idx_schedules_student ON schedules(student_id, hari);
CREATE INDEX IF NOT EXISTS idx_sessions_tanggal ON sessions(tanggal);
CREATE INDEX IF NOT EXISTS idx_sessions_schedule ON sessions(schedule_id);
