// Tracking page is a full-screen map — no header or footer from root layout
export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
