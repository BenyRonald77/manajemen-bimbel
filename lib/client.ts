export async function apiGet<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error || "gagal");
  return r.json() as Promise<T>;
}

export async function apiSend<T>(url: string, method: string, body?: unknown): Promise<T> {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const d = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(d.error || "gagal");
  return d as T;
}

export const apiPost = <T,>(url: string, body?: unknown) => apiSend<T>(url, "POST", body);
export const apiPut = <T,>(url: string, body?: unknown) => apiSend<T>(url, "PUT", body);
export const apiDel = <T,>(url: string) => apiSend<T>(url, "DELETE");

export const inputCls =
  "rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
export const btnCls =
  "rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700";
export const btnGhostCls =
  "rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100";
