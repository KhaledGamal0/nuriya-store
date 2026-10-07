import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap done">
      <h1>We couldn&rsquo;t find that page.</h1>
      <Link className="btn btn-line" href="/">
        Back to the store
      </Link>
    </div>
  );
}
