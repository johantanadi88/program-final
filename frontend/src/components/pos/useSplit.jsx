import { useRef, useState } from "react";
import { GripVertical } from "lucide-react";

const KEY = "hb_pos_split_left_pct";
const MIN = 30;
const MAX = 70;
const clamp = (v) => Math.min(MAX, Math.max(MIN, Math.round(v * 10) / 10));
const load = () => {
  const v = Number(localStorage.getItem(KEY));
  return v ? clamp(v) : 50;
};

export function useSplit() {
  const [pct, setPct] = useState(load);
  const ref = useRef(null);
  const save = (v) => { setPct(v); localStorage.setItem(KEY, String(v)); };
  const fromX = (x) => {
    const r = ref.current.getBoundingClientRect();
    return clamp(((x - r.left) / r.width) * 100);
  };
  const onPointerDown = (e) => {
    e.preventDefault();
    let last = pct;
    const move = (ev) => { last = fromX(ev.clientX); setPct(last); };
    const up = () => {
      localStorage.setItem(KEY, String(last));
      document.body.classList.remove("select-none", "cursor-col-resize");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    document.body.classList.add("select-none", "cursor-col-resize");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") save(clamp(pct - 2));
    if (e.key === "ArrowRight") save(clamp(pct + 2));
  };
  const splitter = (
    <div role="separator" aria-orientation="vertical" aria-valuenow={pct} aria-valuemin={MIN} aria-valuemax={MAX} tabIndex={0}
      data-testid="pos-splitter" title="Geser untuk mengatur lebar panel · klik dua kali untuk 50:50"
      onPointerDown={onPointerDown} onDoubleClick={() => save(50)} onKeyDown={onKeyDown}
      className="group relative hidden cursor-col-resize touch-none select-none items-start justify-center outline-none lg:flex lg:self-stretch">
      <div className="h-full w-px bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
      <div className="sticky top-24 flex h-12 w-4 items-center justify-center rounded-sm border border-border bg-secondary text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
        <GripVertical className="h-3.5 w-3.5" />
      </div>
    </div>
  );
  return { ref, pct, splitter };
}
