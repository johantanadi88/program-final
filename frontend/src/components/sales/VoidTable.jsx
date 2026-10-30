import { Eye } from "lucide-react";
import { rp, fdate, fdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/common";
import { useSort } from "@/components/SortTh";

export const VoidIndentTag = ({ testid = "void-indent-tag" }) => (
  <span data-testid={testid} className="tag whitespace-nowrap border border-red-500/50 bg-red-500/15 text-red-300">[VOID INDENT - PO PABRIK BATAL]</span>
);

export function VoidTable({ items, onOpen, id = "void" }) {
  const { sorted, th } = useSort(items, {
    invoice: (s) => s.invoice_no, voided_at: (s) => s.voided_at, date: (s) => s.date, cashier: (s) => s.cashier, by: (s) => s.voided_by,
    reason: (s) => s.void_reason, total: (s) => Number(s.void_total ?? s.grand_total ?? 0),
  }, { id, key: "voided_at", dir: -1 });
  const total = items.reduce((a, s) => a + Number(s.void_total ?? s.grand_total ?? 0), 0);
  return (
    <div className="panel overflow-hidden" data-testid={`${id}-table`}>
      <div className="max-h-[70vh] overflow-auto">
        <table className="dtable dtable-compact">
          <thead><tr>{th("invoice", "No. Invoice")}{th("voided_at", "Tanggal Void")}{th("date", "Tgl Transaksi")}{th("cashier", "Kasir")}{th("by", "Di-void Oleh")}{th("reason", "Alasan Pembatalan")}{th("total", "Total Dibatalkan", "text-right")}{onOpen && <th />}</tr></thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr key={s.id} data-testid={`${id}-row-${i}`} className={onOpen ? "cursor-pointer" : ""} onClick={() => onOpen?.(s)}>
                <td className="w-px whitespace-nowrap font-mono text-red-300 line-through decoration-red-400/60">{s.invoice_no}</td>
                <td className="w-px whitespace-nowrap font-mono text-xs" data-testid={`${id}-row-date-${i}`}>{fdt(s.voided_at)}</td>
                <td className="w-px whitespace-nowrap font-mono text-xs text-muted-foreground">{fdate(s.date)}</td>
                <td className="w-px whitespace-nowrap">{s.cashier || "-"}</td>
                <td className="w-px whitespace-nowrap">{s.voided_by || "-"}</td>
                <td className="w-full min-w-[200px]">
                  <div className="text-sm" data-testid={`${id}-row-reason-${i}`}>{s.void_reason || <span className="italic text-muted-foreground">Tanpa alasan</span>}</div>
                  {s.void_indent && <div className="mt-1"><VoidIndentTag testid={`${id}-row-indent-${i}`} /></div>}
                </td>
                <td className="num w-px text-red-300" data-testid={`${id}-row-total-${i}`}>{rp(s.void_total ?? s.grand_total)}</td>
                {onOpen && <td className="w-px"><Button size="icon" variant="ghost" className="h-7 w-7" title="Detail"><Eye className="h-4 w-4" /></Button></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && <Empty text="Tidak ada transaksi void pada periode ini" />}
      </div>
      <div className="border-t-2 border-red-500/60 bg-secondary/60 px-3 py-2 font-mono text-sm" data-testid={`${id}-summary`}>
        {items.length} nota dibatalkan · Total {rp(total)}
      </div>
    </div>
  );
}
