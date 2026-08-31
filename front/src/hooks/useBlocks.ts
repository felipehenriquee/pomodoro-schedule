import { useCallback, useEffect, useState } from "react";
import { api, isDesktop } from "../lib/ipc";
import type { Block } from "../lib/types";

/** Materializa o intervalo e devolve os blocos [from, to] (datas "YYYY-MM-DD"). */
export function useBlocks(from: string, to: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isDesktop) return;
    setLoading(true);
    setError(null);
    try {
      await api.materializeRange(from, to);
      setBlocks(await api.getBlocks(from, to));
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
