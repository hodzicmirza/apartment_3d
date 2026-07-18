export interface Apartment {
  id: string;
  number: string;
  title: string;
  description: string;
  floor: number;
  unit_on_floor: number;
  side: "front" | "back";
  rooms: number;
  bathrooms: number;
  area: number;
  price: number;
  status: "available" | "reserved" | "sold";
  orientation: string;
  features: string[];
  image_url?: string;
}

export const getApartments = (): Apartment[] => {
  const list: Apartment[] = [];
  let n = 1;
  const sides: ("front" | "back")[] = ["front", "back"];
  for (let f = 0; f < 6; f++) {
    for (const s of sides) {
      for (let u = 0; u < 4; u++) {
        const rnd = (f * 17 + u * 11 + (s === "front" ? 0 : 5)) % 10;
        const status = rnd < 6 ? "available" : rnd < 8 ? "reserved" : "sold";
        const rooms = 1 + ((f + u + (s === "back" ? 1 : 0)) % 4);
        const orient = s === "front" 
          ? ["Jug", "Jugoistok", "Jugozapad", "Jug"][u] 
          : ["Sjever", "Sjeveroistok", "Sjeverozapad", "Sjever"][u];
        
        const numStr = String(n).padStart(3, "0");
        list.push({
          id: numStr, // Keep standard ID format to match the route param
          number: numStr,
          title: `Stan ${numStr}`,
          description: `Prostrani ${rooms}-sobni stan sa balkonom i pogledom na ${orient}.`,
          floor: f + 1,
          unit_on_floor: u + 1,
          side: s,
          rooms,
          bathrooms: rooms > 2 ? 2 : 1,
          area: 38 + rooms * 17 + ((u * 4) % 10),
          price: 85000 + rooms * 38000 + f * 5200,
          status,
          orientation: orient,
          features: ["Balkon", "Parking", "Klima", "Podno grijanje"],
          image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop"
        });
        n++;
      }
    }
  }
  return list;
};

export const apartmentsData = getApartments();
