import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }): JSX.Element {
  return <div className={`rounded-lg border border-gray-800 bg-gray-900/70 p-4 ${className}`}>{children}</div>;
}
