const $ = (id) => document.getElementById(id);
const rp = (n) => "Rp" + n.toLocaleString("id-ID");
async function jget(u) { return (await fetch(u)).json(); }
async function jpost(u, b) {
  const r = await fetch(u, {method: "POST",
    headers: {"Content-Type": "application/json"}, body: JSON.stringify(b || {})});
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "gagal");
  return d;
}

async function muat() {
  const bulan = $("bulan").value || new Date().toISOString().slice(0, 7);
  const d = await jget(`/api/honor?bulan=${bulan}`);
  document.querySelector("#tbl tbody").innerHTML = d.honor.map((h) =>
    `<tr><td>${h.nama}</td><td>${rp(h.tarif_per_sesi)}</td><td>${h.sesi_hadir}</td>
     <td><b>${rp(h.total_honor)}</b></td></tr>`).join("");
  $("grand").textContent = "Total: " + rp(d.grand_total);
}

$("lihat").onclick = muat;
$("t-tambah").onclick = async () => {
  const nama = $("t-nama").value.trim();
  const tarif = parseInt($("t-tarif").value);
  if (!nama || !(tarif >= 0)) return alert("Nama dan tarif wajib diisi");
  await jpost("/api/tutors", {nama, no_hp: $("t-hp").value.trim(), tarif_per_sesi: tarif});
  $("t-nama").value = ""; $("t-hp").value = ""; $("t-tarif").value = "";
  muat();
};
$("bulan").value = new Date().toISOString().slice(0, 7);
muat();
