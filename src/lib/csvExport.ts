/**
 * Massivni CSV faylga aylantirib, brauzer orqali yuklab olishni boshlaydi.
 * Excel'da to'g'ri ochilishi uchun UTF-8 BOM qo'shilgan.
 */
export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escapeCell = (value: unknown) => {
    const str = value === null || value === undefined ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(",")),
  ];

  const BOM = "\uFEFF"; // Excel UTF-8 (kirill/o'zbek harflarini to'g'ri ko'rsatish uchun)
  const blob = new Blob([BOM + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
