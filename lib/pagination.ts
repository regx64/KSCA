export const PAGE_SIZE = 12;

export function parsePage(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : 1;
}

// Inclusive row range for Supabase's .range(from, to).
export function pageRange(page: number, pageSize: number = PAGE_SIZE): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function totalPages(count: number, pageSize: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(count / pageSize));
}
