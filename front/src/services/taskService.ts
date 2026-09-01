import type { Task } from "../models";
import { api } from "./ipc";

export const taskService = {
  list: (dayAgendaId: number, seq: number): Promise<Task[]> =>
    api.listTasks(dayAgendaId, seq),
  add: (dayAgendaId: number, seq: number, text: string): Promise<number> =>
    api.addTask(dayAgendaId, seq, text),
  update: (id: number, text: string): Promise<void> => api.updateTask(id, text),
  setDone: (id: number, done: boolean): Promise<void> =>
    api.setTaskDone(id, done),
  remove: (id: number): Promise<void> => api.deleteTask(id),
};
