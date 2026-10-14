import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { api, errMsg } from "@/lib/api";
import { rp, num, fdate, todayStr } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Sel, Stat, Empty } from "@/components/common";
import EntityManager from "@/components/EntityManager";
import { useSort } from "@/components/SortTh";

const byKeys = (keys) => Object.fromEntries(keys.map((k) => [k, (x) => x?.[k]]));

const TT = { contentStyle: { background: "#111827", border: "1px solid #334155" }, formatter: (v) => rp(v) };
const useFetch = (path, params) => {
  const [d, setD] = useState(null);
  const key = JSON.stringify(params || {});
  const load = useCallback(() => api.get(path, { params: JSON.parse(key) }).then((r) => setD(r.data)).catch((e) => toast.error(errMsg(e))), [path, key]);
  useEffect(() => { load(); }, [load]);
  return d;
};

function Range({ r, setR, children }) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <Input type="date" className="w-auto" data-testid="report-date-from" value={r.date_from} onChange={(e) => setR({ ...r, date_from: e.target.value })} />
      <Input type="date" className="w-auto" data-testid="report-date-to" value={r.date_to} onChange={(e) => setR({ ...r, date_to: e.target.value })} />
      {children}
    </div>
  );
}

function PnL() {
  const [r, setR] = useState({ group: "day", date_from: todayStr(-30), date_to: todayStr() });
  const d = useFetch("/reports/pnl", r);
  const t = d?.total || {};
  const st = useSort(d?.rows, byKeys(["period", "count", "material", "bend", "hpp", "gross", "margin_pct", "ongkir", "expenses", "net"]), { id: "pnl" });
  return (
    <div data-testid="report-pnl">
      <Range r={r} setR={setR}><Sel testid="pnl-group-select" value={r.group} onChange={(v) => setR({ ...r, group: v })} options={[{ value: "day", label: "Harian" }, { value: "month", label: "Bulanan" }, { value: "year", label: "Tahunan" }]} /></Range>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <Stat label="Pendapatan Penjualan" value={rp(t.revenue)} testid="pnl-revenue" />
        <Stat label="HPP" value={rp(t.hpp)} tone="text-red-300" />
        <Stat label={`Laba Kotor (${num(t.margin_pct, 1)}%)`} value={rp(t.gross)} tone="text-emerald-400" testid="pnl-gross" />
        <Stat label="Pendapatan Ongkir" value={rp(t.ongkir)} tone="text-sky-300" />
        <Stat label="Laba Bersih" value={rp(t.net)} tone="text-orange-300" testid="pnl-net" sub={`Beban operasional ${rp(t.expenses)}`} />
      </div>
      <div className="panel p-3 h-72 mb-4">
        <ResponsiveContainer>
          <BarChart data={d?.rows || []}><CartesianGrid stroke="#1e293b" vertical={false} /><XAxis dataKey="period" stroke="#64748b" fontSize={11} /><YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${num(v / 1e6, 1)}jt`} />
            <Tooltip {...TT} /><Legend /><Bar dataKey="revenue" name="Pendapatan" fill="#EA580C" /><Bar dataKey="gross" name="Laba Kotor" fill="#22C55E" /><Bar dataKey="net" name="Laba Bersih" fill="#0284C7" /></BarChart>
        </ResponsiveContainer>
      </div>
      <div className="panel overflow-x-auto">
        <table className="dtable">
          <thead><tr>{st.th("period", "Periode")}{st.th("count", "Trx", "text-right")}{st.th("material", "Material", "text-right")}{st.th("bend", "Jasa Lengkung", "text-right")}{st.th("hpp", "HPP", "text-right")}{st.th("gross", "Laba Kotor", "text-right")}{st.th("margin_pct", "Margin", "text-right")}{st.th("ongkir", "Ongkir", "text-right")}{st.th("expenses", "Beban Ops", "text-right")}{st.th("net", "Laba Bersih", "text-right")}</tr></thead>
          <tbody>{st.sorted.map((x) => (
            <tr key={x.period}><td className="font-mono">{x.period}</td><td className="num">{x.count}</td><td className="num">{rp(x.material)}</td><td className="num">{rp(x.bend)}</td><td className="num">{rp(x.hpp)}</td><td className="num text-emerald-400">{rp(x.gross)}</td><td className="num">{num(x.margin_pct, 1)}%</td><td className="num">{rp(x.ongkir)}</td><td className="num">{rp(x.expenses)}</td><td className="num text-orange-300">{rp(x.net)}</td></tr>
          ))}</tbody>
          <tfoot><tr><td>TOTAL</td><td className="num">{t.count}</td><td className="num">{rp(t.material)}</td><td className="num">{rp(t.bend)}</td><td className="num">{rp(t.hpp)}</td><td className="num">{rp(t.gross)}</td><td className="num">{num(t.margin_pct, 1)}%</td><td className="num">{rp(t.ongkir)}</td><td className="num">{rp(t.expenses)}</td><td className="num">{rp(t.net)}</td></tr></tfoot>
        </table>
      </div>
    </div>
  );
}

function TopProducts() {
  const [r, setR] = useState({ date_from: todayStr(-30), date_to: todayStr() });
  const d = useFetch("/reports/top-products", r) || [];
  const st = useSort(d, byKeys(["name", "qty", "meter", "revenue", "hpp", "profit"]), { id: "top" });
  return (
    <div data-testid="report-top-products">
      <Range r={r} setR={setR} />
      <div className="panel p-3 h-80 mb-4">
        <ResponsiveContainer>
          <BarChart data={d.slice(0, 10)} layout="vertical" margin={{ left: 40 }}><CartesianGrid stroke="#1e293b" horizontal={false} /><XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${num(v / 1e6, 1)}jt`} /><YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={150} />
            <Tooltip {...TT} /><Bar dataKey="profit" name="Laba" fill="#22C55E" /><Bar dataKey="revenue" name="Omzet" fill="#EA580C" /></BarChart>
        </ResponsiveContainer>
      </div>
      <div className="panel overflow-x-auto"><table className="dtable">
        <thead><tr>{st.th("name", "Kategori / Produk")}{st.th("qty", "Qty", "text-right")}{st.th("meter", "Total Meter", "text-right")}{st.th("revenue", "Omzet", "text-right")}{st.th("hpp", "HPP", "text-right")}{st.th("profit", "Laba", "text-right")}</tr></thead>
        <tbody>{st.sorted.map((x) => <tr key={x.name}><td>{x.name}</td><td className="num">{num(x.qty)}</td><td className="num">{num(x.meter)} m</td><td className="num">{rp(x.revenue)}</td><td className="num">{rp(x.hpp)}</td><td className="num text-emerald-400">{rp(x.profit)}</td></tr>)}</tbody>
      </table></div>
    </div>
  );
}

function StockReport() {
  const d = useFetch("/reports/stock");
  const st = useSort(d?.rows, {
    name: (x) => x.name, category: (x) => x.category_name, g1: (x) => Number(x.stock?.G1 || 0), g2: (x) => Number(x.stock?.G2 || 0),
    total: (x) => Number(x.total || 0), value: (x) => Number(x.stock_value || 0),
  }, { id: "stock-report" });
  const rs = useSort(d?.reserved, { ...byKeys(["invoice_no", "customer", "name", "qty", "warehouse"]) }, { id: "reserved" });
  if (!d) return null;
  return (
    <div data-testid="report-stock">
      <div className="mb-3 grid grid-cols-2 gap-3 lg:w-1/2"><Stat label="Nilai Stok (HPP)" value={rp(d.total_value)} /><Stat label="Reserved Indent Diterima" value={`${d.reserved.length} item`} /></div>
      <div className="panel overflow-x-auto mb-4"><table className="dtable">
        <thead><tr>{st.th("name", "Barang")}{st.th("category", "Kategori")}{st.th("g1", "Mojopahit (G1)", "text-right")}{st.th("g2", "Wahidin (G2)", "text-right")}{st.th("total", "Gabungan", "text-right")}{st.th("value", "Nilai", "text-right")}</tr></thead>
        <tbody>{st.sorted.map((x) => <tr key={x.id}><td>{x.name}</td><td className="text-xs">{x.category_name}</td><td className="num">{num(x.stock.G1)}</td><td className="num">{num(x.stock.G2)}</td><td className="num font-semibold">{num(x.total)} {x.unit}</td><td className="num">{rp(x.stock_value)}</td></tr>)}</tbody>
      </table></div>
      <div className="panel overflow-x-auto"><div className="p-3 font-heading text-lg uppercase">Reserved Stock (Indent Sudah Diterima, Belum Dikirim)</div>
        <table className="dtable"><thead><tr>{rs.th("invoice_no", "Nota")}{rs.th("customer", "Konsumen")}{rs.th("name", "Barang")}{rs.th("qty", "Qty", "text-right")}{rs.th("warehouse", "Gudang")}</tr></thead>
          <tbody>{rs.sorted.map((x, i) => <tr key={i}><td className="font-mono">{x.invoice_no}</td><td>{x.customer}</td><td>{x.name} · {num(x.length)} m</td><td className="num">{num(x.qty)} {x.unit}</td><td>{x.warehouse}</td></tr>)}</tbody></table>
        {!d.reserved.length && <Empty />}
      </div>
    </div>
  );
}

function PORecap() {
  const [r, setR] = useState({ date_from: todayStr(-30), date_to: todayStr() });
  const d = useFetch("/purchases", r);
  const st = useSort(d?.items, {
    ...byKeys(["po_no", "date", "supplier_name", "type", "receive_status", "total", "paid_amount", "debt"]),
  }, { id: "po-recap" });
  return (
    <div data-testid="report-po-recap">
      <Range r={r} setR={setR} />
      <div className="panel overflow-x-auto"><table className="dtable">
        <thead><tr>{st.th("po_no", "No PO")}{st.th("date", "Tanggal")}{st.th("supplier_name", "Supplier")}{st.th("type", "Tipe")}{st.th("receive_status", "Status")}{st.th("total", "Total", "text-right")}{st.th("paid_amount", "Dibayar", "text-right")}{st.th("debt", "Utang", "text-right")}</tr></thead>
        <tbody>{st.sorted.map((p) => <tr key={p.id}><td className="font-mono text-orange-300">{p.po_no}</td><td>{fdate(p.date)}</td><td>{p.supplier_name}</td><td>{p.type}</td><td className="text-xs">{p.receive_status} · {p.paid_status}</td><td className="num">{rp(p.total)}</td><td className="num">{rp(p.paid_amount)}</td><td className="num text-orange-300">{rp(p.debt)}</td></tr>)}</tbody>
        <tfoot><tr><td colSpan={5}>{d?.summary.count} PO</td><td className="num">{rp(d?.summary.total)}</td><td /><td className="num">{rp(d?.summary.debt)}</td></tr></tfoot>
      </table></div>
    </div>
  );
}

function Receivables() {
  const d = useFetch("/reports/receivables") || [];
  const st = useSort(d, { ...byKeys(["invoice_no", "date", "customer", "grand_total", "paid_total", "balance", "due_date"]), status: (x) => (x.overdue ? 0 : 1) }, { id: "ar" });
  return (
    <div className="panel overflow-x-auto" data-testid="report-receivables"><table className="dtable">
      <thead><tr>{st.th("invoice_no", "Nota")}{st.th("date", "Tanggal")}{st.th("customer", "Konsumen")}{st.th("grand_total", "Total", "text-right")}{st.th("paid_total", "Terbayar", "text-right")}{st.th("balance", "Sisa", "text-right")}{st.th("due_date", "Jatuh Tempo")}{st.th("status", "Status")}</tr></thead>
      <tbody>{st.sorted.map((x, i) => <tr key={x.id} data-testid={`receivable-row-${i}`}><td className="font-mono">{x.invoice_no}</td><td>{fdate(x.date)}</td><td>{x.customer}<div className="text-xs text-muted-foreground">{x.phone}</div></td><td className="num">{rp(x.grand_total)}</td><td className="num">{rp(x.paid_total)}</td><td className="num text-orange-300">{rp(x.balance)}</td><td>{fdate(x.due_date)}</td>
        <td>{x.overdue ? <span className="tag bg-red-500/20 text-red-300">JATUH TEMPO</span> : <span className="tag tag-ready">Berjalan</span>}{!x.credit_approved && <span className="tag tag-indent ml-1">Belum disetujui</span>}</td></tr>)}</tbody>
      <tfoot><tr><td colSpan={5}>Total Piutang</td><td className="num">{rp(d.reduce((a, x) => a + x.balance, 0))}</td><td colSpan={2} /></tr></tfoot>
    </table></div>
  );
}

const TABS = [["pnl", "Laba Rugi", PnL], ["top", "Produk Menguntungkan", TopProducts], ["stock", "Laporan Stok", StockReport], ["po", "Rekap PO", PORecap], ["ar", "Piutang Jatuh Tempo", Receivables]];

export default function Reports() {
  return (
    <div>
      <PageHeader title="Keuangan & Laporan" subtitle="Khusus Admin / Pemilik" />
      <Tabs defaultValue="pnl">
        <TabsList className="flex flex-wrap h-auto">
          {TABS.map(([k, l]) => <TabsTrigger key={k} value={k} data-testid={`report-tab-${k}`}>{l}</TabsTrigger>)}
          <TabsTrigger value="exp" data-testid="report-tab-expenses">Beban Operasional</TabsTrigger>
        </TabsList>
        {TABS.map(([k, , C]) => <TabsContent key={k} value={k} className="mt-4"><C /></TabsContent>)}
        <TabsContent value="exp" className="mt-4">
          <EntityManager title="Beban" endpoint="/expenses" testid="expenses-manager" defaults={{ date: todayStr(), category: "Operasional" }}
            fields={[{ key: "date", label: "Tanggal", type: "date" }, { key: "name", label: "Keterangan" },
              { key: "category", label: "Kategori", type: "select", options: ["Operasional", "Gaji", "Transportasi", "Utilitas", "Sewa", "Lainnya"] },
              { key: "amount", label: "Nominal", type: "number", money: true }]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
