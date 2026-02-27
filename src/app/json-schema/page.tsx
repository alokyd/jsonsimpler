"use client";

import { useState, useCallback } from "react";
import { JsonEditor } from "@/components/editor/json-editor";
import { Toolbar } from "@/components/editor/toolbar";
import { ResizableEditorLayout } from "@/components/editor/resizable-editor-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Braces, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Generate JSON Schema from a JSON value
function generateSchema(value: any, required: boolean = true): any {
    if (value === null) return { type: "null" };
    if (Array.isArray(value)) {
        if (value.length === 0) return { type: "array", items: {} };
        return { type: "array", items: generateSchema(value[0]) };
    }
    if (typeof value === "object") {
        const properties: Record<string, any> = {};
        const requiredFields: string[] = [];
        for (const [key, val] of Object.entries(value)) {
            properties[key] = generateSchema(val);
            requiredFields.push(key);
        }
        return {
            type: "object",
            properties,
            required: requiredFields,
        };
    }
    if (typeof value === "string") return { type: "string" };
    if (typeof value === "number") return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
    if (typeof value === "boolean") return { type: "boolean" };
    return {};
}

// Simple JSON Schema validator
function validateAgainstSchema(data: any, schema: any, path: string = ""): string[] {
    const errors: string[] = [];
    if (!schema || typeof schema !== "object") return errors;

    if (schema.type) {
        const types = Array.isArray(schema.type) ? schema.type : [schema.type];
        const actualType = data === null ? "null" : Array.isArray(data) ? "array" : typeof data;
        const typeMatch = types.some((t: string) => {
            if (t === "integer") return typeof data === "number" && Number.isInteger(data);
            return t === actualType;
        });
        if (!typeMatch) {
            errors.push(`${path || "root"}: Expected type "${schema.type}" but got "${actualType}"`);
            return errors;
        }
    }

    if (schema.type === "object" && typeof data === "object" && data !== null) {
        if (schema.required && Array.isArray(schema.required)) {
            for (const req of schema.required) {
                if (!(req in data)) {
                    errors.push(`${path ? path + "." : ""}${req}: Required field missing`);
                }
            }
        }
        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (key in data) {
                    errors.push(...validateAgainstSchema(data[key], propSchema, `${path ? path + "." : ""}${key}`));
                }
            }
        }
    }

    if (schema.type === "array" && Array.isArray(data) && schema.items) {
        data.forEach((item: any, i: number) => {
            errors.push(...validateAgainstSchema(item, schema.items, `${path}[${i}]`));
        });
    }

    if (schema.minimum !== undefined && typeof data === "number" && data < schema.minimum) {
        errors.push(`${path || "root"}: Value ${data} is less than minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && typeof data === "number" && data > schema.maximum) {
        errors.push(`${path || "root"}: Value ${data} is greater than maximum ${schema.maximum}`);
    }
    if (schema.minLength !== undefined && typeof data === "string" && data.length < schema.minLength) {
        errors.push(`${path || "root"}: String length ${data.length} is less than minLength ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && typeof data === "string" && data.length > schema.maxLength) {
        errors.push(`${path || "root"}: String length ${data.length} is greater than maxLength ${schema.maxLength}`);
    }

    return errors;
}

const sampleJson = `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "isActive": true,
  "address": {
    "city": "New York",
    "zip": "10001"
  },
  "hobbies": ["reading", "coding"]
}`;

export default function JsonSchemaPage() {
    const [input, setInput] = useLocalStorage("json-schema-input", sampleJson);
    const [schemaOutput, setSchemaOutput] = useState("");
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("generate");
    const [schemaInput, setSchemaInput] = useLocalStorage("json-schema-schema", "");
    const [jsonToValidate, setJsonToValidate] = useLocalStorage("json-schema-validate", "");
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [validationRun, setValidationRun] = useState(false);

    const generate = useCallback(() => {
        try {
            const data = JSON.parse(input);
            const schema = {
                $schema: "https://json-schema.org/draft/2020-12/schema",
                title: "Generated Schema",
                ...generateSchema(data),
            };
            setSchemaOutput(JSON.stringify(schema, null, 2));
            setError("");
        } catch (e: any) {
            setError(e.message);
            setSchemaOutput("");
        }
    }, [input]);

    const validate = useCallback(() => {
        try {
            const data = JSON.parse(jsonToValidate);
            const schema = JSON.parse(schemaInput);
            const errors = validateAgainstSchema(data, schema);
            setValidationErrors(errors);
            setValidationRun(true);
            setError("");
        } catch (e: any) {
            setError(e.message);
            setValidationErrors([]);
            setValidationRun(false);
        }
    }, [jsonToValidate, schemaInput]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">JSON Schema Generator & Validator</h1>
                <p className="text-muted-foreground">
                    Generate JSON Schema from data or validate JSON against an existing schema.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="generate">Generate Schema</TabsTrigger>
                    <TabsTrigger value="validate">Validate Against Schema</TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="mt-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Button onClick={generate} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white">
                            <Braces className="h-4 w-4 mr-1.5" />
                            Generate Schema
                        </Button>
                        <Toolbar
                            onCopy={() => navigator.clipboard.writeText(schemaOutput)}
                            downloadContent={schemaOutput}
                            downloadFilename="schema.json"
                            onClear={() => { setInput(""); setSchemaOutput(""); setError(""); }}
                            onUpload={(c) => setInput(c)}
                        />
                    </div>
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono">
                            <AlertCircle className="h-4 w-4 inline mr-2" />{error}
                        </div>
                    )}
                    <ResizableEditorLayout
                        leftPanel={<JsonEditor value={input} onChange={(v) => setInput(v)} height="100%" />}
                        rightPanel={<JsonEditor value={schemaOutput} readOnly height="100%" />}
                        leftLabel="JSON Input"
                        rightLabel="Generated Schema"
                        height="500px"
                        defaultLeftSize={50}
                        minLeftSize={25}
                        minRightSize={25}
                    />
                </TabsContent>

                <TabsContent value="validate" className="mt-4">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <Button onClick={validate} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white">
                            <Shield className="h-4 w-4 mr-1.5" />
                            Validate
                        </Button>
                        {validationRun && validationErrors.length === 0 && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Valid
                            </Badge>
                        )}
                        {validationRun && validationErrors.length > 0 && (
                            <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
                                <AlertCircle className="h-3 w-3 mr-1" /> {validationErrors.length} Error{validationErrors.length > 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono">
                            <AlertCircle className="h-4 w-4 inline mr-2" />{error}
                        </div>
                    )}
                    {validationErrors.length > 0 && (
                        <div className="mb-4 space-y-1">
                            {validationErrors.map((err, i) => (
                                <div key={i} className="p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 text-sm font-mono">
                                    {err}
                                </div>
                            ))}
                        </div>
                    )}
                    <ResizableEditorLayout
                        leftPanel={<JsonEditor value={schemaInput} onChange={(v) => setSchemaInput(v)} height="100%" />}
                        rightPanel={<JsonEditor value={jsonToValidate} onChange={(v) => setJsonToValidate(v)} height="100%" />}
                        leftLabel="JSON Schema"
                        rightLabel="JSON to Validate"
                        height="500px"
                        defaultLeftSize={50}
                        minLeftSize={25}
                        minRightSize={25}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
