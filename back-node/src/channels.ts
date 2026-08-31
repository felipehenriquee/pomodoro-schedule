/** Nomes dos canais IPC. Usado pelo main e pelo preload. */
export const CH = {
  templatesList: "templates:list",
  templatesSave: "templates:save",
  templatesDelete: "templates:delete",
  blocksMaterialize: "blocks:materialize",
  blocksRange: "blocks:range",
  blocksCurrent: "blocks:current",
  blocksNextOfKind: "blocks:nextOfKind",
  blocksSetStatus: "blocks:setStatus",
  blocksUpdate: "blocks:update",
  blocksCreate: "blocks:create",
  blocksDelete: "blocks:delete",
  blocksDeleteCancelled: "blocks:deleteCancelled",
  tasksList: "tasks:list",
  tasksAdd: "tasks:add",
  tasksUpdate: "tasks:update",
  tasksSetDone: "tasks:setDone",
  tasksDelete: "tasks:delete",
  dataExport: "data:export",
  dataImport: "data:import",
  // evento main -> renderer
  evtBlockBoundary: "block-boundary",
} as const;
