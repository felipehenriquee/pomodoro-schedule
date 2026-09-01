import type { BlockKind } from "../../models";

/** Selectable event kinds + their default duration (minutes). */
export const KINDS: { key: BlockKind; label: string; min: number }[] = [
  { key: "work", label: "Foco", min: 50 },
  { key: "short_break", label: "Pausa curta", min: 10 },
  { key: "long_break", label: "Pausa longa", min: 60 },
];
