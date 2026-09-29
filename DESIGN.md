# DESIGN.md — Manajemen Bimbel

## Keputusan desain

- **Jadwal = pola mingguan, sesi = kejadian konkret.** `schedules` menyimpan
  pola (hari, jam, rentang tanggal); `sessions` di-generate per tanggal via
  `POST /schedules/<id>/generate` dengan `INSERT OR IGNORE` sehingga
  idempoten (UNIQUE di `schedule_id, tanggal`).
- **Deteksi bentrok di level aplikasi**, bukan constraint DB: jadwal baru/
  ubahan ditolak 409 bila hari sama + jam tumpang tindih + periode tanggal
  beririsan + tutor ATAU siswa sama. Pesan error menyebut jadwal pembentrok.
- **Presensi per sesi**: status `terjadwal`/`hadir`/`tidak_hadir`/`batal`
  plus `materi` dan `catatan` perkembangan per sesi.
- **Honor** = `tarif_per_sesi` × sesi `hadir` dalam bulan (filter
  `substr(tanggal,1,7)`), dihitung on-the-fly tanpa tabel rekap.
- **Rapor** dihitung on-the-fly dari sesi pada rentang tanggal; halaman
  `/siswa/<id>/rapor` ramah cetak (tombol print, CSS `@media print`).
- **Hapus jadwal** diblokir bila sudah ada sesi tercatat (non-`terjadwal`);
  sesi yang masih `terjadwal` ikut terhapus.

## Batasan yang disadari

- Satu sesi = satu tutor + satu siswa (les privat / semi-privat kecil).
  Kelas grup besar butuh model peserta jamak — di luar cakupan.
- Tidak ada autentikasi; cocok untuk intranet/lokal admin bimbel.
