import { useCallback, useEffect, useState } from "react";
import { blockService, isDesktop } from "../services";
import type { Block } from "../models";

/** Materializes the range and returns the blocks [from, to] ("YYYY-MM-DD" dates). */
export function useBlocks(from: string, to: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isDesktop) return;
    setLoading(true);
    setError(null);
    try {
      await blockService.materialize(from, to);
      setBlocks(await blockService.range(from, to));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { blocks, loading, error, reload };
}
