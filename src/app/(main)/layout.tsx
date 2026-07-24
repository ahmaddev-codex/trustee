import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default async function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      {!session?.user && <Footer />}
      {modal}
    </>
  );
}
