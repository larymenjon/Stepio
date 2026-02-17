import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calculateAge } from "@/utils/ageCalculator";
import { Child, DailyLog, Event, Milestone, TherapyGoal, User, conditionLabels } from "@/types/stepio";

type ExportMonthlyReportInput = {
  monthDate: Date;
  child: Child;
  user?: User | null;
  logs: DailyLog[];
  events: Event[];
  milestones: Milestone[];
  goals: TherapyGoal[];
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export function exportMonthlyReportPdf({
  monthDate,
  child,
  user,
  logs,
  events,
  milestones,
  goals,
}: ExportMonthlyReportInput) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const monthLabel = format(monthDate, "MMMM yyyy", { locale: ptBR });
  const age = calculateAge(child.birthDate);

  const monthLogs = logs.filter(
    (log) =>
      log.date &&
      isWithinInterval(parseISO(log.date), { start: monthStart, end: monthEnd }),
  );

  const countValues = (key: "mood" | "sleep" | "food" | "crisis") =>
    monthLogs.reduce<Record<string, number>>((acc, log) => {
      const value = log[key];
      if (value) acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {});

  const topValue = (counts: Record<string, number>) => {
    const entries = Object.entries(counts);
    if (entries.length === 0) return "Sem dados";
    const [label, count] = entries.sort((a, b) => b[1] - a[1])[0];
    return `${label} (${count})`;
  };

  const moodCounts = countValues("mood");
  const sleepCounts = countValues("sleep");
  const foodCounts = countValues("food");
  const crisisCounts = countValues("crisis");

  const monthEvents = events.filter((event) =>
    isWithinInterval(parseISO(event.datetime), { start: monthStart, end: monthEnd }),
  );

  const monthMilestones = milestones.filter((milestone) =>
    isWithinInterval(parseISO(milestone.date), { start: monthStart, end: monthEnd }),
  );

  const logRows = monthLogs
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
    .map(
      (log) => `
      <tr>
        <td>${escapeHtml(log.date ?? "")}</td>
        <td>${escapeHtml(log.mood ?? "-")}</td>
        <td>${escapeHtml(log.food ?? "-")}</td>
        <td>${escapeHtml(log.sleep ?? "-")}</td>
        <td>${escapeHtml(log.crisis ?? "-")}</td>
        <td>${escapeHtml(log.notes ?? "-")}</td>
      </tr>
    `,
    )
    .join("");

  const eventRows = monthEvents
    .sort((a, b) => parseISO(a.datetime).getTime() - parseISO(b.datetime).getTime())
    .map(
      (event) => `
      <tr>
        <td>${escapeHtml(format(parseISO(event.datetime), "dd/MM/yyyy"))}</td>
        <td>${escapeHtml(format(parseISO(event.datetime), "HH:mm"))}</td>
        <td>${escapeHtml(event.title)}</td>
        <td>${escapeHtml(event.professional ?? "-")}</td>
        <td>${escapeHtml(event.type)}</td>
      </tr>
    `,
    )
    .join("");

  const goalRows = goals
    .map(
      (goal) => `
      <tr>
        <td>${escapeHtml(goal.text)}</td>
        <td>${goal.done ? "Concluída" : "Pendente"}</td>
        <td>${goal.source === "auto" ? "Sugerida" : "Personalizada"}</td>
      </tr>
    `,
    )
    .join("");

  const milestoneRows = monthMilestones
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .map(
      (milestone) => `
      <tr>
        <td>${escapeHtml(format(parseISO(milestone.date), "dd/MM/yyyy"))}</td>
        <td>${escapeHtml(milestone.title)}</td>
        <td>${escapeHtml(milestone.description ?? "-")}</td>
      </tr>
    `,
    )
    .join("");

  const conditions = (child.condition ?? [])
    .map((condition) => conditionLabels[condition] ?? condition)
    .join(", ");

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Relatório mensal - ${escapeHtml(child.name)}</title>
        <style>
          body {
            font-family: "Segoe UI", Arial, sans-serif;
            color: #0f172a;
            padding: 24px;
          }
          h1, h2 {
            margin: 0 0 8px 0;
          }
          .subtitle {
            color: #475569;
            margin-bottom: 16px;
          }
          .section {
            margin-top: 24px;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #f8fafc;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            background: #0f172a;
            color: #fff;
            font-size: 12px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .summary-item {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px;
          }
          @media print {
            body { padding: 0; }
            .card { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Relatório mensal</h1>
        <p class="subtitle">${escapeHtml(monthLabel)}</p>

        <div class="card">
          <div style="display:flex; justify-content: space-between; align-items: center;">
            <div>
              <h2>${escapeHtml(child.name)}</h2>
              <p class="subtitle">Responsável: ${escapeHtml(user?.name ?? "Não informado")}</p>
            </div>
            <span class="badge">Stepio</span>
          </div>
          <div class="summary-grid">
            <div class="summary-item">
              <strong>Idade</strong>
              <p>${age.months} meses (${age.weeks} semanas)</p>
            </div>
            <div class="summary-item">
              <strong>Condições</strong>
              <p>${escapeHtml(conditions || "Não informado")}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Metas do plano inteligente</h2>
          <div class="card">
            ${goals.length === 0 ? "<p>Nenhuma meta registrada.</p>" : `
              <table>
                <thead>
                  <tr>
                    <th>Meta</th>
                    <th>Status</th>
                    <th>Origem</th>
                  </tr>
                </thead>
                <tbody>
                  ${goalRows}
                </tbody>
              </table>
            `}
          </div>
        </div>

        <div class="section">
          <h2>Resumo do mês</h2>
          <div class="card">
            <p>Total de registros: <strong>${monthLogs.length}</strong></p>
            <p>Total de eventos: <strong>${monthEvents.length}</strong></p>
            <p>Total de marcos: <strong>${monthMilestones.length}</strong></p>
            <div class="summary-grid" style="margin-top: 12px;">
              <div class="summary-item">
                <strong>Humor</strong>
                <p>${escapeHtml(topValue(moodCounts))}</p>
              </div>
              <div class="summary-item">
                <strong>Sono</strong>
                <p>${escapeHtml(topValue(sleepCounts))}</p>
              </div>
              <div class="summary-item">
                <strong>Alimentação</strong>
                <p>${escapeHtml(topValue(foodCounts))}</p>
              </div>
              <div class="summary-item">
                <strong>Crises</strong>
                <p>${escapeHtml(topValue(crisisCounts))}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Agenda e terapias</h2>
          <div class="card">
            ${monthEvents.length === 0 ? "<p>Nenhuma terapia/consulta no período.</p>" : `
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Hora</th>
                    <th>Evento</th>
                    <th>Profissional</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  ${eventRows}
                </tbody>
              </table>
            `}
          </div>
        </div>

        <div class="section">
          <h2>Registros diários</h2>
          <div class="card">
            ${monthLogs.length === 0 ? "<p>Nenhum registro diário no período.</p>" : `
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Humor</th>
                    <th>Alimentação</th>
                    <th>Sono</th>
                    <th>Crises</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  ${logRows}
                </tbody>
              </table>
            `}
          </div>
        </div>

        <div class="section">
          <h2>Marcos</h2>
          <div class="card">
            ${monthMilestones.length === 0 ? "<p>Nenhum marco no período.</p>" : `
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Título</th>
                    <th>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  ${milestoneRows}
                </tbody>
              </table>
            `}
          </div>
        </div>
      </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const triggerPrint = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  iframe.onload = () => {
    setTimeout(triggerPrint, 250);
  };

  setTimeout(triggerPrint, 500);
}
