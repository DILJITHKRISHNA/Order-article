import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { getWritableDataFilePath } from "@/lib/server-data-path";
import { readSubmittedOrderRows } from "@/lib/orders-repository";
import type { AdminOrderRow } from "@/types/order";

export type { AdminOrderRow };

export const ADMIN_ORDERS_FILENAME = "admin-orders.pdf";

export const ADMIN_ORDER_COLUMNS = [
  "Order Number",
  "Customer Name",
  "Shop Name",
  "Executive Name",
  "Location",
  "Phone Number",
  "Article",
  "Color",
  "Size",
  "Qty",
  "Submitted At",
] as const;

function mapRowToTableCells(row: AdminOrderRow): string[] {
  return [
    row.orderNumber,
    row.customerName,
    row.shopName,
    row.executiveName,
    row.location,
    row.phoneNumber,
    row.article,
    row.color,
    row.size,
    String(row.qty),
    row.submittedAt,
  ];
}

function buildAdminOrdersPdf(rows: AdminOrderRow[]): Buffer {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(16);
  doc.text("Admin Orders", 40, 40);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
  doc.text(`Total line items: ${rows.length}`, 40, 72);

  autoTable(doc, {
    startY: 88,
    head: [ADMIN_ORDER_COLUMNS.slice()],
    body: rows.map(mapRowToTableCells),
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
  });

  return Buffer.from(doc.output("arraybuffer"));
}

export async function syncAdminOrdersPdf(): Promise<void> {
  const rows = await readSubmittedOrderRows();
  const filePath = await getWritableDataFilePath(ADMIN_ORDERS_FILENAME);

  if (!filePath) return;

  try {
    const buffer = buildAdminOrdersPdf(rows);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(filePath, buffer);
  } catch (error) {
    console.error("Failed to write admin PDF file:", error);
  }
}

export async function readAdminOrders(): Promise<AdminOrderRow[]> {
  return readSubmittedOrderRows();
}

export async function getAdminOrdersFileBuffer(): Promise<Buffer> {
  const rows = await readSubmittedOrderRows();
  return buildAdminOrdersPdf(rows);
}
