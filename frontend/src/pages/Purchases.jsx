import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import { api, errMsg } from "@/lib/api";
import { rp, num, fdate, whName, qtyUnit, RECEIVE_STATUSES } from "@/lib/format";
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

const summary = (items = []) => {
  if (!items.length) return "-";
  const f = items[0];
  const first = `${num(f.qty)} ${qtyUnit(f)} ${f.name}`;
  return items.length > 1 ? `${first} +${items.length - 1} item` : first;
};

function PORow({ p, i, isAdmin, warehouses, onOpen, onPrint, onEdit, onVoid }) {
  return (
    <tr data-testid={`po-row-${i}`} className="cursor-pointer" onClick={() => onOpen(p)}>
      <td className="w-px whitespace-nowrap">
        <span className="font-mono font-semibold text-orange-300" data-testid={`po-row-number-${i}`}>{p.po_no}</span>
        <span className="font-mono text-xs text-muted-foreground"> | {fdate(p.date)}</span>
      </td>
      <td className="w-px whitespace-nowrap">{p.supplier_name}</td>
      <td className="w-px whitespace-nowrap text-xs">{whName(warehouses, p.warehouse)}</td>
      <td className="w-full min-w-[200px]">
        <div className="line-clamp-1" title={(p.items || []).map((it) => `${num(it.qty)} ${qtyUnit(it)} ${it.name}`).join("\n")}>{summary(p.items)}</div>
        {p.type === "indent" && <div className="text-[11px] text-muted-foreground">Indent · {p.customer_name}</div>}
      </td>
      <td className="w-px whitespace-nowrap"><StatusBadge status={p.receive_status} testid={`po-row-status-${i}`} /></td>
      {isAdmin && <td className="num w-px" data-testid={`po-row-total-${i}`}>{rp(p.total)}</td>}
      <td className="w-px whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" className="h-7 gap-1 px-2" data-testid={`po-detail-btn-${i}`} onClick={() => onOpen(p)}><Eye className="h-3.5 w-3.5" /> Detail/Terima</Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" title="Cetak PO" data-testid={`po-print-${i}`} onClick={() => onPrint(p)}><Printer className="h-3.5 w-3.5" /></Button>
        {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit PO" data-testid={`po-edit-${i}`} onClick={() => onEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>}
        {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" title="Void / Hapus" data-testid={`po-void-${i}`} onClick={() => onVoid(p)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>}
      </td>
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
  const { sorted, th } = useSort(data.items, {
    date: (p) => `${p.date} ${p.po_no}`, supplier: (p) => p.supplier_name, warehouse: (p) => whName(warehouses, p.warehouse),
    items: (p) => summary(p.items), status: (p) => p.receive_status, total: (p) => Number(p.total || 0),
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
      <div className="panel overflow-hidden">
        <div className="max-h-[70vh] overflow-auto" data-testid="po-list">
          <table className="dtable dtable-compact">
            <thead><tr>
              {th("date", "No. PO | Tanggal")}{th("supplier", "Supplier / Pabrik")}{th("warehouse", "Gudang Tujuan")}{th("items", "Ringkasan Item & Qty")}{th("status", "Status")}
              {isAdmin && th("total", "Total PO", "text-right")}<th className="text-right">Aksi</th>
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
