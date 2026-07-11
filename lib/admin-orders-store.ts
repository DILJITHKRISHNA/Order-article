import path from "node:path";

import ExcelJS from "exceljs";

import type { CustomerDetails, OrderLineItem, AdminOrderRow } from "@/types/order";

export const ADMIN_ORDERS_FILENAME = "admin-orders.xlsx";

export const ADMIN_ORDER_COLUMNS = [
  "Order Number",
  "Customer Name",
  "Location",
  "Phone Number",
  "Article",
  "Color",
  "Size",
  "Qty",
  "Submitted At",
] as const;

export type { AdminOrderRow };

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE2E8F0" },
};

function getAdminOrdersPath(): string {
  return path.join(process.cwd(), "data", ADMIN_ORDERS_FILENAME);
}

async function ensureDataDirectory(): Promise<void> {
  const dataDir = path.join(process.cwd(), "data");
  await import("node:fs/promises").then((fs) => fs.mkdir(dataDir, { recursive: true }));
}

async function loadWorkbook(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const filePath = getAdminOrdersPath();

  try {
    await workbook.xlsx.readFile(filePath);
  } catch {
    const sheet = workbook.addWorksheet("All Orders");
    sheet.addRow([...ADMIN_ORDER_COLUMNS]);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = HEADER_FILL;

    sheet.getColumn(1).width = 16;
    sheet.getColumn(2).width = 22;
    sheet.getColumn(3).width = 18;
    sheet.getColumn(4).width = 16;
    sheet.getColumn(5).width = 12;
    sheet.getColumn(6).width = 10;
    sheet.getColumn(7).width = 8;
    sheet.getColumn(8).width = 8;
    sheet.getColumn(9).width = 22;
  }

  return workbook;
}

function getOrdersSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  let sheet = workbook.getWorksheet("All Orders");
  if (!sheet) {
    sheet = workbook.addWorksheet("All Orders");
    sheet.addRow([...ADMIN_ORDER_COLUMNS]);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = HEADER_FILL;
  }
  return sheet;
}

function rowToAdminOrder(row: ExcelJS.Row): AdminOrderRow | null {
  const orderNumber = String(row.getCell(1).value ?? "").trim();
  if (!orderNumber || orderNumber === "Order Number") return null;

  return {
    orderNumber,
    customerName: String(row.getCell(2).value ?? ""),
    location: String(row.getCell(3).value ?? ""),
    phoneNumber: String(row.getCell(4).value ?? ""),
    article: String(row.getCell(5).value ?? ""),
    color: String(row.getCell(6).value ?? ""),
    size: String(row.getCell(7).value ?? ""),
    qty: Number(row.getCell(8).value ?? 0),
    submittedAt: String(row.getCell(9).value ?? ""),
  };
}

export async function appendOrderToAdminExcel(
  customer: CustomerDetails,
  items: OrderLineItem[],
  submittedAt: string
): Promise<void> {
  await ensureDataDirectory();

  const workbook = await loadWorkbook();
  const sheet = getOrdersSheet(workbook);

  for (const item of items) {
    sheet.addRow([
      customer.orderNumber,
      customer.customerName,
      customer.location,
      customer.phoneNumber,
      item.article,
      item.color,
      item.size,
      item.qty,
      submittedAt,
    ]);
  }

  await workbook.xlsx.writeFile(getAdminOrdersPath());
}

export async function readAdminOrders(): Promise<AdminOrderRow[]> {
  await ensureDataDirectory();

  try {
    const workbook = await loadWorkbook();
    const sheet = getOrdersSheet(workbook);
    const orders: AdminOrderRow[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const parsed = rowToAdminOrder(row);
      if (parsed) orders.push(parsed);
    });

    return orders;
  } catch {
    return [];
  }
}

export async function getAdminOrdersFileBuffer(): Promise<Buffer> {
  await ensureDataDirectory();

  const filePath = getAdminOrdersPath();

  try {
    const fs = await import("node:fs/promises");
    return fs.readFile(filePath);
  } catch {
    const workbook = await loadWorkbook();
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    await import("node:fs/promises").then((fs) =>
      fs.writeFile(filePath, buffer)
    );
    return buffer;
  }
}
