import { createFileRoute } from "@tanstack/react-router";
import { Notebook } from "@/components/Notebook";
import { NBAScores } from "@/components/NBAScores";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Courtside Notes — Notebook with live NBA scores" },
      {
        name: "description",
        content:
          "A simple notebook app with live NBA scores on the side, auto-refreshing every 10 minutes.",
      },
      { property: "og:title", content: "Courtside Notes" },
      {
        property: "og:description",
        content: "Notebook with live NBA scores on the side.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <main className="min-w-0 flex-1">
        <Notebook />
      </main>
      <div className="hidden w-80 shrink-0 md:block">
        <NBAScores />
      </div>
    </div>
  );
}
