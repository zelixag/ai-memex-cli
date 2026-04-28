const APP_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export function homeHref(hash = ""): string {
  const normalizedHash = hash && !hash.startsWith("#") ? `#${hash}` : hash;
  return `${APP_BASE}/${normalizedHash}`;
}

export function sectionHref(href: string): string {
  return href.startsWith("#") ? homeHref(href) : href;
}
