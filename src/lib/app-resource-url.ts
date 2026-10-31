/** Next prefixes its own routes and chunks; public files need an explicit prefix. */
export function appResourceUrl(
  path: `/${string}`,
  basePath = process.env.NEXT_PUBLIC_APP_BASE_PATH ?? "",
) {
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("Expected an application-root resource path");
  if (!basePath) return path;
  return path === basePath || path.startsWith(`${basePath}/`)
    ? path
    : `${basePath}${path}`;
}
