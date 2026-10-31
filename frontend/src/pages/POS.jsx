import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, MessageCircle, Printer, Truck, WifiOff, FileDown } from "lucide-react";
import { api, errMsg } from "@/lib/api";
import { summarize, initialPaid } from "@/lib/calc";
import { rp, todayStr, uid, PAY_METHODS, TBA } from "@/lib/format";
import { DeliveryDateField } from "@/components/pos/DeliveryDateField";
import { queueAdd, deductLocalStock } from "@/lib/offline";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/common";
import { ItemAdder } from "@/components/pos/ItemAdder";
import { CartLines } from "@/components/pos/CartLines";
import { CustomerForm } from "@/components/pos/CustomerForm";
import { DeliveryDialog } from "@/components/sales/SaleDialogs";
import { useDocs } from "@/components/docs/useDocs";
import { useSplit } from "@/components/pos/useSplit";

const EMPTY_CUST = { name: "", phone: "", address: "", type: "Umum", status: "" };

function Totals({ t, paid }) {
  const R = ({ l, v, cls = "" }) => <div className={`flex justify-between ${cls}`}><span>{l}</span><span>{v}</span></div>;
  return (
    <div className="font-mono text-sm space-y-1" data-testid="pos-totals">
      <R l="Subtotal Material" v={rp(t.total_material)} />
      <R l="Upah Lengkung" v={rp(t.total_bend)} />
      <R l="Ongkir" v={rp(t.ongkir)} />
      <R l="TOTAL TAGIHAN" v={<span data-testid="pos-grand-total">{rp(t.grand_total)}</span>} cls="text-lg font-bold text-orange-300 border-t border-border pt-1" />
      <R l="Dibayar / DP" v={rp(paid)} />
      <R l="Sisa (Piutang)" v={<span data-testid="pos-balance">{rp(t.grand_total - paid)}</span>} />
    </div>
  );
}

export default function POS() {
  const { user } = useAuth();
  const { online, refresh, setData, countQueue, ...boot } = useData();
  const { printNota, sendWA, pdfNota, pdfStruk, pdfSJ } = useDocs();
  const split = useSplit();
  const [customer, setCustomer] = useState(EMPTY_CUST);
  const [saveCust, setSaveCust] = useState(false);
  const [lines, setLines] = useState([]);
  const [f, setF] = useState({ delivery_date: TBA, ongkir: 0, notes: "", method: "Tunai", dp: "", due_date: todayStr(14), cash: "" });
  const [done, setDone] = useState(null);
  const [sj, setSj] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const t = summarize(lines, f.ongkir);
  const paid = initialPaid(f.method, t.grand_total, f.dp);

  const reset = () => { setCustomer(EMPTY_CUST); setSaveCust(false); setLines([]); setF((s) => ({ ...s, ongkir: 0, notes: "", dp: "", cash: "", method: "Tunai" })); };

  const submit = async () => {
    if (!lines.length) return toast.error("Keranjang masih kosong");
    if (f.method === "DP" && !(Number(f.dp) > 0)) return toast.error("Isi nominal DP");
    const payload = { offline_id: uid(), customer, save_customer: saveCust, delivery_date: f.delivery_date, delivery_address: customer.address,
      notes: f.notes, ongkir: Number(f.ongkir) || 0, payment_method: f.method, dp_amount: Number(f.dp) || 0,
      due_date: ["Piutang", "DP"].includes(f.method) ? f.due_date : null, items: lines.map(({ _key, ...l }) => l) };
    setBusy(true);
    try {
      if (!navigator.onLine) throw Object.assign(new Error("offline"), { offline: true });
      const { data } = await api.post("/sales", payload);
      setDone(data);
      toast.success(`Transaksi ${data.invoice_no} tersimpan`);
      refresh();
    } catch (e) {
      if (e.response) { toast.error(errMsg(e)); setBusy(false); return; }
      await queueAdd(payload);
      const b = await deductLocalStock(payload.items);
      if (b) setData(b);
      countQueue();
      const pays = paid > 0 ? [{ id: "p", date: todayStr(), amount: paid, method: f.method }] : [];
      setDone({ ...payload, ...summarize(lines, f.ongkir, pays), invoice_no: `OFFLINE-${payload.offline_id.slice(0, 6).toUpperCase()}`, date: todayStr(),
        cashier: user.name, customer: { ...customer, name: customer.name || "Pelanggan Umum / CASH" }, items: lines, payments: pays, offline: true });
      toast.warning("Offline: transaksi disimpan di antrian & akan auto-sync");
    }
    setBusy(false);
    reset();
  };

  return (
    <div ref={split.ref} style={{ "--pos-left": `${split.pct}%` }} className="grid gap-4 lg:gap-2 lg:grid-cols-[minmax(0,var(--pos-left))_16px_minmax(0,1fr)]" data-testid="pos-page">
      <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:self-start lg:h-[calc(100vh-6rem)]" data-testid="pos-checkout-column">
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:overflow-y-auto lg:pr-1" data-testid="pos-checkout-scroll">
          <div className="panel p-4"><div className="mb-2 font-heading text-lg uppercase">Data Konsumen & Jadwal</div>
            <CustomerForm customer={customer} setCustomer={setCustomer} save={saveCust} setSave={setSaveCust} />
            <DeliveryDateField className="mt-3" value={f.delivery_date} onChange={(v) => set("delivery_date", v)} />
          </div>
          <div className="panel p-4"><div className="font-heading text-lg uppercase">Keranjang ({lines.length})</div>
            <CartLines lines={lines} onChange={setLines} />
          </div>
          <div className="panel p-4 grid gap-3">
            <Field label="Catatan / Instruksi Khusus"><Textarea data-testid="pos-notes" placeholder='Contoh: "Titip ke tukang Budi", "Kirim sebelum jam 12"' value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
            <Field label="Biaya Pengantaran / Ongkir (Rp)"><Input type="number" data-testid="pos-ongkir" value={f.ongkir} onChange={(e) => set("ongkir", e.target.value)} className="font-mono" /></Field>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Metode Pembayaran</div>
            <div className="grid grid-cols-4 gap-2">
              {PAY_METHODS.map((m) => <button key={m} data-testid={`pos-pay-${m.toLowerCase()}`} onClick={() => set("method", m)} className={`pill px-1 text-xs sm:text-sm ${f.method === m ? "pill-on" : ""}`}>{m === "DP" ? "DP" : m}</button>)}
            </div>
            {f.method === "DP" && <Field label="Nominal DP / Uang Muka"><Input type="number" data-testid="pos-dp-amount" value={f.dp} onChange={(e) => set("dp", e.target.value)} className="font-mono" /></Field>}
            {["Piutang", "DP"].includes(f.method) && <Field label="Jatuh Tempo"><Input type="date" data-testid="pos-due-date" value={f.due_date} onChange={(e) => set("due_date", e.target.value)} /></Field>}
            {f.method === "Tunai" && (
              <Field label="Uang Diterima (opsional)"><Input type="number" data-testid="pos-cash-received" value={f.cash} onChange={(e) => set("cash", e.target.value)} className="font-mono" /></Field>
            )}
            {f.method === "Tunai" && Number(f.cash) > 0 && <div className="font-mono text-sm text-emerald-400" data-testid="pos-change">Kembalian: {rp(Number(f.cash) - t.grand_total)}</div>}
          </div>
        </div>
        <div className="panel sticky bottom-0 z-10 grid shrink-0 gap-3 border-t-2 border-primary/60 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] lg:static" data-testid="pos-checkout-footer">
          <Totals t={t} paid={paid} />
          <Button data-testid="pos-submit-button" disabled={busy} onClick={submit} className="h-14 text-lg font-heading uppercase tracking-wider">{busy ? "Menyimpan..." : "Simpan Transaksi"}</Button>
        </div>
      </div>
      {split.splitter}
      <div className="panel min-w-0 p-3 sm:p-4" data-testid="pos-picker-column">
        {!online && <div className="mb-3 flex items-center gap-2 rounded-md bg-red-500/10 p-2 text-sm text-red-300" data-testid="pos-offline-banner"><WifiOff className="h-4 w-4" /> Mode Offline — data stok dari cache lokal ({boot.products.length} produk)</div>}
        <ItemAdder onAdd={(l) => { setLines((s) => [...s, l]); toast.success(`${l.name} masuk keranjang`); }} />
      </div>
      <Dialog open={!!done} onOpenChange={(o) => !o && setDone(null)}>
        <DialogContent className="max-w-md" data-testid="pos-success-dialog">
          <DialogHeader><DialogTitle className="font-heading text-2xl uppercase flex items-center gap-2"><CheckCircle2 className="h-6 w-6 text-emerald-400" /> Transaksi Tersimpan</DialogTitle></DialogHeader>
          {done && (
            <div className="grid gap-3">
              <div className="font-mono text-lg" data-testid="pos-success-invoice">{done.invoice_no}</div>
              {done.offline && <div className="text-sm text-yellow-400">Tersimpan di Offline Queue — nomor nota resmi diberikan setelah sync.</div>}
              <div className="font-mono text-sm">Total {rp(done.grand_total)} · Sisa {rp(done.balance)}</div>
              <div className="grid grid-cols-2 gap-2">
                <Button className="gap-2 h-12" data-testid="pos-print-nota" onClick={() => printNota(done)}><Printer className="h-4 w-4" /> Cetak Nota</Button>
                <Button variant="secondary" className="gap-2 h-12" data-testid="pos-send-wa" onClick={() => sendWA(done)}><MessageCircle className="h-4 w-4" /> Kirim WA</Button>
                {!done.offline && <Button variant="secondary" className="gap-2 h-12" data-testid="pos-create-sj" onClick={() => { setSj(done); setDone(null); }}><Truck className="h-4 w-4" /> Surat Jalan</Button>}
                <Button variant="outline" className="h-12" data-testid="pos-new-transaction" onClick={() => setDone(null)}>Transaksi Baru</Button>
              </div>
              {!done.offline && (
                <div className="grid gap-2 border-t border-border pt-3" data-testid="pos-pdf-options">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Export / Cetak PDF</div>
                  <Button variant="outline" className="h-10 justify-start gap-2" data-testid="pos-pdf-nota" onClick={() => pdfNota(done, "a4")}><FileDown className="h-4 w-4" /> PDF Nota / Invoice (A4 / A5)</Button>
                  <Button variant="outline" className="h-10 justify-start gap-2" data-testid="pos-pdf-struk" onClick={() => pdfStruk(done)}><FileDown className="h-4 w-4" /> PDF Struk Thermal (80mm)</Button>
                  <Button variant="outline" className="h-10 justify-start gap-2" data-testid="pos-pdf-sj" onClick={() => pdfSJ(done)}><FileDown className="h-4 w-4" /> PDF Surat Jalan / Pengiriman</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <DeliveryDialog sale={sj} onClose={() => setSj(null)} />
    </div>
  );
}
