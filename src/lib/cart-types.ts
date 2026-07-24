// Mirrors the JSON shape returned by GET /api/cart (priceKobo is serialized to
// a string since bigint isn't valid JSON).
export type CartListing = {
  id: string;
  title: string;
  priceKobo: string;
  imageUrls: string[];
  status: "ACTIVE" | "SOLD" | "REMOVED";
  seller: { name: string };
};

export type CartItem = {
  id: string;
  listing: CartListing;
};

export type CartResponse = {
  items: CartItem[];
};
