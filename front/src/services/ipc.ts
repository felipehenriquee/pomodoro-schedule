import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  Block,
  BlockCreate,
  BlockEdit,
  BlockKind,
  Boundary,
  CurrentBlock,
  Task,
  Template,
  TemplateInput,
} from "../models";

type Unsub = () => void;

/**
 * Low-level transport gateway. The domain services (templateService,
 * blockService, taskService) wrap this; components should use those.
 */
export interface PomodoroApi {
  listTemplates(): Promise<Template[]>;
  saveTemplate(input: TemplateInput): Promise<number>;
  deleteTemplate(id: number): Promise<void>;
  materializeRange(from: string, to: string): Promise<number>;
  getBlocks(from: string, to: string): Promise<Block[]>;
  getCurrentBlock(): Promise<CurrentBlock>;
  nextOfKind(kind: BlockKind): Promise<Block | null>;
  setBlockStatus(id: number, status: string): Promise<void>;
  updateBlock(edit: BlockEdit): Promise<void>;
  createBlock(input: BlockCreate): Promise<boolean>;
  deleteBlock(id: number): Promise<void>;
  deleteCancelled(): Promise<number>;
  exportData(): Promise<string>;
  importData(json: string): Promise<void>;
  listTasks(dayAgendaId: number, seq: number): Promise<Task[]>;
  addTask(dayAgendaId: number, seq: number, text: string): Promise<number>;
  updateTask(id: number, text: string): Promise<void>;
  setTaskDone(id: number, done: boolean): Promise<void>;
  deleteTask(id: number): Promise<void>;
  onBlockBoundary(cb: (p: { boundary: Boundary }) => void): Unsub;
}

// Electron exposes `window.api` via preload; Tauri uses invoke/listen.
const electronApi = (window as unknown as { api?: PomodoroApi }).api;
const tauriEnv =
  typeof window !== "undefined" &&
  ("__TAURI_INTERNALS__" in window || "isTauri" in window);

export const isDesktop = !!electronApi || tauriEnv;
/** @deprecated use `isDesktop` */
export const isTauri = isDesktop;

const tauriApi: PomodoroApi = {
  listTemplates: () => invoke<Template[]>("list_templates"),
  saveTemplate: (input) => invoke<number>("save_template", { input }),
  deleteTemplate: (id) => invoke<void>("delete_template", { id }),
  materializeRange: (from, to) => invoke<number>("materialize_range", { from, to }),
  getBlocks: (from, to) => invoke<Block[]>("get_blocks", { from, to }),
  getCurrentBlock: () => invoke<CurrentBlock>("get_current_block"),
  nextOfKind: (kind) => invoke<Block | null>("next_of_kind", { kind }),
  setBlockStatus: (id, status) => invoke<void>("set_block_status", { id, status }),
  updateBlock: (edit) => invoke<void>("update_block", { edit }),
  createBlock: (input) => invoke<boolean>("create_block", { input }),
  deleteBlock: (id) => invoke<void>("delete_block", { id }),
  deleteCancelled: () => invoke<number>("delete_cancelled"),
  exportData: () => invoke<string>("export_data"),
  importData: (json) => invoke<void>("import_data", { json }),
  listTasks: (dayAgendaId, seq) =>
    invoke<Task[]>("list_tasks", { dayAgendaId, seq }),
  addTask: (dayAgendaId, seq, text) =>
    invoke<number>("add_task", { dayAgendaId, seq, text }),
  updateTask: (id, text) => invoke<void>("update_task", { id, text }),
  setTaskDone: (id, done) => invoke<void>("set_task_done", { id, done }),
  deleteTask: (id) => invoke<void>("delete_task", { id }),
  onBlockBoundary: (cb) => {
    let unlisten: Unsub | undefined;
    void listen<{ boundary: Boundary }>("block-boundary", (e) =>
      cb(e.payload)
    ).then((u) => {
      unlisten = u;
    });
    return () => unlisten?.();
  },
};

export const api: PomodoroApi = electronApi ?? tauriApi;
