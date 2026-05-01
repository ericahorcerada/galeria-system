"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, Plus, RefreshCw, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Staff = {
  cashier_id: number;
  full_name: string;
  username: string;
  role: "cashier" | "supervisor" | "admin";
  status: "active" | "inactive" | "on_leave";
  created_at: string;
};

type StaffForm = {
  cashierId?: number;
  fullName: string;
  username: string;
  role: Staff["role"];
  status: Staff["status"];
  password: string;
};

const emptyForm: StaffForm = {
  fullName: "",
  username: "",
  role: "cashier",
  status: "active",
  password: "",
};

export default function StaffAdminPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    return params.toString();
  }, [search, role, status]);

  async function loadStaff() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/staff${query ? `?${query}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "Unable to load staff.");
        return;
      }
      setStaff(result.staff);
    } catch {
      setError("Unable to reach the staff server.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, [query]);

  function openCreateForm() {
    setForm(emptyForm);
    setIsFormOpen(true);
    setMessage("");
    setError("");
  }

  function openEditForm(account: Staff) {
    setForm({
      cashierId: account.cashier_id,
      fullName: account.full_name,
      username: account.username,
      role: account.role,
      status: account.status,
      password: "",
    });
    setIsFormOpen(true);
    setMessage("");
    setError("");
  }

  async function saveStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/staff", {
        method: form.cashierId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "Unable to save staff account.");
        return;
      }
      setMessage(form.cashierId ? "Staff account updated." : "Staff account created.");
      setIsFormOpen(false);
      await loadStaff();
    } catch {
      setError("Unable to reach the staff server.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteStaff(account: Staff) {
    if (!window.confirm(`Delete ${account.full_name}'s staff account?`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/staff?cashierId=${account.cashier_id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "Unable to delete staff account.");
        return;
      }
      setMessage("Staff account deleted.");
      await loadStaff();
    } catch {
      setError("Unable to reach the staff server.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Staff</h1>
          <p className="text-muted-foreground">Manage MySQL-backed cashier, supervisor, and admin accounts.</p>
        </div>
        <div className="mobile-stack-actions flex flex-col gap-2 sm:flex-row">
          <Button onClick={loadStaff} variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button onClick={openCreateForm} size="sm"><Plus className="mr-2 h-4 w-4" />Add Staff</Button>
        </div>
      </div>

      {message && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or username" className="pl-9" />
          </div>
          <select value={role} onChange={(event) => setRole(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="cashier">Cashier</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On leave</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading staff...</p> : (
            <div className="overflow-x-auto">
              <table className="mobile-safe-table w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((account) => (
                    <tr key={account.cashier_id} className="border-b last:border-0">
                      <td className="px-4 py-3"><p className="font-medium">{account.full_name}</p></td>
                      <td className="px-4 py-3">{account.username}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs capitalize"><ShieldCheck className="h-3 w-3" />{account.role}</span></td>
                      <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">{account.status.replace("_", " ")}</span></td>
                      <td className="px-4 py-3">{new Date(account.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditForm(account)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => deleteStaff(account)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {staff.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No staff accounts found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={saveStaff} className="w-full max-w-2xl rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl">{form.cashierId ? "Edit Staff" : "Add Staff"}</h2>
                <p className="text-sm text-muted-foreground">Admin accounts can access all admin CRUD screens.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Name</Label><Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></div>
              <div className="space-y-2"><Label>Username</Label><Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></div>
              <div className="space-y-2"><Label>Role</Label><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffForm["role"] })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="admin">Admin</option><option value="supervisor">Supervisor</option><option value="cashier">Cashier</option></select></div>
              <div className="space-y-2"><Label>Status</Label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StaffForm["status"] })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option><option value="on_leave">On leave</option></select></div>
              <div className="space-y-2 md:col-span-2"><Label>{form.cashierId ? "New Password" : "Password"}</Label><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={form.cashierId ? "Leave blank to keep current" : "At least 8 characters"} required={!form.cashierId} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Staff"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
