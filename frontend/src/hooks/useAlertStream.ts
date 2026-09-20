import { useEffect, useRef, useState } from "react";
import { getBaseUrl } from "@/src/api";

export type LiveAlertEvent = {
  event: string;
  data: any;
  timestamp: string;
};

export function useAlertStream(regionId?: string, userId: string = "demo-user") {
  const [latestAlert, setLatestAlert] = useState<LiveAlertEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<any>(null);

  useEffect(() => {
    let unmounted = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (typeof window === "undefined" || !("EventSource" in window)) {
        return;
      }
      try {
        const url = `${getBaseUrl()}/alerts/stream?user_id=${encodeURIComponent(userId)}${
          regionId ? `&region_id=${encodeURIComponent(regionId)}` : ""
        }`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.addEventListener("open", () => {
          if (!unmounted) setConnected(true);
        });

        es.addEventListener("connected", (e: any) => {
          if (!unmounted) setConnected(true);
        });

        es.addEventListener("alert", (e: any) => {
          try {
            const parsed = JSON.parse(e.data);
            if (!unmounted) {
              setLatestAlert(parsed);
            }
          } catch {}
        });

        es.addEventListener("error", () => {
          if (!unmounted) setConnected(false);
          es.close();
          // Auto-reconnect after 8 seconds
          retryTimeout = setTimeout(() => {
            if (!unmounted) connect();
          }, 8000);
        });
      } catch (err) {
        if (!unmounted) setConnected(false);
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [regionId, userId]);

  return { latestAlert, connected };
}

