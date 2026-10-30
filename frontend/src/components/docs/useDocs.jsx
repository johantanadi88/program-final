import { MessageCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { usePrint } from "@/components/PrintProvider";
import { waLink } from "@/lib/format";
import { Nota } from "./Nota";
import { SuratJalan } from "./SuratJalan";
import { PODoc } from "./PODoc";
import { useAuth } from "@/context/AuthContext";
import { usePdf } from "@/components/PdfProvider";
import { pdfName } from "@/lib/pdf";

const lastDelivery = (sale) => {
  const d = (sale.deliveries || []).slice(-1)[0];
  if (d) return d;
  const items = (sale.items || []).map((it) => ({ ...it, qty: Math.max(Number(it.qty) - Number(it.delivered_qty || 0), 0) })).filter((it) => it.qty > 0);
  return { sj_no: "DRAFT", rit: (sale.deliveries || []).length + 1, date: sale.delivery_date || sale.date, warehouse: sale.items?.[0]?.warehouse, items };
};

const LABEL = { thermal58: "Thermal 58mm", thermal80: "Thermal 80mm", a4: "Printer Biasa · A4", f4: "Printer Biasa · F4" };

export function useDocs() {
  const { setDoc, choose } = usePrint();
  const { isAdmin } = useAuth();
  const { settings, warehouses, suppliers } = useData();
  const setPdf = usePdf();
  const cust = (sale) => sale.customer?.name || "Pelanggan";
  const pdfNota = (sale, size = "a4") => setPdf({
    size, title: `PDF Nota ${sale.invoice_no} · ${size.toUpperCase()}`, filename: pdfName("Nota", sale.invoice_no, cust(sale)),
    node: <Nota sale={sale} settings={settings} variant={size} />,
    extra: <Button variant="outline" data-testid="pdf-nota-size-toggle" onClick={() => pdfNota(sale, size === "a4" ? "a5" : "a4")}>Ganti ke {size === "a4" ? "A5" : "A4"}</Button>,
  });
  const pdfStruk = (sale) => setPdf({
    size: "thermal80", title: `PDF Struk ${sale.invoice_no} · 80mm`, filename: pdfName("Struk", sale.invoice_no, cust(sale)),
    node: <Nota sale={sale} settings={settings} variant="thermal80" />,
  });
  const pdfSJ = (sale, delivery = lastDelivery(sale)) => setPdf({
    size: "sj", title: `PDF Surat Jalan ${delivery.sj_no === "DRAFT" ? `(Draft) ${sale.invoice_no}` : delivery.sj_no}`,
    filename: pdfName("SuratJalan", delivery.sj_no === "DRAFT" ? `${sale.invoice_no}-DRAFT` : delivery.sj_no, cust(sale)),
    node: <SuratJalan sale={sale} delivery={delivery} settings={settings} warehouses={warehouses} />,
  });
  const sendWA = (sale) => window.open(waLink(sale, settings), "_blank");
  const printNota = (sale) => choose({ title: `Cetak Nota ${sale.invoice_no}`, onPick: (v) => openNota(sale, v) });
  const openNota = (sale, variant) =>
    setDoc({
      type: variant, autoPrint: true, title: `Nota ${sale.invoice_no} · ${LABEL[variant]}`,
      node: <Nota sale={sale} settings={settings} variant={variant} />,
      extra: (
        <>
          <Button variant="secondary" className="gap-2" data-testid="nota-change-printer" onClick={() => printNota(sale)}>
            <Printer className="h-4 w-4" /> Ganti Printer
          </Button>
          <Button variant="secondary" className="gap-2" data-testid="nota-send-wa" onClick={() => sendWA(sale)}>
            <MessageCircle className="h-4 w-4" /> Kirim WA
          </Button>
        </>
      ),
    });
  const printSJ = (sale, delivery) =>
    setDoc({ type: "sj", title: `Surat Jalan ${delivery.sj_no}`, node: <SuratJalan sale={sale} delivery={delivery} settings={settings} warehouses={warehouses} /> });
  const printPO = (po, paper = "a4") =>
    setDoc({
      type: `po_${paper}`, title: `Cetak PO ${po.po_no} · ${paper.toUpperCase()}`,
      node: <PODoc po={po} supplier={(suppliers || []).find((s) => s.id === po.supplier_id)} settings={settings} warehouses={warehouses} showPrice={isAdmin} paper={paper} />,
      extra: (
        <Button variant="secondary" data-testid="po-doc-paper-toggle" onClick={() => printPO(po, paper === "a4" ? "a5" : "a4")}>
          Ganti ke {paper === "a4" ? "A5" : "A4"}
        </Button>
      ),
    });
  return { printNota, printSJ, sendWA, printPO, pdfNota, pdfStruk, pdfSJ };
}
