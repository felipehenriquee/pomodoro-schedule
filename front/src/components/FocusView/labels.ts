import type { BlockKind } from "../../models";

export const KIND_LABEL: Record<BlockKind, string> = {
  work: "Pomodoro",
  short_break: "Descanso curto",
  long_break: "Descanso longo",
};

// used in "2o foco do dia", "3o descanso curto do dia"
export const NTH_LABEL: Record<BlockKind, string> = {
  work: "foco",
  short_break: "descanso curto",
  long_break: "descanso longo",
};
