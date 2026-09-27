// A readable, server-generated reference — persisted once, never
// regenerated. 7 digits gives a 1-in-10,000,000 collision chance, which the
// caller resolves by retrying the insert on a unique-constraint failure.
export function generateReference(): string {
  const digits = Math.floor(Math.random() * 1e7)
    .toString()
    .padStart(7, "0");
  return `ANU-${digits}`;
}
