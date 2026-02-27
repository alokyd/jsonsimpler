"use client";

import { useState, useCallback } from "react";
import { JsonEditor } from "@/components/editor/json-editor";
import { Toolbar } from "@/components/editor/toolbar";
import { SingleEditorLayout } from "@/components/editor/single-editor-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Plus, X, AlertCircle } from "lucide-react";

interface FieldConfig {
    name: string;
    type: string;
    id: string;
}

const fieldTypes = [
    { value: "name", label: "Full Name" },
    { value: "firstName", label: "First Name" },
    { value: "lastName", label: "Last Name" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "uuid", label: "UUID" },
    { value: "number", label: "Number (1-1000)" },
    { value: "boolean", label: "Boolean" },
    { value: "date", label: "Date" },
    { value: "city", label: "City" },
    { value: "country", label: "Country" },
    { value: "address", label: "Street Address" },
    { value: "company", label: "Company" },
    { value: "url", label: "URL" },
    { value: "avatar", label: "Avatar URL" },
    { value: "paragraph", label: "Paragraph" },
    { value: "word", label: "Word" },
    { value: "color", label: "Color (Hex)" },
    { value: "ip", label: "IP Address" },
];

function generateValue(type: string): any {
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = <T,>(arr: T[]) => arr[rand(0, arr.length - 1)];
    const uuid = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });

    const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "Emma", "Liam", "Olivia", "Noah", "Ava", "Sophia"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"];
    const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "San Antonio", "San Diego", "Dallas", "London", "Paris", "Tokyo", "Berlin", "Sydney", "Toronto", "Mumbai"];
    const countries = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "India", "Brazil", "Mexico"];
    const companies = ["Acme Inc", "TechCorp", "GlobalSoft", "InnovateLabs", "DataDrive", "CloudFirst", "PixelPerfect", "CodeMasters", "ByteWise", "NetFlow"];
    const words = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "tempor"];

    const fn = pick(firstNames);
    const ln = pick(lastNames);

    switch (type) {
        case "name": return `${fn} ${ln}`;
        case "firstName": return fn;
        case "lastName": return ln;
        case "email": return `${fn.toLowerCase()}.${ln.toLowerCase()}${rand(1, 99)}@example.com`;
        case "phone": return `+1-${rand(200, 999)}-${rand(100, 999)}-${rand(1000, 9999)}`;
        case "uuid": return uuid();
        case "number": return rand(1, 1000);
        case "boolean": return Math.random() > 0.5;
        case "date": return new Date(Date.now() - rand(0, 365 * 5) * 86400000).toISOString().split("T")[0];
        case "city": return pick(cities);
        case "country": return pick(countries);
        case "address": return `${rand(100, 9999)} ${pick(["Main", "Oak", "Pine", "Maple", "Cedar", "Elm"])} ${pick(["St", "Ave", "Blvd", "Dr", "Way"])}`;
        case "company": return pick(companies);
        case "url": return `https://www.${pick(words)}${rand(1, 99)}.com`;
        case "avatar": return `https://i.pravatar.cc/150?u=${uuid()}`;
        case "paragraph": return Array.from({ length: rand(8, 15) }, () => pick(words)).join(" ") + ".";
        case "word": return pick(words);
        case "color": return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
        case "ip": return `${rand(1, 255)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`;
        default: return null;
    }
}

export default function JsonGeneratorPage() {
    const [fields, setFields] = useState<FieldConfig[]>([
        { id: "1", name: "id", type: "uuid" },
        { id: "2", name: "name", type: "name" },
        { id: "3", name: "email", type: "email" },
        { id: "4", name: "age", type: "number" },
        { id: "5", name: "isActive", type: "boolean" },
    ]);
    const [count, setCount] = useState(5);
    const [output, setOutput] = useState("");

    const addField = () => {
        setFields([...fields, { id: Date.now().toString(), name: "", type: "name" }]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter((f) => f.id !== id));
    };

    const updateField = (id: string, key: "name" | "type", value: string) => {
        setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
    };

    const generate = useCallback(() => {
        const data = Array.from({ length: count }, () => {
            const obj: Record<string, any> = {};
            fields.forEach((field) => {
                if (field.name) {
                    obj[field.name] = generateValue(field.type);
                }
            });
            return obj;
        });
        setOutput(JSON.stringify(data, null, 2));
    }, [fields, count]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Random JSON Generator</h1>
                <p className="text-muted-foreground">
                    Generate random JSON data with customizable fields for testing.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Field Builder */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold">Field Configuration</h2>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={count}
                                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                className="w-20"
                                min={1}
                                max={100}
                            />
                            <span className="text-sm text-muted-foreground">records</span>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        {fields.map((field) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <Input
                                    value={field.name}
                                    onChange={(e) => updateField(field.id, "name", e.target.value)}
                                    placeholder="Field name"
                                    className="flex-1"
                                />
                                <Select value={field.type} onValueChange={(val) => updateField(field.id, "type", val)}>
                                    <SelectTrigger className="w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fieldTypes.map((ft) => (
                                            <SelectItem key={ft.value} value={ft.value}>
                                                {ft.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" onClick={() => removeField(field.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={addField}>
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Field
                        </Button>
                        <Button onClick={generate} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white">
                            <Shuffle className="h-4 w-4 mr-1.5" />
                            Generate
                        </Button>
                    </div>
                </div>

                {/* Output */}
                <div>
                    <SingleEditorLayout
                        editor={<JsonEditor value={output} readOnly height="100%" />}
                        label="Generated JSON"
                        height="500px"
                        headerExtra={
                            <Toolbar
                                onCopy={() => navigator.clipboard.writeText(output)}
                                downloadContent={output}
                                downloadFilename="generated.json"
                            />
                        }
                    />
                </div>
            </div>
        </div>
    );
}
