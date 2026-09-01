import { contextBridge, ipcRenderer } from "electron";
import { CH } from "../channels";
import type {
  Block,
  BlockCreate,
  BlockEdit,
  BlockKind,
  CurrentBlock,
  Task,
  Template,
  TemplateInput,
} from "../main/types";

const api = {
  listTemplates: (): Promise<Template[]> => ipcRenderer.invoke(CH.templatesList),
  saveTemplate: (input: TemplateInput): Promise<number> =>
    ipcRenderer.invoke(CH.templatesSave, input),
  deleteTemplate: (id: number): Promise<void> =>
    ipcRenderer.invoke(CH.templatesDelete, id),

  materializeRange: (from: string, to: string): Promise<number> =>
    ipcRenderer.invoke(CH.blocksMaterialize, from, to),
  getBlocks: (from: string, to: string): Promise<Block[]> =>
    ipcRenderer.invoke(CH.blocksRange, from, to),
  getCurrentBlock: (): Promise<CurrentBlock> =>
    ipcRenderer.invoke(CH.blocksCurrent),
  nextOfKind: (kind: BlockKind): Promise<Block | null> =>
    ipcRenderer.invoke(CH.blocksNextOfKind, kind),
  setBlockStatus: (id: number, status: string): Promise<void> =>
    ipcRenderer.invoke(CH.blocksSetStatus, id, status),
  updateBlock: (edit: BlockEdit): Promise<void> =>
    ipcRenderer.invoke(CH.blocksUpdate, edit),
  createBlock: (input: BlockCreate): Promise<boolean> =>
    ipcRenderer.invoke(CH.blocksCreate, input),
  deleteBlock: (id: number): Promise<void> =>
    ipcRenderer.invoke(CH.blocksDelete, id),
  deleteCancelled: (): Promise<number> =>
    ipcRenderer.invoke(CH.blocksDeleteCancelled),

  listTasks: (dayAgendaId: number, seq: number): Promise<Task[]> =>
    ipcRenderer.invoke(CH.tasksList, dayAgendaId, seq),
  addTask: (dayAgendaId: number, seq: number, text: string): Promise<number> =>
    ipcRenderer.invoke(CH.tasksAdd, dayAgendaId, seq, text),
  updateTask: (id: number, text: string): Promise<void> =>
    ipcRenderer.invoke(CH.tasksUpdate, id, text),
  setTaskDone: (id: number, done: boolean): Promise<void> =>
    ipcRenderer.invoke(CH.tasksSetDone, id, done),
  deleteTask: (id: number): Promise<void> =>
    ipcRenderer.invoke(CH.tasksDelete, id),

  exportData: (): Promise<string> => ipcRenderer.invoke(CH.dataExport),
  importData: (json: string): Promise<void> =>
    ipcRenderer.invoke(CH.dataImport, json),

  /** subscribes to the block-boundary event; returns an unsubscribe function */
  onBlockBoundary: (cb: (p: { boundary: "work_end" | "work_start" }) => void) => {
    const handler = (_e: unknown, payload: { boundary: "work_end" | "work_start" }) =>
      cb(payload);
    ipcRenderer.on(CH.evtBlockBoundary, handler);
    return () => {
      ipcRenderer.removeListener(CH.evtBlockBoundary, handler);
    };
  },
};

export type PomodoroApi = typeof api;

contextBridge.exposeInMainWorld("api", api);
