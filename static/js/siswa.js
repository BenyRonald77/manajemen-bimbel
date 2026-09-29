const $ = (id) => document.getElementById(id);
async function jget(u) { return (await fetch(u)).json(); }
async function jpost(u, b) {
  const r = await fetch(u, {method: "POST",
    headers: {"Content-Type": "application/json"}, body: JSON.stringify(b || {})});
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "gagal");
  return d;
}

async function muat() {
  const s = await jget("/api/students");
  document.querySelector("#tbl tbody").innerHTML = s.map((x) =>
    `<tr><td>${x.nama}</td><td>${x.jenjang || ""}</td><td>${x.no_hp_ortu || ""}</td>
     <td><button class="ghost" onclick="rapor(${x.id})">Rapor</button></td></tr>`).join("");
  $("r-siswa").innerHTML = s.map((x) => `<option value="${x.id}">${x.nama}</option>`).join("");
}

function rapor(id) {
  const dari = $("r-dari").value, sampai = $("r-sampai").value;
  window.open(`/siswa/${id}/rapor?dari=${dari}&sampai=${sampai}`, "_blank");
}

$("s-tambah").onclick = async () => {
  const nama = $("s-nama").value.trim();
  if (!nama) return alert("Nama wajib diisi");
  await jpost("/api/students", {nama, no_hp_ortu: $("s-hp").value.trim(), jenjang: $("s-jenjang").value});
  $("s-nama").value = ""; $("s-hp").value = "";
  muat();
};
$("r-buka").onclick = () => rapor($("r-siswa").value);

const t = new Date().toISOString().slice(0, 10);
$("r-dari").value = t.slice(0, 8) + "01";
$("r-sampai").value = t;
muat();
