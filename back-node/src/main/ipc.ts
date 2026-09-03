import { ipcMain } from "electron";
import { CH } from "../channels";
import { getContext } from "./services/context";
import * as svc from "./services/agenda";
import type { BlockCreate, BlockEdit, TemplateInput } from "./types";

export function registerIpc(): void {
  ipcMain.handle(CH.templatesList, () => svc.listTemplates(getContext()));
  ipcMain.handle(CH.templatesSave, (_e, input: TemplateInput) =>
    svc.saveTemplate(getContext(), input)
  );
  ipcMain.handle(CH.templatesDelete, (_e, id: number) =>
    svc.deleteTemplate(getContext(), id)
  );

  ipcMain.handle(CH.blocksMaterialize, (_e, from: string, to: string) =>
    svc.materialize(getContext(), from, to)
  );
  ipcMain.handle(CH.blocksRange, (_e, from: string, to: string) =>
    svc.getBlocks(getContext(), from, to)
  );
  ipcMain.handle(CH.blocksCurrent, () => svc.getCurrentBlock(getContext()));
  ipcMain.handle(CH.blocksNextOfKind, (_e, kind: string) =>
    svc.getNextOfKind(getContext(), kind)
  );
  ipcMain.handle(CH.blocksSetStatus, (_e, id: number, status: string) =>
    svc.setBlockStatus(getContext(), id, status)
  );
  ipcMain.handle(CH.blocksUpdate, (_e, edit: BlockEdit) =>
    svc.updateBlock(getContext(), edit)
  );
  ipcMain.handle(CH.blocksCreate, (_e, input: BlockCreate) =>
    svc.createBlock(getContext(), input)
  );
  ipcMain.handle(CH.blocksDelete, (_e, id: number) =>
    svc.deleteBlock(getContext(), id)
  );
  ipcMain.handle(CH.blocksDeleteCancelled, () =>
    svc.deleteCancelledBlocks(getContext())
  );

  ipcMain.handle(CH.tasksList, (_e, dayAgendaId: number, seq: number) =>
    svc.listTasks(getContext(), dayAgendaId, seq)
  );
  ipcMain.handle(
    CH.tasksAdd,
    (_e, dayAgendaId: number, seq: number, text: string) => {
      const t = String(text).trim();
      if (!t) throw new Error("tarefa vazia");
      return svc.addTask(getContext(), dayAgendaId, seq, t);
    }
  );
  ipcMain.handle(
    CH.tasksAddForTemplate,
    (_e, templateId: number, seq: number, text: string) => {
      const t = String(text).trim();
      if (!t) throw new Error("tarefa vazia");
      return svc.addTaskForTemplate(getContext(), templateId, seq, t);
    }
  );
  ipcMain.handle(CH.tasksUpdate, (_e, id: number, text: string) => {
    const t = String(text).trim();
    if (!t) throw new Error("tarefa vazia");
    return svc.updateTask(getContext(), id, t);
  });
  ipcMain.handle(CH.tasksSetDone, (_e, id: number, done: boolean) =>
    svc.setTaskDone(getContext(), id, done)
  );
  ipcMain.handle(CH.tasksDelete, (_e, id: number) =>
    svc.deleteTask(getContext(), id)
  );

  ipcMain.handle(CH.dataExport, () => svc.exportData(getContext()));
  ipcMain.handle(CH.dataImport, (_e, json: string) =>
    svc.importData(getContext(), json)
  );
}
