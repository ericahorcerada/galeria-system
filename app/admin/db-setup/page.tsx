"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RequestStatus = "idle" | "loading" | "success" | "error";

type DbResponse = {
  success: boolean;
  message?: string;
  error?: string;
  summary?: Record<string, string | number>;
};

async function readJsonResponse(response: Response): Promise<DbResponse> {
  const text = await response.text();

  try {
    return JSON.parse(text) as DbResponse;
  } catch {
    return {
      success: false,
      error: `Server returned a non-JSON response: ${text.substring(0, 200)}`,
    };
  }
}

export default function DatabaseSetup() {
  const [token, setToken] = useState("");
  const [schemaStatus, setSchemaStatus] = useState<RequestStatus>("idle");
  const [seedStatus, setSeedStatus] = useState<RequestStatus>("idle");
  const [schemaMessage, setSchemaMessage] = useState("");
  const [seedMessage, setSeedMessage] = useState("");
  const [seedSummary, setSeedSummary] = useState<Record<string, string | number> | null>(null);

  const requestOptions = {
    method: "POST",
    headers: {
      "x-db-admin-token": token,
    },
  };

  const createSchema = async () => {
    setSchemaStatus("loading");
    setSchemaMessage("Creating database schema...");

    try {
      const response = await fetch("/api/db/setup", requestOptions);
      const data = await readJsonResponse(response);

      if (response.ok && data.success) {
        setSchemaStatus("success");
        setSchemaMessage(data.message || "Database schema created successfully.");
        return true;
      }

      setSchemaStatus("error");
      setSchemaMessage(data.error || "Failed to create schema.");
      return false;
    } catch (error) {
      setSchemaStatus("error");
      setSchemaMessage(error instanceof Error ? error.message : "Unknown error");
      return false;
    }
  };

  const seedDatabase = async () => {
    setSeedStatus("loading");
    setSeedMessage("Seeding database with live data...");

    try {
      const response = await fetch("/api/db/seed", requestOptions);
      const data = await readJsonResponse(response);

      if (response.ok && data.success) {
        setSeedStatus("success");
        setSeedMessage(data.message || "Database seeded successfully.");
        setSeedSummary(data.summary || null);
        return true;
      }

      setSeedStatus("error");
      setSeedMessage(data.error || "Failed to seed database.");
      return false;
    } catch (error) {
      setSeedStatus("error");
      setSeedMessage(error instanceof Error ? error.message : "Unknown error");
      return false;
    }
  };

  const runBoth = async () => {
    const schemaCreated = await createSchema();
    if (schemaCreated) await seedDatabase();
  };

  return (
    <div className="min-h-screen bg-foreground p-8 text-background">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="mb-12 text-center">
          <h1 className="mb-2 font-serif text-4xl font-bold">Database Setup</h1>
          <p className="text-background/60">Initialize your MySQL database with schema and seed data.</p>
        </div>

        <Card className="border-background/10 bg-background/5">
          <CardHeader>
            <CardTitle className="text-background">Admin Token Required</CardTitle>
            <CardDescription className="text-background/60">
              Enter the value of DB_ADMIN_TOKEN. These database mutation endpoints are blocked without it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="db-token" className="text-background">DB Admin Token</Label>
            <Input
              id="db-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste DB_ADMIN_TOKEN"
              className="bg-background text-foreground"
            />
          </CardContent>
        </Card>

        <Card className="border-background/10 bg-background/5">
          <CardHeader>
            <CardTitle className="text-background">Step 1: Create Schema</CardTitle>
            <CardDescription className="text-background/60">Creates the database tables and relationships.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createSchema} disabled={!token || schemaStatus === "loading"} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {schemaStatus === "loading" ? "Creating Schema..." : "Create Schema"}
            </Button>
            {schemaMessage && (
              <div className={`rounded p-3 text-sm ${schemaStatus === "success" ? "bg-green-900/30 text-green-400" : schemaStatus === "error" ? "bg-red-900/30 text-red-400" : "bg-background/10 text-background/60"}`}>
                {schemaMessage}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-background/10 bg-background/5">
          <CardHeader>
            <CardTitle className="text-background">Step 2: Seed Data</CardTitle>
            <CardDescription className="text-background/60">Populates sample Filipino artists, artworks, inventory, staff, and sales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={seedDatabase} disabled={!token || seedStatus === "loading" || schemaStatus !== "success"} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {seedStatus === "loading" ? "Seeding Database..." : "Seed Database"}
            </Button>
            {seedMessage && (
              <div className={`rounded p-3 text-sm ${seedStatus === "success" ? "bg-green-900/30 text-green-400" : seedStatus === "error" ? "bg-red-900/30 text-red-400" : "bg-background/10 text-background/60"}`}>
                {seedMessage}
              </div>
            )}
            {seedSummary && (
              <div className="space-y-2 rounded bg-background/10 p-4">
                <h4 className="mb-3 font-semibold text-accent">Data Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(seedSummary).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <span className="capitalize text-background/60">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                      <span className="font-mono text-background">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-background/10 bg-background/5">
          <CardHeader>
            <CardTitle className="text-background">Quick Setup</CardTitle>
            <CardDescription className="text-background/60">Run both steps automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runBoth} disabled={!token || schemaStatus === "loading" || seedStatus === "loading"} variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              Run Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
