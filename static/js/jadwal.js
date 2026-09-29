const $ = (id) => document.getElementById(id);
async function jget(u) { return (await fetch(u)).json(); }
async function jpost(u, b) {
  const r = await fetch(u, {method: "POST",
    headers: {"Content-Type": "application/json"}, body: JSON.stringify(b || {})});
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "gagal");
  return d;
}
const opt = (arr, f) => arr.map((x) => `<option value="${x.id}">${x[f]}</option>`).join("");

async function muat() {
  const [tutors, students, subjects, jd] = await Promise.all([
    jget("/api/tutors"), jget("/api/students"), jget("/api/subjects"), jget("/api/schedules")]);
  $("f-tutor").innerHTML = opt(tutors, "nama");
  $("f-siswa").innerHTML = opt(students, "nama");
  $("f-mapel").innerHTML = opt(subjects, "nama");
  document.querySelector("#tbl tbody").innerHTML = jd.map((j) =>
    `<tr><td>${j.hari}</td><td>${j.jam_mulai}–${j.jam_selesai}</td><td>${j.nama_mapel}</td>
     <td>${j.nama_tutor}</td><td>${j.nama_siswa}</td>
     <td><small>${j.tanggal_mulai} → ${j.tanggal_selesai}</small></td>
     <td><button class="ghost" onclick="gen(${j.id})">Generate</button>
         <button class="ghost" onclick="hapus(${j.id})">Hapus</button></td></tr>`).join("");
}

async function gen(id) {
  const d = await jpost(`/api/schedules/${id}/generate`);
  alert(`${d.dibuat} sesi dibuat.`);
}
async function hapus(id) {
  if (!confirm("Hapus jadwal ini?")) return;
  try { await fetch(`/api/schedules/${id}`, {method: "DELETE"}).then(async (r) => {
    if (!r.ok) throw new Error((await r.json()).error);
  }); muat(); } catch (e) { alert(e.message); }
}

$("f-tambah").onclick = async () => {
  $("f-msg").textContent = "";
  try {
    await jpost("/api/schedules", {
      tutor_id: parseInt($("f-tutor").value),
      student_id: parseInt($("f-siswa").value),
      subject_id: parseInt($("f-mapel").value),
      hari: $("f-hari").value,
      jam_mulai: $("f-mulai").value, jam_selesai: $("f-selesai").value,
      tanggal_mulai: $("f-dari").value, tanggal_selesai: $("f-sampai").value,
    });
    $("f-msg").textContent = "Jadwal tersimpan.";
    muat();
  } catch (e) { $("f-msg").textContent = "Gagal: " + e.message; }
};
$("f-generate").onclick = async () => {
  $("f-msg").textContent = "";
  try {
    await jpost("/api/schedules", {
      tutor_id: parseInt($("f-tutor").value),
      student_id: parseInt($("f-siswa").value),
      subject_id: parseInt($("f-mapel").value),
      hari: $("f-hari").value,
      jam_mulai: $("f-mulai").value, jam_selesai: $("f-selesai").value,
      tanggal_mulai: $("f-dari").value, tanggal_selesai: $("f-sampai").value,
    });
    const jd = await jget("/api/schedules");
    const baru = jd[jd.length - 1];
    const d = await jpost(`/api/schedules/${baru.id}/generate`);
    $("f-msg").textContent = `Jadwal tersimpan, ${d.dibuat} sesi dibuat.`;
    muat();
  } catch (e) { $("f-msg").textContent = "Gagal: " + e.message; }
};

const t = new Date().toISOString().slice(0, 10);
$("f-dari").value = t;
$("f-sampai").value = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
muat();
