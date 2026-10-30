import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { num, fdt, whName } from "@/lib/format";
import { Empty } from "@/components/common";
import { useSort } from "@/components/SortTh";

const KIND = { VOID_RETURN: ["Retur Void", "bg-red-500/15 text-red-300 border-red-500/40"] };

export function StockHistory({ warehouses }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get("/stock/history").then((r) => setRows(r.data)).catch(() => null); }, []);
  const { sorted, th } = useSort(rows, {
    date: (l) => l.created_at, product: (l) => l.product_name, wh: (l) => whName(warehouses, l.warehouse), kind: (l) => l.kind,
    ref: (l) => l.ref, delta: (l) => Number(l.delta || 0), balance: (l) => Number(l.balance ?? 0), by: (l) => l.by,
  }, { id: "stock-history" });
  return (
    <div className="panel mt-4 overflow-x-auto" data-testid="stock-history">
      <div className="p-3 font-heading text-lg uppercase">Histori Stok (Retur Void)</div>
      <table className="dtable dtable-compact">
        <thead><tr>{th("date", "Waktu")}{th("product", "Barang")}{th("wh", "Gudang")}{th("kind", "Jenis")}{th("ref", "Ref. Nota")}{th("delta", "Qty Masuk", "text-right")}{th("balance", "Saldo Stok", "text-right")}{th("by", "Oleh")}</tr></thead>
        <tbody>
          {sorted.map((l, i) => {
            const [label, cls] = KIND[l.kind] || [l.kind, "border-border"];
            return (
              <tr key={l.id} data-testid={`stock-history-row-${i}`}>
                <td className="w-px whitespace-nowrap font-mono text-xs">{fdt(l.created_at)}</td>
                <td>{l.product_name}<div className="text-[11px] text-muted-foreground">{l.note}</div></td>
                <td className="w-px whitespace-nowrap text-xs">{whName(warehouses, l.warehouse)}</td>
                <td className="w-px whitespace-nowrap"><span className={`rounded border px-2 py-0.5 font-mono text-[11px] ${cls}`}>{label}</span></td>
                <td className="w-px whitespace-nowrap font-mono text-xs">{l.ref}</td>
                <td className="num w-px text-emerald-300">{l.delta > 0 ? "+" : ""}{num(l.delta)} {l.unit}</td>
                <td className="num w-px">{l.balance != null ? num(l.balance) : "-"}</td>
                <td className="w-px whitespace-nowrap">{l.by}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && <Empty text="Belum ada histori retur stok" />}
    </div>
  );
}
