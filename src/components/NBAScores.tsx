import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Star, ChevronDown } from "lucide-react";

type Team = {
  id: string;
  name: string;
  abbr: string;
  score: string;
  logo?: string;
  record?: string;
  linescores?: { value: number }[];
};

type Game = {
  id: string;
  status: string;
  state: "pre" | "in" | "post";
  period?: number;
  clock?: string;
  home: Team;
  away: Team;
  venue?: string;
  broadcast?: string;
};

type Standing = {
  abbr: string;
  name: string;
  wins: number;
  losses: number;
  pct: string;
  conf: "east" | "west";
};

const SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const STANDINGS =
  "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings";
const FAV_KEY = "nba.favorite.team.v1";

type Tab = "today" | "standings";

export function NBAScores() {
  const [tab, setTab] = useState<Tab>("today");
  const [games, setGames] = useState<Game[] | null>(null);
  const [standings, setStandings] = useState<Standing[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [favorite, setFavorite] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setFavorite(localStorage.getItem(FAV_KEY));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sb, st] = await Promise.all([
        fetch(SCOREBOARD).then((r) => r.json()),
        fetch(STANDINGS).then((r) => r.json()).catch(() => null),
      ]);
      const parsed: Game[] = (sb.events ?? []).map((ev: any) => {
        const comp = ev.competitions?.[0];
        const cs = comp?.competitors ?? [];
        const home = cs.find((c: any) => c.homeAway === "home");
        const away = cs.find((c: any) => c.homeAway === "away");
        const status = ev.status?.type;
        const mkTeam = (c: any): Team => ({
          id: c?.team?.id ?? "",
          name: c?.team?.shortDisplayName ?? "",
          abbr: c?.team?.abbreviation ?? "",
          score: c?.score ?? "0",
          logo: c?.team?.logo,
          record: c?.records?.[0]?.summary,
          linescores: c?.linescores,
        });
        return {
          id: ev.id,
          status: status?.shortDetail ?? "",
          state: status?.state ?? "pre",
          period: ev.status?.period,
          clock: ev.status?.displayClock,
          home: mkTeam(home),
          away: mkTeam(away),
          venue: comp?.venue?.fullName,
          broadcast: comp?.broadcasts?.[0]?.names?.[0],
        };
      });
      setGames(parsed);

      if (st) {
        const flat: Standing[] = [];
        const conferences: any[] = st.children ?? [];
        conferences.forEach((conf) => {
          const isEast = (conf.abbreviation ?? "").toLowerCase().includes("e");
          (conf.standings?.entries ?? []).forEach((e: any) => {
            const stats = e.stats ?? [];
            const get = (n: string) =>
              stats.find((s: any) => s.name === n || s.shortDisplayName === n);
            flat.push({
              abbr: e.team?.abbreviation ?? "",
              name: e.team?.shortDisplayName ?? "",
              wins: Number(get("wins")?.value ?? 0),
              losses: Number(get("losses")?.value ?? 0),
              pct: String(get("winPercent")?.displayValue ?? ""),
              conf: isEast ? "east" : "west",
            });
          });
        });
        setStandings(flat);
      }
      setUpdatedAt(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
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

  const toggleFav = (abbr: string) => {
    const next = favorite === abbr ? null : abbr;
    setFavorite(next);
    if (next) localStorage.setItem(FAV_KEY, next);
    else localStorage.removeItem(FAV_KEY);
  };

  const sortedGames = useMemo(() => {
    if (!games) return null;
    const order = (g: Game) =>
      g.home.abbr === favorite || g.away.abbr === favorite
        ? -1
        : g.state === "in"
          ? 0
          : g.state === "pre"
            ? 1
            : 2;
    return [...games].sort((a, b) => order(a) - order(b));
  }, [games, favorite]);

  const liveCount = games?.filter((g) => g.state === "in").length ?? 0;

  return (
    <aside className="flex h-full w-full flex-col bg-[var(--color-panel)]">
      {/* Header */}
      <div className="border-b border-[var(--color-amber)]/20 p-5">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl leading-none text-[var(--color-amber)]">
            TONIGHT'S BOARD
          </h2>
          <button
            onClick={load}
            disabled={loading}
            aria-label="Reload"
            className="text-[var(--color-cyan)]/70 transition hover:text-[var(--color-cyan)]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
          <span className="text-[var(--color-cyan)]">
            {liveCount > 0 ? `${liveCount} LIVE` : "LIVE UPDATES"}
          </span>
          <span className="text-white/30">
            {updatedAt ? `SYNC ${updatedAt.toLocaleTimeString()}` : "SYNCING…"}
          </span>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 border-b border-white/5">
          {(["today", "standings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-3 py-2 font-display text-sm uppercase tracking-widest transition ${
                tab === t ? "text-white" : "text-white/30 hover:text-white/60"
              }`}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] bg-[var(--color-amber)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {tab === "today" && (
          <div className="space-y-3">
            {!error && sortedGames && sortedGames.length === 0 && (
              <p className="px-1 text-xs uppercase tracking-widest text-white/30">
                No games scheduled.
              </p>
            )}
            {sortedGames?.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                expanded={expandedId === g.id}
                onToggle={() =>
                  setExpandedId((id) => (id === g.id ? null : g.id))
                }
                favorite={favorite}
                onToggleFav={toggleFav}
              />
            ))}
          </div>
        )}

        {tab === "standings" && (
          <StandingsView standings={standings} favorite={favorite} />
        )}
      </div>

      <footer className="border-t border-[var(--color-amber)]/10 p-4 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
        TERMINAL v4.0.2 // NBA DATA LINK ACTIVE
      </footer>
    </aside>
  );
}

function GameCard({
  game,
  expanded,
  onToggle,
  favorite,
  onToggleFav,
}: {
  game: Game;
  expanded: boolean;
  onToggle: () => void;
  favorite: string | null;
  onToggleFav: (abbr: string) => void;
}) {
  const isLive = game.state === "in";
  const isFinal = game.state === "post";
  const isFav =
    favorite && (game.home.abbr === favorite || game.away.abbr === favorite);

  const border = isFav
    ? "border-l-2 border-[var(--color-amber)] border border-[var(--color-amber)]/40"
    : isLive
      ? "border border-[var(--color-cyan)]/40"
      : isFinal
        ? "border-l-2 border-[var(--color-amber)] border border-white/5"
        : "border border-white/5";

  return (
    <div className={`bg-[var(--color-ink)] ${border} transition`}>
      <button
        onClick={onToggle}
        className="w-full p-4 text-left"
      >
        <div className="mb-3 flex items-center justify-between">
          {isLive ? (
            <span className="bg-[var(--color-cyan)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--color-ink)]">
              {game.status}
            </span>
          ) : (
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                isFinal ? "text-[var(--color-amber)]" : "text-white/40"
              }`}
            >
              {game.status}
            </span>
          )}
          {game.broadcast && (
            <span className="text-[10px] font-bold uppercase text-white/30">
              {game.broadcast}
            </span>
          )}
        </div>

        <TeamRow team={game.away} isLive={isLive} isFinal={isFinal} />
        <div className="h-2" />
        <TeamRow team={game.home} isLive={isLive} isFinal={isFinal} />
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-4 py-3 text-xs">
          {game.away.linescores && game.away.linescores.length > 0 && (
            <div className="mb-3">
              <div className="grid grid-cols-[auto_repeat(4,1fr)_auto] gap-2 text-center font-display">
                <span className="text-left text-white/40">TEAM</span>
                {[1, 2, 3, 4].map((q) => (
                  <span key={q} className="text-white/40">
                    Q{q}
                  </span>
                ))}
                <span className="text-[var(--color-amber)]">T</span>
                <Linescore team={game.away} />
                <Linescore team={game.home} />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[10px] uppercase tracking-widest text-white/30">
              {game.venue ?? "Venue TBD"}
            </span>
            <div className="flex gap-2">
              <FavButton
                abbr={game.away.abbr}
                active={favorite === game.away.abbr}
                onClick={() => onToggleFav(game.away.abbr)}
              />
              <FavButton
                abbr={game.home.abbr}
                active={favorite === game.home.abbr}
                onClick={() => onToggleFav(game.home.abbr)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center pb-1">
        <ChevronDown
          className={`h-3 w-3 text-white/20 transition ${expanded ? "rotate-180" : ""}`}
        />
      </div>
    </div>
  );
}

function Linescore({ team }: { team: Team }) {
  const ls = team.linescores ?? [];
  const total = ls.reduce((a, b) => a + Number(b.value || 0), 0);
  return (
    <>
      <span className="text-left font-display text-base text-white">
        {team.abbr}
      </span>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="font-display text-base text-white/70">
          {ls[i]?.value ?? "-"}
        </span>
      ))}
      <span className="font-display text-base text-[var(--color-amber)]">
        {total || team.score}
      </span>
    </>
  );
}

function FavButton({
  abbr,
  active,
  onClick,
}: {
  abbr: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center gap-1 border px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition ${
        active
          ? "border-[var(--color-amber)] bg-[var(--color-amber)] text-[var(--color-ink)]"
          : "border-white/10 text-white/40 hover:border-[var(--color-amber)]/60 hover:text-[var(--color-amber)]"
      }`}
    >
      <Star className={`h-3 w-3 ${active ? "fill-current" : ""}`} />
      {abbr}
    </button>
  );
}

function TeamRow({
  team,
  isLive,
  isFinal,
}: {
  team: Team;
  isLive: boolean;
  isFinal: boolean;
}) {
  const winning =
    isFinal &&
    Number(team.score) >
      0; /* highlighted by parent via amber on winner — handled below */
  const scoreClass = isLive
    ? "text-[var(--color-cyan)]"
    : isFinal
      ? "text-white"
      : "text-white/30";
  return (
    <div className="flex items-center justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {team.logo ? (
          <img src={team.logo} alt="" className="h-6 w-6 object-contain" />
        ) : (
          <div className="h-6 w-6 bg-white/5" />
        )}
        <div className="flex flex-col">
          <span className="font-display text-2xl leading-none text-white">
            {team.abbr}
          </span>
          {team.record && (
            <span className="mt-0.5 text-[10px] uppercase tracking-widest text-white/30">
              {team.record}
            </span>
          )}
        </div>
      </div>
      <span className={`font-display text-3xl leading-none ${scoreClass}`}>
        {team.score === "0" && !isLive && !isFinal ? "—" : team.score}
      </span>
    </div>
  );
}

function StandingsView({
  standings,
  favorite,
}: {
  standings: Standing[] | null;
  favorite: string | null;
}) {
  if (!standings) {
    return (
      <p className="px-1 text-xs uppercase tracking-widest text-white/30">
        Loading standings…
      </p>
    );
  }
  const east = standings
    .filter((s) => s.conf === "east")
    .sort((a, b) => b.wins - a.wins);
  const west = standings
    .filter((s) => s.conf === "west")
    .sort((a, b) => b.wins - a.wins);

  return (
    <div className="space-y-6">
      <ConfTable title="EASTERN" rows={east} favorite={favorite} />
      <ConfTable title="WESTERN" rows={west} favorite={favorite} />
    </div>
  );
}

function ConfTable({
  title,
  rows,
  favorite,
}: {
  title: string;
  rows: Standing[];
  favorite: string | null;
}) {
  return (
    <div>
      <h3 className="mb-2 font-display text-xl tracking-widest text-[var(--color-amber)]">
        {title}
      </h3>
      <div className="space-y-px">
        {rows.map((r, i) => {
          const fav = favorite === r.abbr;
          return (
            <div
              key={r.abbr}
              className={`grid grid-cols-[24px_1fr_auto_auto] items-center gap-3 px-2 py-1.5 text-sm ${
                fav
                  ? "bg-[var(--color-amber)]/10 text-white"
                  : "text-white/70 hover:bg-white/5"
              }`}
            >
              <span className="text-[10px] font-bold text-white/30">
                {i + 1}
              </span>
              <span className="font-display text-base">{r.abbr}</span>
              <span className="font-mono text-xs tabular-nums text-white/60">
                {r.wins}-{r.losses}
              </span>
              <span className="font-mono text-xs tabular-nums text-[var(--color-cyan)]">
                {r.pct}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
