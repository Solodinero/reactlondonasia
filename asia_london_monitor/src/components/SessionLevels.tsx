import { SessionLevels as SessionLevelsType } from "@/types";
import { Card } from "./ui/Card";

function fmt(v: number | null): string {
  return v === null ? "—" : v.toFixed(5);
}

export function SessionLevels({ levels }: { levels: SessionLevelsType[] }): JSX.Element {
  return (
    <div className="grid gap-3">
      {levels.map((level) => {
        const statusClass = level.londonActive ? "border-amber-600" : level.asianComplete ? "border-gray-700" : "border-blue-700";
        return (
          <Card key={`${level.pair}-${level.date}`} className={statusClass}>
            <h3 className="font-bold mb-2">{level.pair}</h3>
            <p>Asian High: {fmt(level.asianHigh)}</p>
            <p>Asian Low: {fmt(level.asianLow)}</p>
            <p>London High: {fmt(level.londonHigh)}</p>
            <p>London Low: {fmt(level.londonLow)}</p>
          </Card>
        );
      })}
    </div>
  );
}
