import type { Freq } from "../../../models";

export const FREQS: { key: Freq; label: string }[] = [
  { key: "once", label: "Não repetir" },
  { key: "daily", label: "Todos os dias" },
  { key: "weekly", label: "Dias da semana" },
  { key: "interval", label: "Intervalo de dias" },
];
