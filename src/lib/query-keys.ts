// Centralized query-key registry — do not construct query keys inline elsewhere.
export const queryKeys = {
  listings: {
    all: () => ["listings"] as const,
    list: (params?: { category?: string }) =>
      ["listings", "list", params ?? {}] as const,
    detail: (id: string) => ["listings", "detail", id] as const,
    mine: () => ["listings", "mine"] as const,
  },
  orders: {
    all: () => ["orders"] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
    asBuyer: () => ["orders", "as-buyer"] as const,
    asSeller: () => ["orders", "as-seller"] as const,
  },
  admin: {
    pendingAuthorizations: () => ["admin", "pending-authorizations"] as const,
    disputes: () => ["admin", "disputes"] as const,
  },
};
