import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const Building3D = lazy(() =>
  import("@/components/Building3D").then((m) => ({ default: m.Building3D }))
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rezidencija Vista · Interaktivni 3D prikaz zgrade" },
      {
        name: "description",
        content:
          "Istražite stanove u 3D prikazu zgrade. Kliknite na stan za detalje, cijenu i dostupnost.",
      },
      { property: "og:title", content: "Rezidencija Vista · 3D zgrada" },
      {
        property: "og:description",
        content:
          "Interaktivni 3D model zgrade s klikabilnim stanovima i detaljima.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 to-stone-200">
        <div className="text-muted-foreground text-sm">Učitavam 3D prikaz…</div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 to-stone-200">
          <div className="text-muted-foreground text-sm">Učitavam 3D prikaz…</div>
        </div>
      }
    >
      <Building3D />
    </Suspense>
  );
}
