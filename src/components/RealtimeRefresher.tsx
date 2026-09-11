"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  /** One or more tables to watch for INSERT/UPDATE/DELETE. */
  tables: string[];
  /** Optional postgres_changes filter per table, e.g. "collector_id=eq.<uuid>". */
  filters?: Record<string, string>;
  /** Unique channel name so multiple watchers on one page don't collide. */
  channelName: string;
};

/**
 * Subscribes to Supabase Realtime `postgres_changes` on the given tables and
 * refreshes the current route's server data whenever a relevant row changes —
 * e.g. a citizen creating a pickup shows up for the aggregator/collector live,
 * without anyone needing to manually reload.
 */
export function RealtimeRefresher({ tables, filters, channelName }: Props) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    function scheduleRefresh() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => router.refresh(), 400);
    }

    // Explicitly hand the current session's JWT to the realtime socket before
    // subscribing — postgres_changes evaluates each subscriber's RLS using this
    // token, and it needs to be set prior to `.subscribe()` for row-level
    // filtering to work reliably (the SSR cookie-backed client doesn't always
    // sync it to the realtime socket automatically before the first connect).
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token);
      }

      channel = supabase.channel(channelName);

      for (const table of tables) {
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            ...(filters?.[table] ? { filter: filters[table] } : {}),
          },
          scheduleRefresh
        );
      }

      channel.subscribe();
    });

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);

  return null;
}
