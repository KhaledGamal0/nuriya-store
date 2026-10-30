// Sales reports for Khaled, from the orders database (Cairo time). No customer names or phones.
//   daily   (every morning): yesterday, compared with the day before, + orders still to confirm + stock
//   weekly  (Sunday morning): the last 7 days vs the 7 before, best sellers, areas, day by day
//   monthly (the 1st):        last month vs the month before
// Reads sales.json (written by the workflow's SQL step, scripts/sales.sql). E-mails ORDER_ALERT_EMAIL.
import { readFileSync, writeFileSync } from "node:fs";
import { sendReport } from "./report-mail.mjs";

import { renderSales } from "./sales-render.mjs";

const d = JSON.parse(readFileSync("sales.json", "utf8"));
const { subject, html, text } = renderSales(d);
console.log(text);
writeFileSync("report.txt", text + "\n");

if (!(await sendReport({ kind: "sales", subject, html, text }))) process.exitCode = 1;
