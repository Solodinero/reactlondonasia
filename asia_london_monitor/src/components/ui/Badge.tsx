import { SignalStatus } from "@/types";

const styles: Record<SignalStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-600",
  hit_tp: "bg-emerald-500/20 text-emerald-300 border-emerald-600",
  hit_sl: "bg-red-500/20 text-red-300 border-red-600",
  expired: "bg-gray-500/20 text-gray-300 border-gray-600",
};

export function Badge({ status }: { status: SignalStatus }): JSX.Element {
  return <span className={`px-2 py-1 border rounded text-xs uppercase ${styles[status]}`}>{status}</span>;
}
