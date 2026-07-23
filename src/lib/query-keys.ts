// Centralized query-key registry — do not construct query keys inline elsewhere.
export const queryKeys = {
  notifications: {
    all: () => ["notifications"] as const,
  },
  profile: {
    bankDetails: () => ["profile", "bank-details"] as const,
  },
  monnify: {
    banks: () => ["monnify", "banks"] as const,
  },
};
