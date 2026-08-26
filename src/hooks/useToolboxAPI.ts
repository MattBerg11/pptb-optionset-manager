import { useCallback, useEffect, useState } from "react";

export interface LogEntry {
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
}

export function useConnection(): {
  connection: ToolBoxAPI.DataverseConnection | null;
  isLoading: boolean;
  refreshConnection: () => Promise<void>;
} {
  const [connection, setConnection] =
    useState<ToolBoxAPI.DataverseConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshConnection = useCallback(async () => {
    try {
      const conn = await window.toolboxAPI?.connections?.getActiveConnection?.();
      setConnection(conn);
    } catch {
      setConnection(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);

  // React to PPTB connection lifecycle events
  useToolboxEvents(
    useCallback(
      (event: ToolBoxAPI.ToolBoxEvent) => {
        if (event === "connection:created" || event === "connection:updated" || event === "connection:deleted") {
          void refreshConnection();
        }
      },
      [refreshConnection],
    ),
  );

  return { connection, isLoading, refreshConnection };
}

export function useToolboxEvents(
  onEvent: (event: ToolBoxAPI.ToolBoxEvent, data: unknown) => void,
): void {
  useEffect(() => {
    if (!window.toolboxAPI?.events) {
      return;
    }

    const handler = (
      _event: unknown,
      payload: ToolBoxAPI.ToolBoxEventPayload,
    ) => {
      onEvent(payload.event, payload.data);
    };

    window.toolboxAPI.events.on(handler);

    return () => {
      window.toolboxAPI?.events?.off(handler);
    };
  }, [onEvent]);
}
