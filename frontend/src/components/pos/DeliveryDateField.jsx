import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common";
import { todayStr, TBA } from "@/lib/format";

export function DeliveryDateField({ value, onChange, label = "Rencana Tanggal Pengantaran", testid = "pos-delivery-date", className = "" }) {
  const isTba = value === TBA;
  return (
    <Field label={label} className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm" data-testid={`${testid}-tba-label`}>
          <Checkbox data-testid={`${testid}-tba`} checked={isTba} onCheckedChange={(c) => onChange(c ? TBA : todayStr(1))} />
          <span className={isTba ? "font-semibold text-orange-300" : ""}>TBA (Diinfokan Kembali)</span>
        </label>
        {isTba
          ? <span className="font-mono text-xs text-muted-foreground" data-testid={`${testid}-tba-note`}>Tanggal kirim menyusul</span>
          : <Input type="date" className="w-44" data-testid={testid} value={value || ""} onChange={(e) => onChange(e.target.value)} />}
      </div>
    </Field>
  );
}
