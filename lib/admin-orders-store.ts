import ExcelJS from "exceljs";

import { getWritableDataFilePath } from "@/lib/server-data-path";
import { readSubmittedOrderRows } from "@/lib/orders-repository";

export const ADMIN_ORDERS_FILENAME = "admin-orders.xlsx";

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

export type AdminOrderRow = {
  orderNumber: string;
  customerName: string;
  shopName: string;
  executiveName: string;
  location: string;
  phoneNumber: string;
  article: string;
  color: string;
  size: string;
  qty: number;
  submittedAt: string;
};

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE2E8F0" },
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.fill = HEADER_FILL;
}

function configureSheetColumns(sheet: ExcelJS.Worksheet) {
  sheet.getColumn(1).width = 16;
  sheet.getColumn(2).width = 22;
  sheet.getColumn(3).width = 18;
  sheet.getColumn(4).width = 18;
  sheet.getColumn(5).width = 18;
  sheet.getColumn(6).width = 16;
  sheet.getColumn(7).width = 12;
  sheet.getColumn(8).width = 10;
  sheet.getColumn(9).width = 8;
  sheet.getColumn(10).width = 8;
  sheet.getColumn(11).width = 22;
}

async function buildAdminWorkbook(
  rows: AdminOrderRow[]
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Order Management";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("All Orders");
  configureSheetColumns(sheet);

  const headerRow = sheet.addRow([...ADMIN_ORDER_COLUMNS]);
  styleHeaderRow(headerRow);

  for (const row of rows) {
    sheet.addRow([
      row.orderNumber,
      row.customerName,
      row.shopName,
      row.executiveName,
      row.location,
      row.phoneNumber,
      row.article,
      row.color,
      row.size,
      row.qty,
      row.submittedAt,
    ]);
  }

  return workbook;
}

export async function syncAdminOrdersExcel(): Promise<void> {
  const rows = await readSubmittedOrderRows();
  const workbook = await buildAdminWorkbook(rows);
  const filePath = await getWritableDataFilePath(ADMIN_ORDERS_FILENAME);

  if (!filePath) return;

  try {
    await workbook.xlsx.writeFile(filePath);
  } catch (error) {
    console.error("Failed to write admin Excel file:", error);
  }
}

export async function readAdminOrders(): Promise<AdminOrderRow[]> {
  return readSubmittedOrderRows();
}

export async function getAdminOrdersFileBuffer(): Promise<Buffer> {
  const rows = await readSubmittedOrderRows();
  const workbook = await buildAdminWorkbook(rows);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
