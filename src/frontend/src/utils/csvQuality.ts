// Parse a CSV file and compute a quality score (0-100)
// Valid row = no empty/null fields AND not a duplicate row
export function computeCSVQuality(text: string): {
  quality: number;
  totalRows: number;
  validRows: number;
  issues: string[];
} {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length <= 1)
    return {
      quality: 0,
      totalRows: 0,
      validRows: 0,
      issues: ["No data rows found"],
    };

  const dataRows = lines.slice(1);
  const issues: string[] = [];
  let emptyFieldCount = 0;
  let duplicateCount = 0;
  const seen = new Set<string>();
  let validRows = 0;

  for (const row of dataRows) {
    const fields = row.split(",");
    const hasEmpty = fields.some((f) => f.trim() === "");
    const isDuplicate = seen.has(row);
    seen.add(row);

    if (hasEmpty) emptyFieldCount++;
    if (isDuplicate) duplicateCount++;
    if (!hasEmpty && !isDuplicate) validRows++;
  }

  if (emptyFieldCount > 0)
    issues.push(`${emptyFieldCount} rows with missing values`);
  if (duplicateCount > 0) issues.push(`${duplicateCount} duplicate rows`);

  const quality = dataRows.length > 0 ? (validRows / dataRows.length) * 100 : 0;
  return { quality, totalRows: dataRows.length, validRows, issues };
}
