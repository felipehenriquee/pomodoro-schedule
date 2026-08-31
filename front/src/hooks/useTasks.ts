import { useCallback, useEffect, useState } from "react";
import { api, isDesktop } from "../lib/ipc";
import type { Task } from "../lib/types";

export function useTasks(dayAgendaId: number, seq: number) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const reload = useCallback(async () => {
    if (!isDesktop) return;
    try {
      setTasks(await api.listTasks(dayAgendaId, seq));
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
      await api.addTask(dayAgendaId, seq, text.trim());
      await reload();
    },
    [dayAgendaId, seq, reload]
  );

  const update = useCallback(
    async (id: number, text: string) => {
      if (!text.trim()) return;
      await api.updateTask(id, text.trim());
      await reload();
    },
    [reload]
  );

  const toggle = useCallback(
    async (id: number, done: boolean) => {
      await api.setTaskDone(id, done);
      await reload();
    },
    [reload]
  );

  const remove = useCallback(
    async (id: number) => {
      await api.deleteTask(id);
      await reload();
    },
    [reload]
  );

  return { tasks, reload, add, update, toggle, remove };
}
