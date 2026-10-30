import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const SIZES = { a4: [210, 297, 10], a5: [148, 210, 6], thermal80: [80, null, 2], sj: [210, 148, 6] };

export const pdfName = (...parts) =>
  `${parts.filter(Boolean).map((p) => String(p).trim().replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")).join("_")}.pdf`;

export async function renderPdf(el, size) {
  const root = document.documentElement;
  const font = root.dataset.font;
  root.dataset.font = "md";
  try {
    await document.fonts?.ready;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const [w, h, m] = SIZES[size];
    const imgW = w - 2 * m;
    const fullH = (canvas.height * imgW) / canvas.width;
    const pageH = h ?? fullH + 2 * m;
    const pdf = new jsPDF({ unit: "mm", format: w > pageH ? [pageH, w] : [w, pageH], orientation: w > pageH ? "landscape" : "portrait", compress: true });
    const slicePx = Math.floor(((pageH - 2 * m) * canvas.width) / imgW);
    for (let y = 0, page = 0; y < canvas.height; y += slicePx, page += 1) {
      const part = document.createElement("canvas");
      part.width = canvas.width;
      part.height = Math.min(slicePx, canvas.height - y);
      part.getContext("2d").drawImage(canvas, 0, y, canvas.width, part.height, 0, 0, canvas.width, part.height);
      if (page) pdf.addPage();
      pdf.addImage(part.toDataURL("image/jpeg", 0.95), "JPEG", m, m, imgW, (part.height * imgW) / canvas.width);
    }
    return pdf.output("blob");
  } finally {
    root.dataset.font = font || "md";
  }
}
