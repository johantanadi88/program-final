import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

const empty = (v) => v === null || v === undefined || v === "" || (typeof v === "number" && Number.isNaN(v));
const norm = (v) => (typeof v === "boolean" ? Number(v) : v);
const cmp = (a, b) =>
  typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "id", { numeric: true, sensitivity: "base" });

export function SortTh({ k, label, sort, onSort, className = "", testid }) {
  const on = sort.key === k;
  const Icon = !on ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th className={className} aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" data-testid={testid} onClick={() => onSort(k)} title="Klik untuk mengurutkan"
        className={`inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-foreground ${on ? "text-orange-300" : ""}`}>
        {label}<Icon className={`h-3 w-3 shrink-0 ${on ? "" : "opacity-40"}`} />
      </button>
    </th>
  );
}

export function useSort(rows, getters, { id = "tbl", key = null, dir = 1 } = {}) {
  const [sort, setSort] = useState({ key, dir });
  const onSort = (k) => setSort((s) => (s.key === k ? { key: k, dir: -s.dir } : { key: k, dir: 1 }));
  const list = rows || [];
  const g = sort.key && getters[sort.key];
  const sorted = !g ? list : [...list].sort((a, b) => {
    const x = norm(g(a));
    const y = norm(g(b));
    if (empty(x) || empty(y)) return empty(x) - empty(y);
    return cmp(x, y) * sort.dir;
  });
  const th = (k, label, className = "") => (
    <SortTh key={k} k={k} label={label} sort={sort} onSort={onSort} className={className} testid={`${id}-sort-${k}`} />
  );
  return { sorted, th, sort };
}
