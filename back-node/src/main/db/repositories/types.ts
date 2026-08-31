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
  /** edita uma pausa longa especifica (por id da linha long_break) */
  setLongBreak(
    id: number,
    startTime: string,
    endTime: string,
    label: string
  ): void;
  remove(id: number): void;
}

export interface DayAgendaRepo {
  /** cria (se preciso) e devolve id + locked do dia daquele template */
  ensure(date: string, templateId: number): { id: number; locked: number };
  firstForDate(date: string): number | undefined;
  createForDate(date: string, templateId: number, locked: boolean): number;
  lock(id: number): void;
  /** apaga blocos de dias >= fromDate ainda nao travados (regeram no proximo materialize) */
  clearFutureUnlockedBlocks(templateId: number, fromDate: string): void;
  /** dias (id + date + locked) de um template a partir de fromDate, ASC */
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
  /** proximo bloco de um kind especifico que comeca depois de nowIso (qualquer dia) */
  nextOfKind(nowIso: string, kind: string): Block | undefined;
  nextEndingAfter(nowIso: string): { end_ts: string; kind: string } | undefined;

  /** INSERT OR IGNORE (por dia+start_ts). retorna nº de linhas inseridas (0 ou 1) */
  insertIgnore(
    dayAgendaId: number,
    kind: string,
    seq: number,
    startTs: string,
    endTs: string,
    label: string | null
  ): number;

  /** renomeia o slot (template_id, kind, seq) nos dias >= fromDate */
  setLabelForSlot(
    templateId: number,
    kind: string,
    seq: number,
    label: string | null,
    fromDate: string
  ): void;

  /** insere evento avulso (manual=1). retorna id novo */
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
  /** apaga todos os blocos de um dia */
  deleteForDayAgenda(dayAgendaId: number): void;
  /** marca como 'skipped' os blocos do dia que comecam depois de afterIso */
  markSkippedForDayAgendaAfter(dayAgendaId: number, afterIso: string): void;
  remove(id: number): void;
  /** apaga de vez todos os blocos cancelados; retorna quantos */
  deleteAllSkipped(): number;

  /** blocos do dia com start_ts >= ts (ASC), excluindo excludeId */
  after(dayAgendaId: number, excludeId: number, tsIso: string): RowRef[];
  /** blocos do dia que nao terminam antes de ts: end_ts > ts (ASC), excluindo excludeId */
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
  /** tarefas de um evento de foco (dia + posicao seq) */
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
