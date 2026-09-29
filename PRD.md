# PRD — Manajemen Bimbel & Les Privat

Sistem untuk bimbel/les privat: jadwal tutor & siswa dengan pencegahan
bentrok otomatis, presensi per sesi, honor tutor yang dihitung otomatis dari
jumlah sesi hadir, dan laporan perkembangan belajar untuk orang tua.

## Tujuan

Admin bisa menyusun jadwal les mingguan tanpa takut tutor/siswa double-book,
mencatat kehadiran tiap sesi beserta materi, melihat honor tiap tutor per
bulan secara otomatis, dan mencetak rapor perkembangan untuk orang tua.

## Stack

- Backend: TypeScript + Next.js 14 (App Router, API routes), Prisma 5 + SQLite
- Frontend: React + Tailwind CSS, halaman client-side tanpa build manual

## Model Data

- `tutors`: id, nama, no_hp, tarif_per_sesi
- `students`: id, nama, no_hp_ortu, jenjang (SD/SMP/SMA)
- `subjects`: id, nama
- `schedules`: id, tutor_id, student_id, subject_id, hari, jam_mulai,
  jam_selesai, tanggal_mulai, tanggal_selesai, catatan
- `sessions`: id, schedule_id, tanggal, jam_mulai, jam_selesai,
  status (`terjadwal`/`hadir`/`tidak_hadir`/`batal`), materi, catatan

## Aturan Bisnis

1. **Cegah bentrok**: jadwal baru ditolak (409) bila rentang jamnya tumpang
   tindih di hari yang sama untuk **tutor yang sama ATAU siswa yang sama**,
   selama periode tanggalnya juga beririsan.
2. **Generate sesi**: dari satu jadwal mingguan, sesi konkret dibuat untuk
   rentang tanggal (`/generate`); sesi yang sudah ada tidak diduplikasi.
3. **Presensi**: tiap sesi bisa ditandai `hadir`/`tidak_hadir`/`batal` plus
   materi & catatan perkembangan.
4. **Honor tutor**: per bulan = `tarif_per_sesi` × jumlah sesi berstatus
   `hadir` milik tutor tersebut dalam bulan itu.
5. **Rapor orang tua**: per siswa per periode — total sesi, kehadiran per
   mapel, daftar materi & catatan. Halaman cetak ramah printer.

## Tahap Pengerjaan

- **F0 — Fondasi**: PRD, README, struktur, requirements, .gitignore.
- **F1 — Database + API master**: schema, seed, CRUD tutors/students/subjects.
- **F2 — Penjadwalan**: CRUD schedules + deteksi bentrok + generate sessions.
- **F3 — Presensi**: tandai kehadiran per sesi + materi/catatan.
- **F4 — Honor + rapor + UI**: honor tutor per bulan, rapor cetak, dan UI
  lengkap (Dashboard, Jadwal, Sesi, Tutor, Siswa).

## Kriteria Selesai

- [ ] Jadwal bentrok (tutor/siswa, jam tumpang tindih) ditolak dengan pesan jelas
- [ ] Sesi bisa di-generate dari jadwal mingguan tanpa duplikat
- [ ] Presensi per sesi tercatat dengan materi
- [ ] Honor = tarif × sesi hadir, benar per bulan
- [ ] Rapor per siswa bisa dibuka/dicetak
- [ ] `npm install && npx prisma db push && npm run seed && npm run dev` langsung jalan

## Non-tujuan

- Payment gateway, aplikasi mobile, penjadwalan ruangan fisik.
