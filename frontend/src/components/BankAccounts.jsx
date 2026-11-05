import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { api, errMsg } from "@/lib/api";
import { uid } from "@/lib/format";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Empty } from "@/components/common";

const BLANK = { bank: "", number: "", holder: "" };

export function BankAccounts() {
  const { settings, refresh } = useData();
  const accounts = settings?.bank_accounts || [];
  const [f, setF] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const persist = async (list, msg) => {
    try { await api.put("/settings", { ...settings, bank_accounts: list }); toast.success(msg); refresh(); return true; } catch (e) { toast.error(errMsg(e)); return false; }
  };
  const submit = async () => {
    const row = { bank: f.bank.trim(), number: f.number.trim(), holder: f.holder.trim() };
    if (!row.bank || !row.number || !row.holder) return toast.error("Nama Bank, No. Rekening & Atas Nama wajib diisi");
    const list = editId ? accounts.map((a) => (a.id === editId ? { ...a, ...row } : a)) : [...accounts, { id: uid(), ...row }];
    if (await persist(list, editId ? "Rekening diperbarui" : "Rekening ditambahkan")) { setF(BLANK); setEditId(null); }
    return null;
  };
  const del = (a) => window.confirm(`Hapus rekening ${a.bank} ${a.number}?`) && persist(accounts.filter((x) => x.id !== a.id), "Rekening dihapus");
  const edit = (a) => { setEditId(a.id); setF({ bank: a.bank, number: a.number, holder: a.holder }); };
  return (
    <div className="grid gap-4" data-testid="bank-accounts">
      <div className="panel grid gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end" data-testid="bank-form">
        <Field label="Nama Bank"><Input data-testid="bank-name-input" placeholder="Bank Mandiri" value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })} /></Field>
        <Field label="Nomor Rekening"><Input data-testid="bank-number-input" className="font-mono" placeholder="123-00-xxxx" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></Field>
        <Field label="Atas Nama (a/n)"><Input data-testid="bank-holder-input" placeholder="HORAS BAJA" value={f.holder} onChange={(e) => setF({ ...f, holder: e.target.value })} /></Field>
        <div className="flex gap-2">
          <Button data-testid="bank-save-button" className="gap-2" onClick={submit}>{editId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editId ? "Simpan" : "Tambah"}</Button>
          {editId && <Button variant="ghost" size="icon" data-testid="bank-cancel-edit" onClick={() => { setEditId(null); setF(BLANK); }}><X className="h-4 w-4" /></Button>}
        </div>
      </div>
      <div className="panel overflow-x-auto">
        <table className="dtable dtable-compact">
          <thead><tr><th>No</th><th>Nama Bank</th><th>Nomor Rekening</th><th>Atas Nama</th><th className="text-right">Aksi</th></tr></thead>
          <tbody>
            {accounts.map((a, i) => (
              <tr key={a.id} data-testid={`bank-row-${i}`} className={editId === a.id ? "bg-primary/10" : ""}>
                <td className="w-px font-mono">{i + 1}</td>
                <td className="font-semibold">{a.bank}</td>
                <td className="font-mono">{a.number}</td>
                <td>{a.holder}</td>
                <td className="w-px whitespace-nowrap text-right">
                  <Button size="icon" variant="ghost" className="h-7 w-7" data-testid={`bank-edit-${i}`} onClick={() => edit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" data-testid={`bank-delete-${i}`} onClick={() => del(a)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!accounts.length && <Empty text="Belum ada rekening bank toko" />}
      </div>
      <p className="text-xs text-muted-foreground">Semua rekening di atas otomatis aktif & dapat dipilih kasir saat metode pembayaran Transfer di POS.</p>
    </div>
  );
}
