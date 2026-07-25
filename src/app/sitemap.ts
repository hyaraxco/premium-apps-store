import type { MetadataRoute } from "next";
import { getProductsFromDb } from "@/db/queries";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apps.hyarax.works";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProductsFromDb();

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${appUrl}/apps/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${appUrl}/katalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${appUrl}/cara-kerja`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${appUrl}/bantuan`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...productEntries,
  ];
}
