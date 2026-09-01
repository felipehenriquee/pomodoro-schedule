// Central color tokens. The hex values mirror the CSS custom properties in
// src/styles.css (:root) -- keep the two in sync. Import from here whenever a
// color is needed in JS (e.g. FullCalendar events, styled inline).
import type { BlockKind } from "../models";

export const color = {
  primary: "#175676",
  secondary: "#4ba3c3",
  longBreak: "#8cc5dc",
  longBreakBorder: "#5fa8c9", // darker edge so it survives the "today" column
  ink: "#0f3345", // dark text on light backgrounds
  white: "#ffffff",
  cancelled: "#ce2d4f", // schedule stopped occurring
} as const;

type BlockStyle = { bg: string; text: string; border: string };

/** Per-kind calendar colors: fill, text, border. */
export const blockColors: Record<BlockKind, BlockStyle> = {
  work: { bg: color.primary, text: color.white, border: color.primary },
  short_break: {
    bg: color.secondary,
    text: color.white,
    border: color.secondary,
  },
  long_break: {
    bg: color.longBreak,
    text: color.ink,
    border: color.longBreakBorder,
  },
};

export const cancelledColors: BlockStyle = {
  bg: color.cancelled,
  text: color.white,
  border: color.cancelled,
};
