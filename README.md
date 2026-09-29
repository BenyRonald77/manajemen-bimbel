# Manajemen Bimbel & Les Privat

Jadwal tutor & siswa anti-bentrok, presensi per sesi, honor tutor otomatis,
dan rapor perkembangan untuk orang tua.

## Cara Menjalankan

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Buka http://localhost:5000. Database SQLite dibuat otomatis dan di-seed saat
pertama dijalankan.

## Struktur

```
├── PRD.md
├── DESIGN.md
├── requirements.txt
├── app.py
├── bimbel/
│   ├── __init__.py
│   ├── db.py
│   ├── schema.sql
│   ├── seed.sql
│   ├── api.py        # CRUD tutors, students, subjects
│   ├── schedule.py   # jadwal + deteksi bentrok + generate sesi
│   ├── attendance.py # presensi per sesi
│   └── report.py     # honor tutor + rapor siswa
├── static/
└── templates/
```

## Alur Kerja

1. Daftarkan tutor (dengan tarif/sesi), siswa, dan mapel.
2. Buat jadwal mingguan — sistem menolak bila tutor/siswa bentrok.
3. Generate sesi untuk periode berjalan, tandai presensi tiap sesi.
4. Lihat honor tutor per bulan dan cetak rapor per siswa.
