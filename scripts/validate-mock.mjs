import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const file = resolve(import.meta.dirname, "../frontend/public/data/mock_distritos.json");
const dataset = JSON.parse(await readFile(file, "utf8"));
const errors = [];

if (dataset.contract_version !== "0.1.0") errors.push("contract_version inválida");
if (dataset.data_status !== "illustrative") errors.push("el mock debe ser illustrative");
if (!Array.isArray(dataset.districts) || dataset.districts.length !== 15) errors.push("debe contener 15 distritos");

for (const district of dataset.districts ?? []) {
  if (!Number.isInteger(district.district_id) || district.district_id < 1 || district.district_id > 15) {
    errors.push(`district_id inválido: ${district.district_id}`);
  }
  if (district.data_status !== "illustrative") errors.push(`estado inválido en distrito ${district.district_id}`);
  if (!Array.isArray(district.series) || district.series.length !== 11) errors.push(`serie incompleta en distrito ${district.district_id}`);
  if (district.geometry?.type !== "Polygon") errors.push(`geometría inválida en distrito ${district.district_id}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Mock válido: 15 distritos y 11 observaciones por serie.");
