/** Shared ViewTransition names — must match card ↔ PDP */
export const productVt = {
  hero: (id: string) => `product-hero-${id}`,
  icon: (id: string) => `product-icon-${id}`,
  name: (id: string) => `product-name-${id}`,
  price: (id: string) => `product-price-${id}`,
} as const;
