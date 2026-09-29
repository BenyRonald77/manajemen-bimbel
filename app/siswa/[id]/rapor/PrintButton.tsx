"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
    >
      🖨️ Cetak
    </button>
  );
}
