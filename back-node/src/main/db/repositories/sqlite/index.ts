import type { DB } from "../../index";
import type { Repositories } from "../types";
import { SqliteTemplateRepo } from "./template.repo";
import { SqliteDayAgendaRepo } from "./day-agenda.repo";
import { SqliteBlockRepo } from "./block.repo";
import { SqliteBlockSlotRepo } from "./block-slot.repo";
import { SqliteTaskRepo } from "./task.repo";

export { SqliteTemplateRepo } from "./template.repo";
export { SqliteDayAgendaRepo } from "./day-agenda.repo";
export { SqliteBlockRepo } from "./block.repo";
export { SqliteBlockSlotRepo } from "./block-slot.repo";
export { SqliteTaskRepo } from "./task.repo";

export function createSqliteRepositories(db: DB): Repositories {
  return {
    templates: new SqliteTemplateRepo(db),
    dayAgendas: new SqliteDayAgendaRepo(db),
    blocks: new SqliteBlockRepo(db),
    blockSlots: new SqliteBlockSlotRepo(db),
    tasks: new SqliteTaskRepo(db),
  };
}
