import "server-only";

import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { PayrollEmployeeRow, PayrollMonthResult } from "@/lib/types/payroll";

function formatCurrency(amount: number | null) {
  if (amount === null) return "—";
  // pdf-lib standard fonts are WinAnsi encoded and can't render "₹".
  // Use currency code to keep output ASCII-safe without requiring custom font embedding.
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    currencyDisplay: "code",
    maximumFractionDigits: 2,
  }).format(amount);
}

function safeText(value: string, maxLen: number) {
  if (value.length <= maxLen) return value;
  return `${value.slice(0, Math.max(0, maxLen - 1))}…`;
}

export async function buildPayrollPdf(params: {
  month: string;
  run: PayrollMonthResult["run"];
  rows: PayrollEmployeeRow[];
  generatedAt?: Date;
}): Promise<Uint8Array> {
  const { month, run, rows, generatedAt = new Date() } = params;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageSize: [number, number] = [595.28, 841.89]; // A4 portrait in points
  const marginX = 42;
  const marginTop = 48;
  const marginBottom = 48;
  const lineHeight = 14;

  const col = {
    code: marginX,
    name: marginX + 80,
    payable: marginX + 320,
    net: marginX + 420,
  };

  function drawHeader(page: PDFPage) {
    const { height } = page.getSize();
    const titleY = height - marginTop;
    page.drawText("Payroll", { x: marginX, y: titleY, size: 18, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`Month: ${month}`, { x: marginX, y: titleY - 22, size: 11, font, color: rgb(0.25, 0.25, 0.25) });
    page.drawText(`Status: ${run.status}`, { x: marginX + 210, y: titleY - 22, size: 11, font, color: rgb(0.25, 0.25, 0.25) });
    page.drawText(
      `Working days: ${run.workingDays} | Holidays: ${run.holidays} | Week offs: ${run.weekOffDays}`,
      { x: marginX, y: titleY - 38, size: 10, font, color: rgb(0.35, 0.35, 0.35) },
    );

    const stamp = new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(generatedAt);
    page.drawText(`Generated: ${stamp}`, { x: marginX, y: titleY - 54, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

    const tableY = titleY - 80;
    page.drawText("Code", { x: col.code, y: tableY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText("Employee", { x: col.name, y: tableY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText("Payable", { x: col.payable, y: tableY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText("Net Pay", { x: col.net, y: tableY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

    return tableY - 12;
  }

  let page = doc.addPage(pageSize);
  let cursorY = drawHeader(page);

  for (const row of rows) {
    if (cursorY <= marginBottom) {
      page = doc.addPage(pageSize);
      cursorY = drawHeader(page);
    }

    const employeeName = safeText(`${row.employee.firstName} ${row.employee.lastName}`.trim(), 34);
    const code = safeText(row.employee.employeeCode, 14);

    page.drawText(code, { x: col.code, y: cursorY, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(employeeName, { x: col.name, y: cursorY, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(String(row.payableDays), { x: col.payable, y: cursorY, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(formatCurrency(row.netPay), { x: col.net, y: cursorY, size: 10, font, color: rgb(0.15, 0.15, 0.15) });

    cursorY -= lineHeight;
  }

  return await doc.save();
}
