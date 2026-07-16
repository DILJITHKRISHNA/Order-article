import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { CustomerDetails, OrderLineItem } from "@/types/order";

function downloadPdf(doc: jsPDF, filename: string) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportOrderToPdf(
  customer: CustomerDetails,
  items: OrderLineItem[]
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const totalPairs = items.reduce((total, item) => total + item.qty, 0);
  const margin = 48;
  let cursorY = margin;

  doc.setFontSize(18);
  doc.text("Order Export", margin, cursorY);
  cursorY += 28;

  doc.setFontSize(12);
  doc.text("Customer Details", margin, cursorY);
  cursorY += 8;

  autoTable(doc, {
    startY: cursorY,
    head: [["Field", "Value"]],
    body: [
      ["Order Number", customer.orderNumber],
      ["Customer Name", customer.customerName],
      ["Shop Name", customer.shopName || "-"],
      ["Executive Name", customer.executiveName || "-"],
      ["Location", customer.location],
      ["Phone Number", customer.phoneNumber],
      ["Total Pairs", String(totalPairs)],
    ],
    styles: {
      fontSize: 10,
      cellPadding: 6,
    },
    headStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 140 },
    },
    margin: { left: margin, right: margin },
  });

  const tableEndY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? cursorY + 40;

  doc.setFontSize(12);
  doc.text("Order Items", margin, tableEndY + 24);

  autoTable(doc, {
    startY: tableEndY + 32,
    head: [["Article", "Color", "Size", "Qty"]],
    body: items.map((item) => [
      item.article,
      item.color,
      item.size,
      String(item.qty),
    ]),
    styles: {
      fontSize: 10,
      cellPadding: 6,
    },
    headStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  downloadPdf(doc, `${customer.orderNumber}-order.pdf`);
}
