export function orderSummaryTitle(items: { listing: { title: string } }[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0].listing.title;
  return `${items[0].listing.title} + ${items.length - 1} more`;
}

export function orderSummaryImage(items: { listing: { imageUrls: string[] } }[]): string | undefined {
  return items[0]?.listing.imageUrls[0];
}
