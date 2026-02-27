/* ===========================================================
   Conversion utility library — pure functions, no React deps.
   =========================================================== */

// ── JSON → CSV ──────────────────────────────────────────────
export function jsonToCsv(json: string): string {
    const data = JSON.parse(json);
    const arr = Array.isArray(data) ? data : [data];
    if (arr.length === 0) return "";

    const headers = new Set<string>();
    arr.forEach((row) => {
        if (typeof row === "object" && row !== null) {
            Object.keys(row).forEach((k) => headers.add(k));
        }
    });
    const cols = Array.from(headers);
    const escape = (v: any) => {
        const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [cols.join(",")];
    arr.forEach((row) => lines.push(cols.map((c) => escape(row?.[c])).join(",")));
    return lines.join("\n");
}

// ── CSV → JSON ──────────────────────────────────────────────
export function csvToJson(csv: string): string {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return "[]";
    const headers = parseCsvLine(lines[0]);
    const result = lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => (obj[h] = values[i] || ""));
        return obj;
    });
    return JSON.stringify(result, null, 2);
}

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
            else if (ch === '"') inQuotes = false;
            else current += ch;
        } else {
            if (ch === '"') inQuotes = true;
            else if (ch === ",") { result.push(current); current = ""; }
            else current += ch;
        }
    }
    result.push(current);
    return result;
}

// ── JSON → XML ──────────────────────────────────────────────
export function jsonToXml(json: string): string {
    const data = JSON.parse(json);
    function toXml(obj: any, tag: string, indent: string): string {
        if (obj === null || obj === undefined) return `${indent}<${tag}/>\n`;
        if (typeof obj !== "object") return `${indent}<${tag}>${escapeXml(String(obj))}</${tag}>\n`;
        if (Array.isArray(obj)) return obj.map((item) => toXml(item, tag, indent)).join("");
        let xml = `${indent}<${tag}>\n`;
        for (const [key, val] of Object.entries(obj)) {
            xml += toXml(val, key, indent + "  ");
        }
        xml += `${indent}</${tag}>\n`;
        return xml;
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(data, "root", "")}`;
}

function escapeXml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── XML → JSON ──────────────────────────────────────────────
export function xmlToJson(xml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) throw new Error("Invalid XML: " + errorNode.textContent);
    function nodeToObj(node: Element): any {
        const obj: Record<string, any> = {};
        if (node.children.length === 0) return node.textContent || "";
        const children = Array.from(node.children);
        const grouped: Record<string, Element[]> = {};
        children.forEach((child) => {
            const tag = child.tagName;
            if (!grouped[tag]) grouped[tag] = [];
            grouped[tag].push(child);
        });
        for (const [tag, elements] of Object.entries(grouped)) {
            if (elements.length === 1) obj[tag] = nodeToObj(elements[0]);
            else obj[tag] = elements.map(nodeToObj);
        }
        return obj;
    }
    const root = doc.documentElement;
    const result = nodeToObj(root);
    return JSON.stringify(result, null, 2);
}

// ── JSON → YAML ─────────────────────────────────────────────
export function jsonToYaml(json: string): string {
    // Dynamic import not possible here, so we use a simple implementation
    const data = JSON.parse(json);
    return toYamlString(data, 0);
}

function toYamlString(data: any, indent: number): string {
    const pad = "  ".repeat(indent);
    if (data === null) return "null\n";
    if (data === undefined) return "~\n";
    if (typeof data === "boolean") return `${data}\n`;
    if (typeof data === "number") return `${data}\n`;
    if (typeof data === "string") {
        if (data.includes("\n") || data.includes(":") || data.includes("#")) return `"${data.replace(/"/g, '\\"')}"\n`;
        return `${data}\n`;
    }
    if (Array.isArray(data)) {
        if (data.length === 0) return "[]\n";
        return data.map((item) => {
            const val = toYamlString(item, indent + 1);
            if (typeof item === "object" && item !== null) return `${pad}- ${val.trimStart()}`;
            return `${pad}- ${val}`;
        }).join("");
    }
    if (typeof data === "object") {
        const keys = Object.keys(data);
        if (keys.length === 0) return "{}\n";
        return keys.map((key) => {
            const val = data[key];
            if (typeof val === "object" && val !== null && !Array.isArray(val) && Object.keys(val).length > 0) {
                return `${pad}${key}:\n${toYamlString(val, indent + 1)}`;
            }
            if (Array.isArray(val) && val.length > 0) {
                return `${pad}${key}:\n${toYamlString(val, indent + 1)}`;
            }
            return `${pad}${key}: ${toYamlString(val, indent + 1)}`;
        }).join("");
    }
    return `${data}\n`;
}

// ── YAML → JSON ─────────────────────────────────────────────
export function yamlToJson(yaml: string): string {
    // Simple YAML parser for common cases
    const jsYaml = require("js-yaml");
    const data = jsYaml.load(yaml);
    return JSON.stringify(data, null, 2);
}

// ── JSON → SQL ──────────────────────────────────────────────
export function jsonToSql(json: string, tableName: string = "table_name"): string {
    const data = JSON.parse(json);
    const arr = Array.isArray(data) ? data : [data];
    if (arr.length === 0) return "-- No data to convert";

    const allKeys = new Set<string>();
    arr.forEach((row) => {
        if (typeof row === "object" && row !== null) {
            Object.keys(row).forEach((k) => allKeys.add(k));
        }
    });
    const cols = Array.from(allKeys);

    return arr.map((row) => {
        const values = cols.map((col) => {
            const v = row?.[col];
            if (v === null || v === undefined) return "NULL";
            if (typeof v === "number") return String(v);
            if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
            if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            return `'${String(v).replace(/'/g, "''")}'`;
        });
        return `INSERT INTO ${tableName} (${cols.join(", ")}) VALUES (${values.join(", ")});`;
    }).join("\n");
}

// ── JSON → Excel (returns Uint8Array) ───────────────────────
export async function jsonToExcel(json: string): Promise<Uint8Array> {
    const XLSX = await import("xlsx");
    const data = JSON.parse(json);
    const arr = Array.isArray(data) ? data : [data];
    const ws = XLSX.utils.json_to_sheet(arr);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}
