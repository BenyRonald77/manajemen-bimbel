import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const n = await prisma.tutor.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }
  await prisma.tutor.createMany({
    data: [
      { nama: "Pak Hendra", noHp: "081211110001", tarifPerSesi: 75000 },
      { nama: "Bu Maya", noHp: "081211110002", tarifPerSesi: 80000 },
      { nama: "Pak Doni", noHp: "081211110003", tarifPerSesi: 70000 },
    ],
  });
  await prisma.student.createMany({
    data: [
      { nama: "Rani Wijaya", noHpOrtu: "081322220001", jenjang: "SMA" },
      { nama: "Bagas Pratama", noHpOrtu: "081322220002", jenjang: "SMP" },
      { nama: "Salsa Nabila", noHpOrtu: "081322220003", jenjang: "SD" },
    ],
  });
  await prisma.subject.createMany({
    data: [
      { nama: "Matematika" },
      { nama: "Fisika" },
      { nama: "Bahasa Inggris" },
      { nama: "Kimia" },
    ],
  });
  console.log("seed selesai");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
