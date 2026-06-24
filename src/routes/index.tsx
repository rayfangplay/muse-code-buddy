import { createFileRoute } from "@tanstack/react-router";
import { Notebook } from "@/components/Notebook";
import { NBAScores } from "@/components/NBAScores";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Courtside Notes — Tactical notebook with live NBA scores" },
      {
        name: "description",
        content:
          "A hardwood-and-neon notebook for basketball minds. Write notes on the left, watch live NBA scores and standings on the right.",
      },
      { property: "og:title", content: "Courtside Notes" },
      {
        property: "og:description",
        content:
          "Tactical notebook with live NBA scores, favorite-team pinning, and standings.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-[var(--color-ink)] text-white"
      style={{ fontFamily: "Barlow, sans-serif" }}
    >
      <Notebook />
      <div className="hidden w-[380px] shrink-0 lg:block">
        <NBAScores />
      </div>
    </div>
  );
}
