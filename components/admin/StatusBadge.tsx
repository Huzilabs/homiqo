import { STATUS_LABEL, STATUS_STYLE } from "@/lib/format";

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_STYLE[status] || ""}`}>{status === "pending" ? "Pending" : STATUS_LABEL[status]}</span>;
}
