import Link from "next/link";
export default function NotFound() {
  return (
    <div className="shell not-found">
      <span className="eyebrow">404 · A DETOUR</span>
      <h1>This topic isn’t on the map.</h1>
      <p>
        Find an available lesson or explore the curriculum to get back on track.
      </p>
      <Link href="/roadmap" className="button">
        Back to the roadmap →
      </Link>
    </div>
  );
}
