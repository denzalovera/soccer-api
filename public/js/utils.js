export function formatDate(d) {
  if (!d) return "?";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatGoalDifference(n) {
  if (n === 0 || n == null) return "0";
  return n > 0 ? `+${n}` : String(n);
}

export function groupSortKey(label) {
  return (label || "").replace(/[^A-Z0-9]/gi, "");
}
