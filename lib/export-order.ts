import ExcelJS from "exceljs";

import type { CustomerDetails, OrderLineItem } from "@/types/order";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE2E8F0" },
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.fill = HEADER_FILL;
}

export async function exportOrderToExcel(
  customer: CustomerDetails,
  items: OrderLineItem[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Order Management";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Order");

  sheet.getColumn(1).width = 18;
  sheet.getColumn(2).width = 24;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 10;
  sheet.getColumn(5).width = 8;

  const titleRow = sheet.addRow(["Order Export"]);
  titleRow.font = { bold: true, size: 14 };

  sheet.addRow([]);

  const customerHeader = sheet.addRow(["Customer Details"]);
  customerHeader.font = { bold: true, size: 12 };

  const customerRows: [string, string][] = [
    ["Order Number", customer.orderNumber],
    ["Customer Name", customer.customerName],
    ["Shop Name", customer.shopName || "-"],
    ["Executive Name", customer.executiveName || "-"],
    ["Location", customer.location],
    ["Phone Number", customer.phoneNumber],
  ];

  for (const [label, value] of customerRows) {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
  }

  const totalPairs = items.reduce((total, item) => total + item.qty, 0);
  const totalRow = sheet.addRow(["Total Pairs", String(totalPairs)]);
  totalRow.getCell(1).font = { bold: true };

  sheet.addRow([]);

  const itemsHeader = sheet.addRow(["Order Items"]);
  itemsHeader.font = { bold: true, size: 12 };

  const tableHeader = sheet.addRow(["Article", "Color", "Size", "Qty"]);
  styleHeaderRow(tableHeader);

  for (const item of items) {
    sheet.addRow([item.article, item.color, item.size, item.qty]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${customer.orderNumber}-order.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
