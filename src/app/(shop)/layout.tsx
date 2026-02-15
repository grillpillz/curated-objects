import { SiteHeader } from "@/components/features/site-header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </>
  );
}
