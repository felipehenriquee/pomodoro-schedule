import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { isoDate } from "../lib/time";
import type { Block, BlockKind } from "../lib/types";

const COLORS: Record<BlockKind, string> = {
  work: "#175676", // primaria
  short_break: "#4BA3C3", // secundaria
  long_break: "#8CC5DC", // descanso longo
};

const TEXT: Record<BlockKind, string> = {
  work: "#ffffff",
  short_break: "#ffffff",
  long_break: "#0f3345", // fundo claro -> texto escuro
};

// borda mais escura em fundos claros (pra nao sumir na coluna do dia atual)
const BORDERS: Partial<Record<BlockKind, string>> = {
  long_break: "#5fa8c9",
};

const CANCELLED = "#CE2D4F"; // evento cancelado (agenda deixou de ocorrer)

const LABELS: Record<BlockKind, string> = {
  work: "Foco",
  short_break: "Pausa",
  long_break: "Pausa longa",
};

type Props = {
  blocks: Block[];
  onEventClick?: (blockId: number, x: number, y: number) => void;
  onDateClick?: (date: Date) => void;
  onRangeChange?: (from: string, to: string) => void;
};

export function Calendar({
  blocks,
  onEventClick,
  onDateClick,
  onRangeChange,
}: Props) {
  return (
    <FullCalendar
      plugins={[timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      locale="pt-br"
      firstDay={1}
      nowIndicator
      allDaySlot={false}
      slotMinTime="06:00:00"
      slotMaxTime="22:00:00"
      expandRows
      height="100%"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "timeGridWeek,timeGridDay",
      }}
      eventClick={(info) => {
        info.jsEvent.preventDefault();
        onEventClick?.(
          Number(info.event.id),
          info.jsEvent.clientX,
          info.jsEvent.clientY
        );
      }}
      dateClick={(info) => onDateClick?.(info.date)}
      datesSet={(arg) =>
        onRangeChange?.(
          isoDate(arg.start),
          isoDate(new Date(arg.end.getTime() - 1))
        )
      }
      events={blocks.map((b) => {
        const cancelled = b.status === "skipped";
        return {
          id: String(b.id),
          title:
            (cancelled ? "(cancelado) " : "") + (b.label ?? LABELS[b.kind]),
          start: b.start_ts,
          end: b.end_ts,
          backgroundColor: cancelled ? CANCELLED : COLORS[b.kind],
          borderColor: cancelled
            ? CANCELLED
            : BORDERS[b.kind] ?? COLORS[b.kind],
          textColor: cancelled ? "#ffffff" : TEXT[b.kind],
          classNames: cancelled
            ? ["blk-cancelled"]
            : b.status === "done"
              ? ["blk-done"]
              : [],
        };
      })}
    />
  );
}
