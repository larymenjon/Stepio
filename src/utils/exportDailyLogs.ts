import { DailyLog } from "@/types/stepio";
import { format } from "date-fns";

export function exportDailyLogsToCsv(logs: DailyLog[], monthDate: Date) {
  const header = ["Data", "Humor", "Alimentação", "Sono", "Crises"].join(",");
  const rows = logs
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
    .map((log) =>
      [
        log.date ?? "",
        log.mood ?? "",
        log.food ?? "",
        log.sleep ?? "",
        log.crisis ?? "",
      ]
        .map((value) => `"${value.replace(/"/g, '""')}"`)
        .join(","),
    );

  const content = [header, ...rows].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const monthLabel = format(monthDate, "yyyy-MM");
  link.href = url;
  link.setAttribute("download", `stepio-registro-diario-${monthLabel}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
