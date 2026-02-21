import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const item = await prisma.item.findUnique({
    where: { slug },
    select: { sourceUrl: true },
  });

  if (item?.sourceUrl) {
    redirect(item.sourceUrl);
  }

  redirect("/search");
}
