import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Search, Truck } from "lucide-react";
import { api, errMsg } from "@/lib/api";
import { num, fdate, todayStr, qtyUnit, STATUS, TBA } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader, Sel, Empty } from "@/components/common";
import { DeliveryDialog } from "@/components/sales/SaleDialogs";
import { useSort } from "@/components/SortTh";

const SHIP = {
  none: ["Belum Dikirim", "bg-sky-500/15 text-sky-300 border-sky-500/40"],
  partial: ["Dikirim Parsial", "bg-orange-500/15 text-orange-300 border-orange-500/40"],
  done: ["Selesai", "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"],
};
const shipState = (s) => {
  const total = s.items.reduce((a, i) => a + Number(i.qty || 0), 0);
  const sent = s.items.reduce((a, i) => a + Number(i.delivered_qty || 0), 0);
  if (s.order_status === "close" || (total > 0 && sent >= total - 1e-9)) return "done";
  return sent > 0 ? "partial" : "none";
};
const itemSummary = (items = []) => items.map((i) => `${num(i.qty)} ${qtyUnit(i)} ${i.name}`);
const TABS = [["today", "Pengiriman Hari Ini"], ["tomorrow", "Pengiriman Besok"], ["range", "Rentang Tanggal"], ["tba", "TBA (Belum Dijadwalkan)"]];

function ShipBadge({ state, testid }) {
  const [label, cls] = SHIP[state];
  return <span data-testid={testid} className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 font-mono text-[11px] ${cls}`}>{label}</span>;
}

function StatusMenu({ s, i, onSet }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" data-testid={`delivery-status-btn-${i}`}>Update Status <ChevronDown className="h-3 w-3" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs">Status Pesanan</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(STATUS).map(([k, v]) => (
          <DropdownMenuItem key={k} data-testid={`delivery-status-${k}-${i}`} disabled={s.order_status === k} onClick={() => onSet(s, k)}>
            <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: v.color }} />{v.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeliveryRow({ s, i, onShip, onSet }) {
  const st = shipState(s);
  const lines = itemSummary(s.items);
  return (
    <tr data-testid={`delivery-row-${i}`}>
      <td className="w-px whitespace-nowrap">
        <div className="font-mono font-semibold text-orange-300" data-testid={`delivery-row-invoice-${i}`}>{s.invoice_no}</div>
        <div className="font-mono text-[11px] text-muted-foreground">Trx {fdate(s.date)}</div>
        <div className="font-mono text-[11px] text-sky-300">Kirim {fdate(s.delivery_date)}</div>
      </td>
      <td className="w-px whitespace-nowrap">
        <div className="font-medium">{s.customer?.name || "-"}</div>
        <div className="font-mono text-xs text-muted-foreground">{s.customer?.phone || "-"}</div>
      </td>
      <td className="min-w-[180px] max-w-[280px]">
        <div className="text-xs leading-snug">{s.delivery_address || s.customer?.address || "-"}</div>
        {s.notes && <div className="mt-0.5 text-[11px] italic text-yellow-300/90">Catatan: {s.notes}</div>}
      </td>
      <td className="w-full min-w-[200px]">
        <div className="line-clamp-2 text-xs" title={lines.join("\n")}>{lines[0]}{lines.length > 1 ? ` +${lines.length - 1} item` : ""}</div>
        <div className="mt-1 flex items-center gap-2">
          <ShipBadge state={st} testid={`delivery-row-status-${i}`} />
          {s.deliveries?.length > 0 && <span className="font-mono text-[10px] text-muted-foreground">{s.deliveries.length} rit</span>}
        </div>
      </td>
      <td className="w-px whitespace-nowrap text-right">
        <div className="flex justify-end gap-1">
          <Button size="sm" className="h-7 gap-1 px-2 text-xs" disabled={st === "done"} data-testid={`delivery-ship-btn-${i}`} onClick={() => onShip(s)}>
            <Truck className="h-3.5 w-3.5" /> Atur Pengiriman / SJ
          </Button>
          <StatusMenu s={s} i={i} onSet={onSet} />
        </div>
      </td>
    </tr>
  );
}

export default function Delivery() {
  const [tab, setTab] = useState("today");
  const [range, setRange] = useState({ from: todayStr(), to: todayStr(7) });
  const [q, setQ] = useState("");
  const [shipFl, setShipFl] = useState("");
  const [items, setItems] = useState([]);
  const [ship, setShip] = useState(null);

  const dates = tab === "today" ? [todayStr(), todayStr()] : tab === "tomorrow" ? [todayStr(1), todayStr(1)] : tab === "tba" ? [TBA, TBA] : [range.from, range.to];
  const load = useCallback(() => api.get("/sales", { params: { q, date_field: "delivery", date_from: dates[0], date_to: dates[1] } })
    .then((r) => setItems(r.data.items)).catch((e) => toast.error(errMsg(e))), [q, dates[0], dates[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const rows = items.filter((s) => !shipFl || shipState(s) === shipFl);
  const { sorted, th } = useSort(rows, {
    invoice: (s) => `${s.delivery_date || ""} ${s.invoice_no}`, customer: (s) => s.customer?.name, address: (s) => s.delivery_address || s.customer?.address,
    status: (s) => ["none", "partial", "done"].indexOf(shipState(s)),
  }, { id: "delivery" });
  const count = (k) => items.filter((s) => shipState(s) === k).length;

  const setStatus = async (s, st) => {
    try { await api.patch(`/sales/${s.id}/status`, { order_status: st }); toast.success(`${s.invoice_no} → ${STATUS[st].label}`); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Pengiriman / Delivery" subtitle="Jadwal antar, Surat Jalan parsial & status pengiriman" />
      <div className="panel mb-3 flex flex-wrap items-center gap-2 p-3" data-testid="delivery-filters">
        {TABS.map(([k, l]) => (
          <button key={k} data-testid={`delivery-tab-${k}`} onClick={() => setTab(k)} className={`pill h-10 px-4 ${tab === k ? "pill-on" : "bg-background"}`}>{l}</button>
        ))}
        {tab === "range" && (
          <div className="flex items-center gap-2">
            <Input type="date" className="h-10 w-40" data-testid="delivery-date-from" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
            <span className="text-muted-foreground">–</span>
            <Input type="date" className="h-10 w-40" data-testid="delivery-date-to" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </div>
        )}
        <div className="relative ml-auto min-w-[220px] flex-1 sm:max-w-xs"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input data-testid="delivery-search-input" className="h-10 pl-9" placeholder="Cari nota, pelanggan, alamat..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Sel testid="delivery-ship-filter" value={shipFl} onChange={setShipFl} placeholder="Semua Status" options={Object.entries(SHIP).map(([k, [l]]) => ({ value: k, label: l }))} />
      </div>
      <div className="panel overflow-hidden">
        <div className="max-h-[70vh] overflow-auto" data-testid="delivery-list">
          <table className="dtable dtable-compact">
            <thead><tr>{th("invoice", "No. Nota | Tanggal")}{th("customer", "Pelanggan & HP/WA")}{th("address", "Alamat & Catatan Kirim")}{th("status", "Item & Status Kirim")}<th className="text-right">Aksi</th></tr></thead>
            <tbody>{sorted.map((s, i) => <DeliveryRow key={s.id} s={s} i={i} onShip={setShip} onSet={setStatus} />)}</tbody>
          </table>
          {!sorted.length && <Empty text="Tidak ada jadwal pengiriman pada periode ini" />}
        </div>
        <div className="border-t-2 border-primary/60 bg-secondary/60 px-3 py-2 font-mono text-sm" data-testid="delivery-summary">
          {items.length} nota · Belum Dikirim {count("none")} · Parsial {count("partial")} · Selesai {count("done")}
        </div>
      </div>
      <DeliveryDialog sale={ship} onClose={() => setShip(null)} onDone={() => load()} />
    </div>
  );
}
