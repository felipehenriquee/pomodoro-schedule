import type {
  Block,
  BlockCreate,
  BlockEdit,
  BlockKind,
  Boundary,
  CurrentBlock,
} from "../models";
import { api } from "./ipc";

export const blockService = {
  /** Materializes [from, to] on the backend, then returns the blocks in range. */
  range: (from: string, to: string): Promise<Block[]> => api.getBlocks(from, to),
  materialize: (from: string, to: string): Promise<number> =>
    api.materializeRange(from, to),
  current: (): Promise<CurrentBlock> => api.getCurrentBlock(),
  nextOfKind: (kind: BlockKind): Promise<Block | null> => api.nextOfKind(kind),
  update: (edit: BlockEdit): Promise<void> => api.updateBlock(edit),
  /** Returns true when it had to push later blocks to avoid a time clash. */
  create: (input: BlockCreate): Promise<boolean> => api.createBlock(input),
  remove: (id: number): Promise<void> => api.deleteBlock(id),
  setStatus: (id: number, status: string): Promise<void> =>
    api.setBlockStatus(id, status),
  /** Brings a cancelled ("skipped") block back to "pending". */
  restore: (id: number): Promise<void> => api.setBlockStatus(id, "pending"),
  clearCancelled: (): Promise<number> => api.deleteCancelled(),
  onBoundary: (cb: (p: { boundary: Boundary }) => void): (() => void) =>
    api.onBlockBoundary(cb),
};
