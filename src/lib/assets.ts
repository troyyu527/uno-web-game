// Resolve a path in /public against the deploy base (e.g. /uno-web-game/ on
// GitHub Pages), so assets work in dev and production alike.
export const asset = (path: string): string =>
  import.meta.env.BASE_URL + path.replace(/^\/+/, "");
