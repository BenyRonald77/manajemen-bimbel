const $ = (id) => document.getElementById(id);
async function jget(u) { return (await fetch(u)).json(); }

function hariIni() { return new Date().toISOString().slice(0, 10); }

async function muat() {
  const tgl = hariIni();
  $("tgl").textContent = tgl;
  const s = await jget(`/api/sessions?tanggal=${tgl}`);
  $("s-total").textContent = s.length;
  $("s-hadir").textContent = s.filter((x) => x.status === "hadir").length;
  $("s-todo").textContent = s.filter((x) => x.status === "terjadwal").length;
  document.querySelector("#tbl tbody").innerHTML = s.map((x) =>
    `<tr><td>${x.jam_mulai}–${x.jam_selesai}</td><td>${x.nama_mapel}</td>
     <td>${x.nama_tutor}</td><td>${x.nama_siswa}</td>
     <td><span class="badge b-${x.status}">${x.status}</span></td>
     <td><a href="/sesi">Presensi →</a></td></tr>`).join("");
}
muat();
