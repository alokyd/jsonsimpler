/* ================================================================
   Code generator library – converts a JSON value to typed code in
   TypeScript, Java, C#, Go, Python.
   ================================================================ */

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function toCamelCase(s: string): string {
    return s.replace(/[-_](.)/g, (_, c) => c.toUpperCase());
}

function toPascalCase(s: string): string {
    return capitalize(toCamelCase(s));
}

function inferType(value: any): string {
    if (value === null) return "any";
    if (Array.isArray(value)) {
        if (value.length === 0) return "any[]";
        return inferType(value[0]) + "[]";
    }
    return typeof value;
}

// ── TypeScript ──────────────────────────────────────────────
export function jsonToTypeScript(json: string, rootName: string = "Root"): string {
    const data = JSON.parse(json);
    const interfaces: string[] = [];

    function process(obj: any, name: string): string {
        if (typeof obj !== "object" || obj === null) return inferTsType(obj);
        if (Array.isArray(obj)) {
            if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null && !Array.isArray(obj[0])) {
                const itemName = name.endsWith("s") ? name.slice(0, -1) : name + "Item";
                process(obj[0], toPascalCase(itemName));
                return `${toPascalCase(itemName)}[]`;
            }
            return obj.length > 0 ? `${inferTsType(obj[0])}[]` : "any[]";
        }

        const lines: string[] = [];
        lines.push(`export interface ${toPascalCase(name)} {`);
        for (const [key, value] of Object.entries(obj)) {
            const type = typeof value === "object" && value !== null && !Array.isArray(value)
                ? (process(value, key), toPascalCase(key))
                : process(value, key);
            lines.push(`  ${key}: ${type};`);
        }
        lines.push("}");
        interfaces.push(lines.join("\n"));
        return toPascalCase(name);
    }

    function inferTsType(val: any): string {
        if (val === null) return "null";
        if (typeof val === "boolean") return "boolean";
        if (typeof val === "number") return "number";
        if (typeof val === "string") return "string";
        return "any";
    }

    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
        process(data[0], rootName);
    } else {
        process(data, rootName);
    }

    return interfaces.join("\n\n");
}

// ── Java ────────────────────────────────────────────────────
export function jsonToJava(json: string, className: string = "Root"): string {
    const data = JSON.parse(json);
    const classes: string[] = [];

    function process(obj: any, name: string) {
        if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return;
        const lines: string[] = [];
        lines.push(`public class ${toPascalCase(name)} {`);

        for (const [key, value] of Object.entries(obj)) {
            const jType = inferJavaType(value, key);
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                process(value, key);
            } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
                process(value[0], key.endsWith("s") ? key.slice(0, -1) : key + "Item");
            }
            lines.push(`    private ${jType} ${toCamelCase(key)};`);
        }

        lines.push("");
        for (const [key, value] of Object.entries(obj)) {
            const jType = inferJavaType(value, key);
            const camel = toCamelCase(key);
            const pascal = toPascalCase(key);
            lines.push(`    public ${jType} get${pascal}() { return this.${camel}; }`);
            lines.push(`    public void set${pascal}(${jType} ${camel}) { this.${camel} = ${camel}; }`);
            lines.push("");
        }

        lines.push("}");
        classes.push(lines.join("\n"));
    }

    function inferJavaType(val: any, key: string): string {
        if (val === null) return "Object";
        if (typeof val === "boolean") return "boolean";
        if (typeof val === "number") return Number.isInteger(val) ? "int" : "double";
        if (typeof val === "string") return "String";
        if (Array.isArray(val)) {
            if (val.length > 0) {
                const inner = typeof val[0] === "object" ? toPascalCase(key.endsWith("s") ? key.slice(0, -1) : key + "Item") : inferJavaType(val[0], key);
                return `List<${inner === "int" ? "Integer" : inner === "double" ? "Double" : inner === "boolean" ? "Boolean" : inner}>`;
            }
            return "List<Object>";
        }
        if (typeof val === "object") return toPascalCase(key);
        return "Object";
    }

    const root = Array.isArray(data) && data.length > 0 ? data[0] : data;
    process(root, className);
    return classes.join("\n\n");
}

// ── C# ──────────────────────────────────────────────────────
export function jsonToCSharp(json: string, className: string = "Root"): string {
    const data = JSON.parse(json);
    const classes: string[] = [];

    function process(obj: any, name: string) {
        if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return;
        const lines: string[] = [];
        lines.push(`public class ${toPascalCase(name)}`);
        lines.push("{");
        for (const [key, value] of Object.entries(obj)) {
            const csType = inferCsType(value, key);
            if (typeof value === "object" && value !== null && !Array.isArray(value)) process(value, key);
            else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object")
                process(value[0], key.endsWith("s") ? key.slice(0, -1) : key + "Item");
            lines.push(`    public ${csType} ${toPascalCase(key)} { get; set; }`);
        }
        lines.push("}");
        classes.push(lines.join("\n"));
    }

    function inferCsType(val: any, key: string): string {
        if (val === null) return "object";
        if (typeof val === "boolean") return "bool";
        if (typeof val === "number") return Number.isInteger(val) ? "int" : "double";
        if (typeof val === "string") return "string";
        if (Array.isArray(val)) {
            if (val.length > 0) {
                const inner = typeof val[0] === "object" ? toPascalCase(key.endsWith("s") ? key.slice(0, -1) : key + "Item") : inferCsType(val[0], key);
                return `List<${inner}>`;
            }
            return "List<object>";
        }
        if (typeof val === "object") return toPascalCase(key);
        return "object";
    }

    const root = Array.isArray(data) && data.length > 0 ? data[0] : data;
    process(root, className);
    return classes.join("\n\n");
}

// ── Go ──────────────────────────────────────────────────────
export function jsonToGo(json: string, structName: string = "Root"): string {
    const data = JSON.parse(json);
    const structs: string[] = [];

    function process(obj: any, name: string) {
        if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return;
        const lines: string[] = [];
        lines.push(`type ${toPascalCase(name)} struct {`);
        for (const [key, value] of Object.entries(obj)) {
            const goType = inferGoType(value, key);
            if (typeof value === "object" && value !== null && !Array.isArray(value)) process(value, key);
            else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object")
                process(value[0], key.endsWith("s") ? key.slice(0, -1) : key + "Item");
            lines.push(`\t${toPascalCase(key)} ${goType} \`json:"${key}"\``);
        }
        lines.push("}");
        structs.push(lines.join("\n"));
    }

    function inferGoType(val: any, key: string): string {
        if (val === null) return "interface{}";
        if (typeof val === "boolean") return "bool";
        if (typeof val === "number") return Number.isInteger(val) ? "int" : "float64";
        if (typeof val === "string") return "string";
        if (Array.isArray(val)) {
            if (val.length > 0) {
                const inner = typeof val[0] === "object" ? toPascalCase(key.endsWith("s") ? key.slice(0, -1) : key + "Item") : inferGoType(val[0], key);
                return `[]${inner}`;
            }
            return "[]interface{}";
        }
        if (typeof val === "object") return toPascalCase(key);
        return "interface{}";
    }

    const root = Array.isArray(data) && data.length > 0 ? data[0] : data;
    process(root, structName);
    return structs.join("\n\n");
}

// ── Python ──────────────────────────────────────────────────
export function jsonToPython(json: string, className: string = "Root"): string {
    const data = JSON.parse(json);
    const classes: string[] = [];
    classes.push("from dataclasses import dataclass");
    classes.push("from typing import List, Optional\n");

    function process(obj: any, name: string) {
        if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return;
        const lines: string[] = [];
        lines.push("@dataclass");
        lines.push(`class ${toPascalCase(name)}:`);
        for (const [key, value] of Object.entries(obj)) {
            const pyType = inferPyType(value, key);
            if (typeof value === "object" && value !== null && !Array.isArray(value)) process(value, key);
            else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object")
                process(value[0], key.endsWith("s") ? key.slice(0, -1) : key + "Item");
            lines.push(`    ${key}: ${pyType}`);
        }
        classes.push(lines.join("\n"));
    }

    function inferPyType(val: any, key: string): string {
        if (val === null) return "Optional[any]";
        if (typeof val === "boolean") return "bool";
        if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
        if (typeof val === "string") return "str";
        if (Array.isArray(val)) {
            if (val.length > 0) {
                const inner = typeof val[0] === "object" ? toPascalCase(key.endsWith("s") ? key.slice(0, -1) : key + "Item") : inferPyType(val[0], key);
                return `List[${inner}]`;
            }
            return "List";
        }
        if (typeof val === "object") return toPascalCase(key);
        return "any";
    }

    const root = Array.isArray(data) && data.length > 0 ? data[0] : data;
    process(root, className);
    return classes.join("\n\n");
}
