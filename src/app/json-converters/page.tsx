"use client";

import { useState, useCallback } from "react";
import { JsonEditor } from "@/components/editor/json-editor";
import { Toolbar } from "@/components/editor/toolbar";
import { ResizableEditorLayout } from "@/components/editor/resizable-editor-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { jsonToCsv, csvToJson, jsonToXml, xmlToJson, jsonToYaml, yamlToJson, jsonToSql, jsonToExcel } from "@/lib/converters";
import { ArrowRightLeft, AlertCircle, Download } from "lucide-react";

const sampleJson = `[
  { "name": "Alice", "age": 30, "city": "NYC" },
  { "name": "Bob", "age": 25, "city": "LA" },
  { "name": "Charlie", "age": 35, "city": "Chicago" }
]`;

export default function JsonConvertersPage() {
    const [input, setInput] = useLocalStorage("json-converters-input", sampleJson);
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("json-csv");
    const [tableName, setTableName] = useState("users");

    const convert = useCallback(
        async (type: string) => {
            setError("");
            try {
                let result = "";
                switch (type) {
                    case "json-csv": result = jsonToCsv(input); break;
                    case "csv-json": result = csvToJson(input); break;
                    case "json-xml": result = jsonToXml(input); break;
                    case "xml-json": result = xmlToJson(input); break;
                    case "json-yaml": result = jsonToYaml(input); break;
                    case "yaml-json": result = yamlToJson(input); break;
                    case "json-sql": result = jsonToSql(input, tableName); break;
                    case "json-excel": {
                        const buf = await jsonToExcel(input);
                        const blob = new Blob([buf.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "data.xlsx";
                        a.click();
                        URL.revokeObjectURL(url);
                        result = "✅ Excel file downloaded!";
                        break;
                    }
                }
                setOutput(result);
            } catch (e: any) {
                setError(e.message);
                setOutput("");
            }
        },
        [input, tableName]
    );

    const tabs = [
        { id: "json-csv", label: "JSON → CSV" },
        { id: "csv-json", label: "CSV → JSON" },
        { id: "json-xml", label: "JSON → XML" },
        { id: "xml-json", label: "XML → JSON" },
        { id: "json-yaml", label: "JSON → YAML" },
        { id: "yaml-json", label: "YAML → JSON" },
        { id: "json-sql", label: "JSON → SQL" },
        { id: "json-excel", label: "JSON → Excel" },
    ];

    const getOutputLang = () => {
        if (activeTab.endsWith("-json")) return "json";
        if (activeTab.endsWith("-csv")) return "plaintext";
        if (activeTab.endsWith("-xml")) return "xml";
        if (activeTab.endsWith("-yaml")) return "yaml";
        if (activeTab.endsWith("-sql")) return "sql";
        return "plaintext";
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">JSON Converters</h1>
                <p className="text-muted-foreground">
                    Convert JSON to and from CSV, XML, YAML, SQL, and Excel.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                    {tabs.map((tab) => (
                        <TabsTrigger key={tab.id} value={tab.id} className="text-xs px-3 py-1.5">
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Button
                    onClick={() => convert(activeTab)}
                    className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
                >
                    <ArrowRightLeft className="h-4 w-4 mr-1.5" />
                    Convert
                </Button>
                {activeTab === "json-sql" && (
                    <Input
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        placeholder="Table name"
                        className="w-40"
                    />
                )}
                <Toolbar
                    onCopy={() => navigator.clipboard.writeText(output)}
                    downloadContent={output}
                    downloadFilename={`output.${getOutputLang() === "plaintext" ? "csv" : getOutputLang()}`}
                    onClear={() => { setInput(""); setOutput(""); setError(""); }}
                    onUpload={(content) => setInput(content)}
                />
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {error}
                </div>
            )}

            <ResizableEditorLayout
                leftPanel={
                    <JsonEditor
                        value={input}
                        onChange={(v) => setInput(v)}
                        height="100%"
                        language={activeTab.startsWith("csv-") ? "plaintext" : activeTab.startsWith("xml-") ? "xml" : activeTab.startsWith("yaml-") ? "yaml" : "json"}
                    />
                }
                rightPanel={<JsonEditor value={output} readOnly height="100%" language={getOutputLang()} />}
                leftLabel="Input"
                rightLabel="Output"
                height="500px"
                defaultLeftSize={50}
                minLeftSize={25}
                minRightSize={25}
            />
        </div>
    );
}
