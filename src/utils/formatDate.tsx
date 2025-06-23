export function formatMessageTime(date: any) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return ""; // or "Sending..."
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}