import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Download, ExternalLink, Loader2, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { renderPdf } from "@/lib/pdf";

const PdfCtx = createContext(null);

function PdfActions({ url, filename, frame }) {
  const print = () => {
    try { frame.current.contentWindow.focus(); frame.current.contentWindow.print(); } catch { window.open(url, "_blank"); }
  };
  return (
    <>
      <Button variant="secondary" className="gap-2" data-testid="pdf-open-tab" disabled={!url} onClick={() => window.open(url, "_blank")}><ExternalLink className="h-4 w-4" /> Buka Tab Baru</Button>
      <Button variant="secondary" className="gap-2" data-testid="pdf-print" disabled={!url} onClick={print}><Printer className="h-4 w-4" /> Cetak</Button>
      <Button asChild={!!url} className="gap-2" data-testid="pdf-download" disabled={!url}>
        {url ? <a href={url} download={filename}><Download className="h-4 w-4" /> Unduh PDF</a> : <span><Download className="h-4 w-4" /> Unduh PDF</span>}
      </Button>
    </>
  );
}

export function PdfProvider({ children }) {
  const [job, setJob] = useState(null);
  const [url, setUrl] = useState("");
  const host = useRef(null);
  const frame = useRef(null);

  useEffect(() => {
    if (!job) return undefined;
    let alive = true;
    let made = "";
    setUrl("");
    const t = setTimeout(async () => {
      try {
        const blob = await renderPdf(host.current.firstElementChild, job.size);
        made = URL.createObjectURL(blob);
        if (alive) setUrl(made);
      } catch (e) {
        toast.error("Gagal membuat PDF");
      }
    }, 150);
    return () => { alive = false; clearTimeout(t); if (made) URL.revokeObjectURL(made); };
  }, [job]);

  return (
    <PdfCtx.Provider value={setJob}>
      {children}
      <Dialog open={!!job} onOpenChange={(o) => !o && setJob(null)}>
        <DialogContent className="max-w-4xl" data-testid="pdf-preview-dialog">
          <DialogHeader><DialogTitle className="font-heading text-2xl uppercase tracking-wide">{job?.title}</DialogTitle></DialogHeader>
          <div className="font-mono text-xs text-muted-foreground" data-testid="pdf-filename">{job?.filename}</div>
          <div className="relative h-[68vh] overflow-hidden rounded-md border border-border bg-slate-300/10">
            {url ? <iframe ref={frame} title="Pratinjau PDF" src={url} className="h-full w-full" data-testid="pdf-preview-frame" />
              : <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Membuat PDF...</div>}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {job?.extra}
            <PdfActions url={url} filename={job?.filename} frame={frame} />
          </div>
        </DialogContent>
      </Dialog>
      {job && createPortal(
        <div ref={host} aria-hidden className="paper" style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }}>{job.node}</div>,
        document.body,
      )}
    </PdfCtx.Provider>
  );
}

export const usePdf = () => useContext(PdfCtx);
