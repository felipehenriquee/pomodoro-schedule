import type { DB } from "../db/index";
import { getDb } from "../db/index";
import { createSqliteRepositories } from "../db/repositories/sqlite/index";
import type { Repositories } from "../db/repositories/types";

export interface AgendaContext {
  db: DB;
  repos: Repositories;
}

let ctx: AgendaContext | undefined;

/** Troque `createSqliteRepositories` por outra implementacao pra usar outro banco. */
export function getContext(): AgendaContext {
  if (!ctx) {
    const db = getDb();
    ctx = { db, repos: createSqliteRepositories(db) };
  }
  return ctx;
}
