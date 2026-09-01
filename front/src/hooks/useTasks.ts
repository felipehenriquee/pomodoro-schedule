import { useCallback, useEffect, useState } from "react";
import { taskService, isDesktop } from "../services";
import type { Task } from "../models";

export function useTasks(dayAgendaId: number, seq: number, templateId?: number) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const reload = useCallback(async () => {
    if (!isDesktop) return;
    try {
      setTasks(await taskService.list(dayAgendaId, seq));
    } catch {
      /* ignore */
    }
  }, [dayAgendaId, seq]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      await taskService.add(dayAgendaId, seq, text.trim());
      await reload();
    },
    [dayAgendaId, seq, reload]
  );

  /** Copy a task to this same focus position on every day of the schedule. */
  const propagate = useCallback(
    async (text: string) => {
      if (!templateId || !text.trim()) return;
      await taskService.addForTemplate(templateId, seq, text.trim());
      await reload();
    },
    [templateId, seq, reload]
  );

  const update = useCallback(
    async (id: number, text: string) => {
      if (!text.trim()) return;
      await taskService.update(id, text.trim());
      await reload();
    },
    [reload]
  );

  const toggle = useCallback(
    async (id: number, done: boolean) => {
      await taskService.setDone(id, done);
      await reload();
    },
    [reload]
  );

  const remove = useCallback(
    async (id: number) => {
      await taskService.remove(id);
      await reload();
    },
    [reload]
  );

  return {
    tasks,
    reload,
    add,
    update,
    toggle,
    remove,
    propagate: templateId ? propagate : undefined,
  };
}
