"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/jadwal", label: "Jadwal" },
  { href: "/sesi", label: "Sesi" },
  { href: "/tutor", label: "Tutor" },
  { href: "/siswa", label: "Siswa" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="bg-indigo-700 text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
        <Link href="/" className="mr-4 text-lg font-bold">📚 BimbelKu</Link>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded px-3 py-1.5 text-sm ${
              path === l.href ? "bg-indigo-900 font-semibold" : "hover:bg-indigo-600"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
