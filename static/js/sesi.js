const $ = (id) => document.getElementById(id);
let sesiAktif = null;
async function jget(u) { return (await fetch(u)).json(); }
async function jpost(u, b) {
  const r = await fetch(u, {method: "POST",
    headers: {"Content-Type": "application/json"}, body: JSON.stringify(b || {})});
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "gagal");
  return d;
}
function hariIni() { return new Date().toISOString().slice(0, 10); }

async function muat() {
  const tgl = $("tgl").value || hariIni();
  const s = await jget(`/api/sessions?tanggal=${tgl}`);
  document.querySelector("#tbl tbody").innerHTML = s.map((x) =>
    `<tr><td>${x.jam_mulai}–${x.jam_selesai}</td><td>${x.nama_mapel}</td>
     <td>${x.nama_tutor}</td><td>${x.nama_siswa}</td>
     <td><span class="badge b-${x.status}">${x.status}</span></td>
     <td><small>${x.materi || ""}</small></td>
     <td><button class="ghost" onclick='buka(${x.id},"${x.nama_siswa} — ${x.nama_mapel}")'>Presensi</button></td></tr>`).join("");
}

function buka(id, judul) {
  sesiAktif = id;
  $("p-judul").textContent = judul;
  $("p-materi").value = ""; $("p-catatan").value = "";
  $("modal").classList.remove("hidden");
}

document.querySelectorAll("#modal button[data-st]").forEach((b) => {
  b.onclick = async () => {
    await jpost(`/api/sessions/${sesiAktif}/attend`, {
      status: b.dataset.st,
      materi: $("p-materi").value, catatan: $("p-catatan").value,
    });
    $("modal").classList.add("hidden");
    muat();
  };
});
$("p-tutup").onclick = () => $("modal").classList.add("hidden");
$("lihat").onclick = muat;
$("tgl").value = hariIni();
muat();
