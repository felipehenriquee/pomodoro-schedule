import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useTranslation } from "react-i18next";
import { blockColors, cancelledColors } from "../lib/colors";
import { isoDate } from "../lib/time";
import type { Block, BlockKind } from "../models";

const KIND_KEY: Record<BlockKind, string> = {
  work: "calendar.kind.work",
  short_break: "calendar.kind.shortBreak",
  long_break: "calendar.kind.longBreak",
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
  const { t, i18n } = useTranslation();

  return (
    <FullCalendar
      plugins={[timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      locale={i18n.language === "en" ? "en" : "pt-br"}
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
        const style = cancelled ? cancelledColors : blockColors[b.kind];
        return {
          id: String(b.id),
          title:
            (cancelled ? t("calendar.cancelledPrefix") : "") +
            (b.label ?? t(KIND_KEY[b.kind])),
          start: b.start_ts,
          end: b.end_ts,
          backgroundColor: style.bg,
          borderColor: style.border,
          textColor: style.text,
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
