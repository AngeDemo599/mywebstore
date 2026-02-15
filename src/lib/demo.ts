export const DEMO_USER_EMAIL = "demo@souqmaker.com";
export const DEMO_STORE_SLUG = "demo";

/** Check if the authenticated user is the demo account */
export function isDemoUser(user: { email?: string | null } | null | undefined): boolean {
  return user?.email?.toLowerCase() === DEMO_USER_EMAIL;
}

/** Check if a store slug is the demo store */
export function isDemoStore(slug: string): boolean {
  return slug === DEMO_STORE_SLUG;
}
