import { formatEgp } from "@/lib/money";

/** A price; during an offer the old price shows struck through before it. Display only: checkout always prices on the server. */
export function Price({ now, was, className = "price" }: { now: number; was?: number | null; className?: string }) {
  const offer = was != null && was > now;
  return (
    <span className={className}>
      {offer && (
        <>
          <span className="sr-only">Was </span>
          <s className="was">{formatEgp(was)}</s>
          <span className="sr-only">, now </span>{" "}
        </>
      )}
      {formatEgp(now)}
    </span>
  );
}
