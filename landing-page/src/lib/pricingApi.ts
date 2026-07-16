export interface Pricing {
  year: { price: number; originalPrice?: number };
  lifetime: { price: number; originalPrice?: number };
}

let cachedPricing: Pricing | null = null;

export async function getPricing(): Promise<Pricing> {
  if (cachedPricing) return cachedPricing;
  try {
    const res = await fetch('https://chat.sopie.cc/api/pricing');
    if (!res.ok) throw new Error('Failed to fetch pricing');
    const data = await res.json();
    cachedPricing = {
      year: { price: data.year?.price || 68, originalPrice: data.year?.originalPrice },
      lifetime: { price: data.lifetime?.price || 98, originalPrice: data.lifetime?.originalPrice }
    };
    return cachedPricing;
  } catch {
    // 降级到默认值
    return { year: { price: 68 }, lifetime: { price: 98 } };
  }
}
