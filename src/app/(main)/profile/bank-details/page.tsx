import { redirect } from "next/navigation";

// Payout details now live as a dashboard tab — keep this path working for
// old bookmarks/links instead of a 404.
export default function BankDetailsRedirect() {
  redirect("/dashboard?tab=payout");
}
