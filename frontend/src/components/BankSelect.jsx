import { Landmark } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Field, Sel } from "@/components/common";

export const bankLabel = (b) => (b ? `${b.bank}: ${b.number} a/n ${b.holder}` : "");

export function BankSelect({ value, onChange, testid = "pos-transfer-bank", label = "Bank Tujuan Transfer" }) {
  const { settings } = useData();
  const accounts = settings?.bank_accounts || [];
  if (!accounts.length) {
    return <div className="rounded-md border border-dashed border-yellow-500/50 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300" data-testid={`${testid}-empty`}>Belum ada rekening bank. Admin dapat menambahkannya di Pengaturan → Rekening Bank.</div>;
  }
  return (
    <Field label={<span className="inline-flex items-center gap-1"><Landmark className="h-3 w-3" /> {label}</span>}>
      <Sel testid={testid} value={value || ""} onChange={onChange} placeholder="Pilih bank tujuan..."
        options={accounts.map((a) => ({ value: a.id, label: bankLabel(a) }))} />
    </Field>
  );
}
