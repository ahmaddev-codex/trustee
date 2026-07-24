import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { PageContainer } from "@/components/page-container";
import { CartItemsList } from "./cart-items-list";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/cart");

  return (
    <PageContainer className="py-6 sm:py-8">
      <h1 className="font-display mb-6 text-2xl font-bold tracking-tight">Your cart</h1>
      <CartItemsList />
    </PageContainer>
  );
}
