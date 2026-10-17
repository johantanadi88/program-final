import { useState } from "react";
import { Check, Moon, Palette, Sun, Sunset } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const KEY = "hb_theme";
const FONT_KEY = "hb_font";
const FONTS = [{ id: "md", label: "Normal", sample: 14 }, { id: "lg", label: "Besar", sample: 17 }, { id: "xl", label: "Ekstra Besar", sample: 20 }];
const THEMES = [
  { id: "light", label: "Tema Cerah", note: "Ruangan terang", icon: Sun, swatch: ["#F5F7FA", "#C2410C"] },
  { id: "dark", label: "Tema Gelap", note: "Malam / ruangan redup", icon: Moon, swatch: ["#0A0A0A", "#EA580C"] },
  { id: "slate", label: "Slate Warm Focus", note: "Rekomendasi kasir", icon: Sunset, swatch: ["#1E293B", "#F2C66D"] },
];

const apply = (id) => {
  document.documentElement.dataset.theme = id;
  localStorage.setItem(KEY, id);
};

export function ThemeSwitcher() {
  const [theme, setTheme] = useState(() => localStorage.getItem(KEY) || "dark");
  const pick = (id) => { apply(id); setTheme(id); };
  const [font, setFont] = useState(() => localStorage.getItem(FONT_KEY) || "md");
  const pickFont = (id) => { document.documentElement.dataset.font = id; localStorage.setItem(FONT_KEY, id); setFont(id); };
  const Cur = THEMES.find((t) => t.id === theme)?.icon || Palette;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button data-testid="theme-switcher-button" title="Pilih tema tampilan"
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
          <Cur className="h-3.5 w-3.5" /><span className="hidden md:inline">Tema &amp; Huruf</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60" data-testid="theme-switcher-menu">
        <DropdownMenuLabel className="text-xs">Tema Tampilan</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => (
          <DropdownMenuItem key={t.id} data-testid={`theme-option-${t.id}`} onClick={() => pick(t.id)} className="gap-3 py-2">
            <span className="flex h-7 w-10 shrink-0 overflow-hidden rounded-sm border border-border">
              <span className="flex-1" style={{ background: t.swatch[0] }} /><span className="w-3" style={{ background: t.swatch[1] }} />
            </span>
            <span className="flex-1 leading-tight">
              <span className="block text-sm font-medium">{t.label}</span>
              <span className="block text-[11px] text-muted-foreground">{t.note}</span>
            </span>
            {theme === t.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs">Ukuran Huruf</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 p-1" data-testid="font-size-options">
          {FONTS.map((f) => (
            <button key={f.id} type="button" data-testid={`font-option-${f.id}`} onClick={() => pickFont(f.id)}
              className={`flex flex-col items-center rounded-sm border px-1 py-1.5 transition-colors ${font === f.id ? "border-primary bg-primary/15 text-orange-300" : "border-border hover:bg-secondary"}`}>
              <span className="font-heading font-bold leading-none" style={{ fontSize: f.sample }}>Aa</span>
              <span className="mt-1 text-[10px]">{f.label}</span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
