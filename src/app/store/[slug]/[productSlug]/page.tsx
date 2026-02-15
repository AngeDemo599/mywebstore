import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function ProductRedirectPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();

  const product = await prisma.product.findFirst({
    where: { storeId: store.id, slug: productSlug },
  });
  if (!product) notFound();

  redirect(`/product/${product.slug}`);
}
