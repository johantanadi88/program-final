import { X } from "lucide-react";
import { calcLine } from "@/lib/calc";
import { rp, num, isBendable, productBend } from "@/lib/format";
import { useData } from "@/context/DataContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeTag, Empty } from "@/components/common";
import { Switch } from "@/components/ui/switch";

const GRID = "grid items-center gap-x-2 gap-y-1 grid-cols-[auto_84px_minmax(0,1fr)_28px] sm:grid-cols-[minmax(0,1fr)_auto_84px_92px_28px]";
const NUM = "h-8 px-2 font-mono text-xs";

function BendInline({ l, i, setBend, upd }) {
  return (
    <div className="col-span-full flex flex-wrap items-center gap-2 text-[11px]">
      <span className={l.bend !== "lengkung" ? "text-foreground" : "text-muted-foreground"}>Lurus</span>
      <Switch data-testid={`cart-line-bend-${i}`} checked={l.bend === "lengkung"} onCheckedChange={(c) => setBend(c ? "lengkung" : "lurus")} className="scale-75" />
      <span className={l.bend === "lengkung" ? "text-orange-300" : "text-muted-foreground"}>Lengkung</span>
      {l.bend === "lengkung" && (
        <>
          <span className="ml-1 text-muted-foreground">Upah/Lbr</span>
          <Input data-testid={`cart-line-bendfee-${i}`} type="number" value={l.bend_fee} onChange={(e) => upd(i, { bend_fee: e.target.value })} className={`${NUM} w-20`} />
          <span className="font-mono text-orange-200" data-testid={`cart-line-bend-breakdown-${i}`}>= {rp(l.bend_subtotal)}</span>
        </>
      )}
    </div>
  );
}

function CartLine({ l, i, upd, del }) {
  const { products } = useData();
  const bendable = l.bendable ?? isBendable(l.category_name, l.is_length);
  const setBend = (v) => upd(i, {
    bend: v,
    bend_fee: v === "lurus" ? 0 : Number(l.bend_fee) || productBend(products.find((p) => p.id === l.product_id)).upah_lengkung,
  });
  return (
    <div className={`${GRID} border-b border-border py-1.5`} data-testid={`cart-line-${i}`}>
      <div className="col-span-4 min-w-0 sm:col-span-1">
        <div className="text-[13px] font-semibold leading-tight [overflow-wrap:anywhere] line-clamp-2" title={l.name}>{l.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1 font-mono text-[10px] text-muted-foreground">
          <ModeTag mode={l.mode} wh={l.warehouse} />{l.po_no && <span className="tag tag-ready">{l.po_no}</span>}
          {l.delivered_qty > 0 && <span className="tag tag-ready">Terkirim {num(l.delivered_qty)}</span>}
          {l.is_length && <span>= {num(l.total_meter)} m</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Input data-testid={`cart-line-qty-${i}`} type="number" value={l.qty} onChange={(e) => upd(i, { qty: e.target.value })} className={`${NUM} w-14`} title={`Qty (${l.unit})`} />
        <span className="w-7 text-[10px] text-muted-foreground">{l.unit?.slice(0, 3)}</span>
        {l.is_length && (
          <>
            <span className="text-[10px] text-muted-foreground">×</span>
            <Input data-testid={`cart-line-length-${i}`} type="number" step="0.01" value={l.length} disabled={l.mode === "ready"} onChange={(e) => upd(i, { length: e.target.value })} className={`${NUM} w-14`} title="Panjang (m)" />
            <span className="text-[10px] text-muted-foreground">m</span>
          </>
        )}
      </div>
      <Input data-testid={`cart-line-price-${i}`} type="number" value={l.price} onChange={(e) => upd(i, { price: e.target.value })} className={NUM}
        title={l.is_length ? "Harga Nego / m" : `Harga / ${l.unit}`} />
      <div className="text-right font-mono text-xs font-semibold" data-testid={`cart-line-subtotal-${i}`}>{rp(l.subtotal)}</div>
      <Button size="icon" variant="ghost" className="h-7 w-7 justify-self-end" onClick={() => del(i)} data-testid={`cart-line-remove-${i}`} title="Hapus item"><X className="h-4 w-4 text-red-400" /></Button>
      {bendable && <BendInline l={l} i={i} setBend={setBend} upd={upd} />}
    </div>
  );
}

const CartHead = () => (
  <div className={`${GRID} hidden border-b border-border pb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:grid`}>
    <span>Produk & Spesifikasi</span><span>Qty × Panjang</span><span>Harga Satuan</span><span className="text-right">Subtotal</span><span />
  </div>
);

export function CartLines({ lines, onChange }) {
  const upd = (i, patch) => onChange(lines.map((l, j) => (j === i ? calcLine({ ...l, ...patch }) : l)));
  const del = (i) => onChange(lines.filter((_, j) => j !== i));
  if (!lines.length) return <Empty text="Keranjang kosong — pilih barang ready stock atau buat item indent" />;
  return <div className="mt-2" data-testid="cart-lines"><CartHead />{lines.map((l, i) => <CartLine key={l.line_id || l._key || i} l={l} i={i} upd={upd} del={del} />)}</div>;
}
