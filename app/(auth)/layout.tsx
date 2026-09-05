/**
 * Auth group layout — shared wrapper for /login and /signup.
 * Deliberately minimal: no landing-page navbar, just clean centered content.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
