import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Eye, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import { api, errMsg } from "@/lib/api";
import { rp, num, fdate, whName, qtyUnit, todayStr, RECEIVE_STATUSES } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, Sel, Empty } from "@/components/common";
import { PODetail } from "@/components/purchases/PODetail";
import { PODialog } from "@/components/purchases/PODialog";
import { useDocs } from "@/components/docs/useDocs";
import { useSort } from "@/components/SortTh";

const BADGE = {
  Draft: ["Draft", "bg-slate-500/15 text-slate-300 border-slate-500/40"],
  "Dalam Proses": ["Dalam Proses", "bg-sky-500/15 text-sky-300 border-sky-500/40"],
  "Barang Diterima": ["Diterima", "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"],
  "Barang Belum Lengkap": ["Belum Lengkap", "bg-orange-500/15 text-orange-300 border-orange-500/40"],
  "Barang Direject Semua": ["Rejected", "bg-red-500/15 text-red-300 border-red-500/40"],
  Dibatalkan: ["Canceled", "bg-red-500/15 text-red-300 border-red-500/40 line-through"],
};

export const StatusBadge = ({ status, testid }) => {
  const [label, cls] = BADGE[status] || [status || "-", BADGE.Draft[1]];
  return <span data-testid={testid} className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 font-mono text-[11px] ${cls}`}>{label}</span>;
};

const RECV = {
  full: ["Barang Lengkap", "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"],
  partial: ["Diterima Parsial", "bg-orange-500/15 text-orange-300 border-orange-500/40"],
  none: ["Belum Diterima", "bg-slate-500/15 text-slate-300 border-slate-500/40"],
};
export const receiptState = (p) => {
  const qty = (p.items || []).reduce((a, i) => a + Number(i.qty || 0), 0);
  const got = (p.items || []).reduce((a, i) => a + Number(i.received_qty || 0), 0);
  return got <= 0 ? "none" : got >= qty ? "full" : "partial";
};
export const receiptDate = (p) => p.received_date
  || [...(p.status_log || [])].reverse().find((l) => ["Barang Diterima", "Barang Belum Lengkap"].includes(l.status))?.date?.slice(0, 10) || null;

const DAY = 86400000;
export const poEta = (p) => p.eta_date || (/^\d{4}-\d{2}-\d{2}$/.test(p.delivery_date || "") ? p.delivery_date : null);
export const poLateDays = (p) => {
  const eta = poEta(p);
  if (!eta || p.voided || p.cancel_status === "CANCELED" || ["Barang Direject Semua", "Dibatalkan"].includes(p.receive_status) || receiptState(p) === "full") return 0;
  const diff = Math.floor((new Date(`${todayStr()}T00:00:00`) - new Date(`${eta}T00:00:00`)) / DAY);
  return diff > 0 ? diff : 0;
};

function ReceiptCell({ p, i }) {
  const st = receiptState(p);
  const [label, cls] = RECV[st];
  const d = st !== "none" && receiptDate(p);
  const late = poLateDays(p);
  const eta = poEta(p);
  return (
    <td className="w-px whitespace-nowrap">
      <span data-testid={`po-row-receipt-${i}`} className={`inline-block rounded border px-2 py-0.5 font-mono text-[11px] ${cls}`}>{label}</span>
      {late > 0 && <span data-testid={`po-row-late-${i}`} className="ml-1 inline-flex items-center gap-1 rounded border border-red-500/60 bg-red-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-red-300"><AlertTriangle className="h-3 w-3" /> TERLAMBAT {late} HR</span>}
      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground" data-testid={`po-row-receipt-date-${i}`}>
        {d ? `Diterima: ${fdate(d)}` : eta ? <span className={late ? "text-red-300" : ""}>ETA: {fdate(eta)}</span> : "—"}
      </div>
    </td>
  );
}

const summary = (items = []) => {
  if (!items.length) return "-";
  const f = items[0];
  const first = `${num(f.qty)} ${qtyUnit(f)} ${f.name}`;
  return items.length > 1 ? `${first} +${items.length - 1} item` : first;
};

function PORow({ p, i, isAdmin, warehouses, onOpen, onPrint, onEdit, onVoid }) {
  return (
    <tr data-testid={`po-row-${i}`} className={`cursor-pointer ${poLateDays(p) ? "bg-red-500/10 shadow-[inset_3px_0_0_0_rgb(239_68_68)] hover:bg-red-500/15" : ""}`} onClick={() => onOpen(p)}>
      <td className="w-px whitespace-nowrap">
        <span className="font-mono font-semibold text-orange-300" data-testid={`po-row-number-${i}`}>{p.po_no}</span>
        <span className="font-mono text-xs text-muted-foreground"> | {fdate(p.date)}</span>
      </td>
      <td className="w-px whitespace-nowrap">{p.supplier_name}</td>
      <td className="w-px whitespace-nowrap text-xs">{whName(warehouses, p.warehouse)}</td>
      <td className="min-w-[180px] max-w-[260px]">
        <div className="line-clamp-2 text-xs leading-snug" title={(p.items || []).map((it) => `${num(it.qty)} ${qtyUnit(it)} ${it.name}`).join("\n")}>{summary(p.items)}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          {p.type === "indent" && <span className="truncate">Indent · {p.customer_name}</span>}
          {(p.items || []).length > 1 && <button type="button" className="shrink-0 text-orange-300 underline-offset-2 hover:underline" data-testid={`po-row-items-more-${i}`} onClick={(e) => { e.stopPropagation(); onOpen(p); }}>Lihat Detail</button>}
        </div>
      </td>
      <td className="w-px whitespace-nowrap"><StatusBadge status={p.receive_status} testid={`po-row-status-${i}`} /></td>
      <ReceiptCell p={p} i={i} />
      {isAdmin && <td className="num w-px" data-testid={`po-row-total-${i}`}>{rp(p.total)}</td>}
      <td className="w-px whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" className="h-7 gap-1 px-2" data-testid={`po-detail-btn-${i}`} onClick={() => onOpen(p)}><Eye className="h-3.5 w-3.5" /> Detail/Terima</Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" title="Cetak PO" data-testid={`po-print-${i}`} onClick={() => onPrint(p)}><Printer className="h-3.5 w-3.5" /></Button>
        {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit PO" data-testid={`po-edit-${i}`} onClick={() => onEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>}
        {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" title="Void / Hapus" data-testid={`po-void-${i}`} onClick={() => onVoid(p)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>}
      </td>
      <td className="w-full p-0" aria-hidden />
    </tr>
  );
}

export default function Purchases() {
  const { isAdmin } = useAuth();
  const { suppliers, warehouses } = useData();
  const { printPO } = useDocs();
  const [fl, setFl] = useState({ q: "", supplier_id: "", status: "", type: "", date_from: "", date_to: "" });
  const [data, setData] = useState({ items: [], summary: {} });
  const [sel, setSel] = useState(null);
  const [dlg, setDlg] = useState(null);
  const set = (k, v) => setFl({ ...fl, [k]: v });
  const [lateOnly, setLateOnly] = useState(false);
  const lateCount = data.items.filter((p) => poLateDays(p) > 0).length;
  const { sorted, th } = useSort(lateOnly ? data.items.filter((p) => poLateDays(p) > 0) : data.items, {
    date: (p) => `${p.date} ${p.po_no}`, supplier: (p) => p.supplier_name, warehouse: (p) => whName(warehouses, p.warehouse),
    items: (p) => summary(p.items), status: (p) => p.receive_status,
    late: (p) => poLateDays(p),
    receipt: (p) => `${["none", "partial", "full"].indexOf(receiptState(p))} ${receiptDate(p) || ""}`, total: (p) => Number(p.total || 0),
  }, { id: "po" });

  const load = useCallback(() => api.get("/purchases", { params: fl }).then((r) => {
    setData(r.data);
    setSel((cur) => (cur ? r.data.items.find((p) => p.id === cur.id) || null : null));
  }).catch((e) => toast.error(errMsg(e))), [fl]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const voidPO = async (po) => {
    if (!window.confirm(`Void / hapus PO ${po.po_no}? Stok yang sudah masuk akan dikoreksi.`)) return;
    try { await api.post(`/purchases/${po.id}/void`); toast.success("PO di-void"); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Pembelian / PO Pabrik" subtitle={isAdmin ? "Purchasing & Utang Dagang" : "Status Tracking"}>
        {isAdmin && <Button className="gap-2 h-11" data-testid="po-create-button" onClick={() => setDlg({ po: null })}><Plus className="h-4 w-4" /> Buat PO / Pembelian Manual</Button>}
      </PageHeader>
      <div className="panel p-3 mb-3 grid gap-2 grid-cols-2 md:grid-cols-6" data-testid="po-filters">
        <div className="relative col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input data-testid="po-search-input" className="pl-9" placeholder="Cari No PO, nota, konsumen..." value={fl.q} onChange={(e) => set("q", e.target.value)} /></div>
        <Sel testid="po-supplier-filter" value={fl.supplier_id} onChange={(v) => set("supplier_id", v)} placeholder="Semua Supplier" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
        <Sel testid="po-status-filter" value={fl.status} onChange={(v) => set("status", v)} placeholder="Semua Status" options={["Draft", ...RECEIVE_STATUSES]} />
        <Input type="date" data-testid="po-date-from" value={fl.date_from} onChange={(e) => set("date_from", e.target.value)} />
        <Input type="date" data-testid="po-date-to" value={fl.date_to} onChange={(e) => set("date_to", e.target.value)} />
      </div>
      {lateCount > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm" data-testid="po-late-alert">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span><b className="text-red-300">{lateCount} PO terlambat</b> — sudah lewat rencana kirim pabrik tapi barang belum diterima lengkap.</span>
          <button type="button" data-testid="po-late-filter" onClick={() => setLateOnly(!lateOnly)}
            className={`ml-auto rounded border px-3 py-1 font-mono text-xs ${lateOnly ? "border-red-500 bg-red-500/25 text-red-200" : "border-red-500/50 text-red-300 hover:bg-red-500/15"}`}>
            {lateOnly ? "Tampilkan Semua PO" : "Hanya PO Terlambat"}
          </button>
        </div>
      )}
      <div className="panel overflow-hidden">
        <div className="max-h-[70vh] overflow-auto" data-testid="po-list">
          <table className="dtable dtable-compact">
            <thead><tr>
              {th("date", "No. PO | Tanggal")}{th("supplier", "Supplier / Pabrik")}{th("warehouse", "Gudang Tujuan")}{th("items", "Ringkasan Item & Qty")}{th("status", "Status")}{th("receipt", "Penerimaan Barang")}
              {isAdmin && th("total", "Total PO", "text-right")}<th className="text-right">Aksi</th><th className="w-full p-0" aria-hidden />

            </tr></thead>
            <tbody>
              {sorted.map((p, i) => (
                <PORow key={p.id} p={p} i={i} isAdmin={isAdmin} warehouses={warehouses} onOpen={setSel} onPrint={printPO}
                  onEdit={(po) => setDlg({ po })} onVoid={voidPO} />
              ))}
            </tbody>
          </table>
          {!data.items.length && <Empty text="Belum ada PO" />}
        </div>
        <div className="border-t-2 border-primary/60 bg-secondary/60 px-3 py-2 font-mono text-sm" data-testid="po-summary">
          {lateCount > 0 && <span className="mr-2 text-red-300">{lateCount} PO terlambat ·</span>}
          {data.summary.count} PO{isAdmin && ` · Total ${rp(data.summary.total)} · Utang ${rp(data.summary.debt)}`}
        </div>
      </div>
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto" data-testid="po-detail-modal">
          <DialogHeader><DialogTitle className="font-heading text-2xl uppercase">Rincian PO</DialogTitle></DialogHeader>
          {sel && <PODetail po={sel} onChanged={(p) => { if (!p) setSel(null); load(); }} onEdit={(p) => { setSel(null); setDlg({ po: p }); }} />}
        </DialogContent>
      </Dialog>
      <PODialog open={!!dlg} po={dlg?.po} onClose={() => setDlg(null)} onSaved={() => load()} />
    </div>
  );
}
