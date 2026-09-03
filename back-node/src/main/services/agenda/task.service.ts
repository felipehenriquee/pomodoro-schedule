import type { Task } from "../../types";
import { dateStr } from "../../util/time";
import type { AgendaContext } from "../context";

/** Tasks of a focus event (day + seq position). */
export function listTasks(
  ctx: AgendaContext,
  dayAgendaId: number,
  seq: number
): Task[] {
  return ctx.repos.tasks.list(dayAgendaId, seq);
}

export function addTask(
  ctx: AgendaContext,
  dayAgendaId: number,
  seq: number,
  text: string
): number {
  return ctx.repos.tasks.add(dayAgendaId, seq, text);
}

/**
 * Copies the task to the same focus position on every day of the schedule,
 * from today on.
 */
export function addTaskForTemplate(
  ctx: AgendaContext,
  templateId: number,
  seq: number,
  text: string
): number {
  return ctx.repos.tasks.addForTemplate(templateId, seq, text, dateStr());
}

export function updateTask(ctx: AgendaContext, id: number, text: string): void {
  ctx.repos.tasks.update(id, text);
}

export function setTaskDone(
  ctx: AgendaContext,
  id: number,
  done: boolean
): void {
  ctx.repos.tasks.setDone(id, done);
}

export function deleteTask(ctx: AgendaContext, id: number): void {
  ctx.repos.tasks.remove(id);
}
