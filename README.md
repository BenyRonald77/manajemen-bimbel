# Manajemen Bimbel & Les Privat

Jadwal tutor & siswa anti-bentrok, presensi per sesi, honor tutor otomatis,
dan rapor perkembangan untuk orang tua. Dibangun dengan Next.js 14 +
Prisma + SQLite.

## Cara Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Buka http://localhost:3000. Database SQLite (`prisma/dev.db`) dibuat dan
di-seed otomatis (seed hanya jalan bila tabel masih kosong).

## Halaman

- `/` — Dashboard: sesi hari ini + statistik kehadiran
- `/jadwal` — Jadwal mingguan, deteksi bentrok, generate sesi
- `/sesi` — Presensi per sesi (hadir/tidak_hadir/batal) + materi & catatan
- `/tutor` — Data tutor + honor per bulan
- `/siswa` — Data siswa + buka rapor perkembangan (bisa dicetak)

## API

- `GET/POST /api/tutors`, `PUT/DELETE /api/tutors/[id]`
- `GET/POST /api/students`, `PUT/DELETE /api/students/[id]`
- `GET/POST /api/subjects`, `PUT/DELETE /api/subjects/[id]`
- `GET/POST /api/schedules`, `PUT/DELETE /api/schedules/[id]`
- `POST /api/schedules/[id]/generate` — buat sesi dari jadwal mingguan
- `GET /api/sessions` — filter: tanggal, dari, sampai, schedule_id, student_id, tutor_id
- `POST /api/sessions/[id]/attend` — tandai kehadiran
- `GET /api/honor?bulan=YYYY-MM` — honor tutor per bulan
- `GET /api/students/[id]/rapor?dari=&sampai=` — rapor perkembangan

## Aturan Bisnis

1. Jadwal baru/ubah ditolak (409) bila bentrok: hari sama, jam tumpang
   tindih, periode tanggal beririsan, dan melibatkan tutor atau siswa yang sama.
2. Generate sesi idempoten — sesi yang sudah ada tidak diduplikasi.
3. Honor tutor per bulan = tarif_per_sesi × jumlah sesi `hadir`.
4. Jadwal yang sudah punya sesi tercatat (selain `terjadwal`) tidak bisa dihapus.

## Struktur

```
├── PRD.md
├── DESIGN.md
├── package.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── lib/
│   ├── prisma.ts
│   ├── format.ts
│   ├── bimbel.ts   # validasi jadwal, deteksi bentrok, generate, honor, rapor
│   └── api.ts      # helper error/response API
└── app/
    ├── layout.tsx
    ├── page.tsx            # dashboard
    ├── jadwal/page.tsx
    ├── sesi/page.tsx
    ├── tutor/page.tsx
    ├── siswa/page.tsx
    ├── siswa/[id]/rapor/page.tsx
    └── api/...             # API routes
```
