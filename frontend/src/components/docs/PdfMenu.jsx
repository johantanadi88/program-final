import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDocs } from "./useDocs";

export function PdfMenu({ sale, testid = "pdf-menu", compact }) {
  const { pdfNota, pdfStruk, pdfSJ } = useDocs();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact
          ? <Button size="icon" variant="ghost" title="Export PDF" data-testid={testid}><FileDown className="h-4 w-4" /></Button>
          : <Button variant="secondary" className="gap-2" data-testid={testid}><FileDown className="h-4 w-4" /> PDF</Button>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs">Export / Cetak PDF</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem data-testid={`${testid}-nota-a4`} onClick={() => pdfNota(sale, "a4")}>PDF Nota / Invoice (A4)</DropdownMenuItem>
        <DropdownMenuItem data-testid={`${testid}-nota-a5`} onClick={() => pdfNota(sale, "a5")}>PDF Nota / Invoice (A5)</DropdownMenuItem>
        <DropdownMenuItem data-testid={`${testid}-struk`} onClick={() => pdfStruk(sale)}>PDF Struk Thermal (80mm)</DropdownMenuItem>
        <DropdownMenuItem data-testid={`${testid}-sj`} onClick={() => pdfSJ(sale)}>PDF Surat Jalan / Pengiriman</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
