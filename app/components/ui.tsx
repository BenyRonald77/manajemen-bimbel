const STATUS_COLORS: Record<string, string> = {
  terjadwal: "bg-slate-200 text-slate-700",
  hadir: "bg-green-100 text-green-800",
  tidak_hadir: "bg-red-100 text-red-800",
  batal: "bg-amber-100 text-amber-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || "bg-slate-200"}`}>
      {status}
    </span>
  );
}

export function TableShell({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {children}
    </section>
  );
}
