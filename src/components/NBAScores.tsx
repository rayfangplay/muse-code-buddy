import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type Game = {
  id: string;
  status: string;
  state: "pre" | "in" | "post";
  home: { name: string; abbr: string; score: string; logo?: string };
  away: { name: string; abbr: string; score: string; logo?: string };
};

const ENDPOINT =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

export function NBAScores() {
  const [games, setGames] = useState<Game[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const timerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINT);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const parsed: Game[] = (data.events ?? []).map((ev: any) => {
        const comp = ev.competitions?.[0];
        const competitors = comp?.competitors ?? [];
        const home = competitors.find((c: any) => c.homeAway === "home");
        const away = competitors.find((c: any) => c.homeAway === "away");
        const status = ev.status?.type;
        return {
          id: ev.id,
          status: status?.shortDetail ?? "",
          state: status?.state ?? "pre",
          home: {
            name: home?.team?.shortDisplayName ?? "",
            abbr: home?.team?.abbreviation ?? "",
            score: home?.score ?? "0",
            logo: home?.team?.logo,
          },
          away: {
            name: away?.team?.shortDisplayName ?? "",
            abbr: away?.team?.abbreviation ?? "",
            score: away?.score ?? "0",
            logo: away?.team?.logo,
          },
        };
      });
      setGames(parsed);
      setUpdatedAt(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load scores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    timerRef.current = window.setInterval(load, 10 * 60 * 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [load]);

  return (
    <aside className="flex h-full w-full flex-col border-l bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">NBA Scores</h2>
          <p className="text-[11px] text-muted-foreground">
            {updatedAt
              ? `Updated ${updatedAt.toLocaleTimeString()}`
              : "Loading…"}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={load}
          disabled={loading}
          aria-label="Reload scores"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        {!error && games && games.length === 0 && (
          <p className="px-1 text-xs text-muted-foreground">
            No games scheduled today.
          </p>
        )}
        {games?.map((g) => (
          <div
            key={g.id}
            className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`text-[10px] font-medium uppercase tracking-wide ${
                  g.state === "in"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {g.status}
              </span>
            </div>
            <Row team={g.away} active={g.state !== "pre"} />
            <Row team={g.home} active={g.state !== "pre"} />
          </div>
        ))}
      </div>
    </aside>
  );
}

function Row({
  team,
  active,
}: {
  team: { name: string; abbr: string; score: string; logo?: string };
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {team.logo ? (
          <img src={team.logo} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <div className="h-5 w-5 rounded bg-muted" />
        )}
        <span className="text-sm font-medium">{team.abbr}</span>
        <span className="text-xs text-muted-foreground">{team.name}</span>
      </div>
      <span
        className={`text-sm tabular-nums ${
          active ? "font-semibold" : "text-muted-foreground"
        }`}
      >
        {team.score}
      </span>
    </div>
  );
}
