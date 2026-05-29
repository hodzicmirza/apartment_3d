import { createFileRoute } from "@tanstack/react-router";
import { Building3D } from "@/components/Building3D";

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
  return <Building3D />;
}
