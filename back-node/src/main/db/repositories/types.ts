import type { Block, BlockKind, Task, Template, TemplateInput } from "../../types";

export interface RowRef {
  id: number;
  start_ts: string;
  end_ts: string;
}

export interface SlotRow {
  kind: BlockKind;
  seq: number;
  label: string | null;
  duration_min: number | null;
  offset_min: number | null;
}

export interface TemplateRepo {
  list(): Template[];
  get(id: number): Template | undefined;
  create(input: TemplateInput): number;
  update(id: number, input: TemplateInput): void;
  updateFields(
    id: number,
    fields: Partial<
      Pick<Template, "name" | "work_min" | "short_break_min">
    >
  ): void;
  /** edits a specific long break (by long_break row id) */
  setLongBreak(
    id: number,
    startTime: string,
    endTime: string,
    label: string
  ): void;
  remove(id: number): void;
}

export interface DayAgendaRepo {
  /** creates (if needed) and returns the day's id + locked for that template */
  ensure(date: string, templateId: number): { id: number; locked: number };
  firstForDate(date: string): number | undefined;
  createForDate(date: string, templateId: number, locked: boolean): number;
  lock(id: number): void;
  /** deletes blocks of not-yet-locked days >= fromDate (regenerated on the next materialize) */
  clearFutureUnlockedBlocks(templateId: number, fromDate: string): void;
  /** a template's days (id + date + locked) from fromDate on, ASC */
  listForTemplateFrom(
    templateId: number,
    fromDate: string
  ): { id: number; date: string; locked: number }[];
}

export interface BlockRepo {
  range(from: string, to: string): Block[];
  get(id: number): Block | undefined;
  current(nowIso: string): Block | undefined;
  next(nowIso: string): Block | undefined;
  /** next block of a specific kind starting after nowIso (any day) */
  nextOfKind(nowIso: string, kind: string): Block | undefined;
  nextEndingAfter(nowIso: string): { end_ts: string; kind: string } | undefined;

  /** INSERT OR IGNORE (by day+start_ts). returns rows inserted (0 or 1) */
  insertIgnore(
    dayAgendaId: number,
    kind: string,
    seq: number,
    startTs: string,
    endTs: string,
    label: string | null
  ): number;

  /** renames the slot (template_id, kind, seq) on days >= fromDate */
  setLabelForSlot(
    templateId: number,
    kind: string,
    seq: number,
    label: string | null,
    fromDate: string
  ): void;

  /** inserts an ad-hoc event (manual=1). returns the new id */
  insertManual(
    dayAgendaId: number,
    kind: string,
    startTs: string,
    endTs: string,
    label: string | null
  ): number;

  setTime(id: number, startTs: string, endTs: string, label: string | null): void;
  shift(id: number, startTs: string, endTs: string): void;
  setStatus(id: number, status: string): void;
  markDoneBefore(nowIso: string): void;
  /** deletes every block of a day */
  deleteForDayAgenda(dayAgendaId: number): void;
  /** marks the day's blocks starting after afterIso as 'skipped' */
  markSkippedForDayAgendaAfter(dayAgendaId: number, afterIso: string): void;
  remove(id: number): void;
  /** permanently deletes every cancelled block; returns how many */
  deleteAllSkipped(): number;

  /** the day's blocks with start_ts >= ts (ASC), excluding excludeId */
  after(dayAgendaId: number, excludeId: number, tsIso: string): RowRef[];
  /** the day's blocks that don't end before ts: end_ts > ts (ASC), excluding excludeId */
  notBefore(dayAgendaId: number, excludeId: number, tsIso: string): RowRef[];
}

export interface BlockSlotRepo {
  forTemplate(templateId: number): SlotRow[];
  upsert(
    templateId: number,
    kind: string,
    seq: number,
    label: string | null,
    durationMin: number | null,
    offsetMin: number | null
  ): void;
}

export interface TaskRepo {
  /** tasks of a focus event (day + seq position) */
  list(dayAgendaId: number, seq: number): Task[];
  add(dayAgendaId: number, seq: number, text: string): number;
  update(id: number, text: string): void;
  setDone(id: number, done: boolean): void;
  remove(id: number): void;
  removeForTemplate(templateId: number): void;
}

export interface Repositories {
  templates: TemplateRepo;
  dayAgendas: DayAgendaRepo;
  blocks: BlockRepo;
  blockSlots: BlockSlotRepo;
  tasks: TaskRepo;
}
