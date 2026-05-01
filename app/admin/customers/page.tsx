"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

type Customer = {
  customer_id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  loyalty_points: number;
  status: "active" | "inactive";
  created_at: string;
  total_orders: number;
  total_spent: number;
};

type CustomerForm = {
  customerId?: number;
  fullName: string;
  email: string;
  phone: string;
  loyaltyPoints: string;
  status: "active" | "inactive";
  password: string;
};

const emptyForm: CustomerForm = {
  fullName: "",
  email: "",
  phone: "",
  loyaltyPoints: "0",
  status: "active",
  password: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    return params.toString();
  }, [search, status]);

  async function loadCustomers() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/customers${query ? `?${query}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "Unable to load customers.");
        return;
      }
      setCustomers(result.customers);
    } catch {
      setError("Unable to reach the customers server.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [query]);

  function openCreateForm() {
    setForm(emptyForm);
    setIsFormOpen(true);
    setMessage("");
    setError("");
  }

  function openEditForm(customer: Customer) {
    setForm({
      customerId: customer.customer_id,
      fullName: customer.full_name,
      email: customer.email || "",
      phone: customer.phone || "",
      loyaltyPoints: String(customer.loyalty_points || 0),
      status: customer.status || "active",
      password: "",
    });
    setIsFormOpen(true);
    setMessage("");
    setError("");
  }

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/customers", {
        method: form.customerId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "Unable to save customer.");
        return;
      }
      setMessage(form.customerId ? "Customer updated." : "Customer created.");
      setIsFormOpen(false);
      await loadCustomers();
    } catch {
      setError("Unable to reach the customers server.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCustomer(customer: Customer) {
    if (!window.confirm(`Delete ${customer.full_name}? Existing orders will keep their order details.`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/customers?customerId=${customer.customer_id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "Unable to delete customer.");
        return;
      }
      setMessage("Customer deleted.");
      await loadCustomers();
    } catch {
      setError("Unable to reach the customers server.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground sm:text-3xl">Customers</h1>
          <p className="text-muted-foreground">Live MySQL customer records, loyalty points, and ecommerce order history.</p>
        </div>
        <div className="mobile-stack-actions flex flex-col gap-2 sm:flex-row">
          <Button onClick={loadCustomers} variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button onClick={openCreateForm} size="sm"><Plus className="mr-2 h-4 w-4" />Add Customer</Button>
        </div>
      </div>

      {message && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or phone" className="pl-9" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading customers...</p> : (
            <div className="overflow-x-auto">
              <table className="mobile-safe-table w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Orders</th>
                    <th className="px-4 py-3 font-medium">Spent</th>
                    <th className="px-4 py-3 font-medium">Points</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.customer_id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{customer.full_name}</p>
                        <p className="text-xs text-muted-foreground">Since {new Date(customer.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{customer.email || "No email"}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone || "No phone"}</p>
                      </td>
                      <td className="px-4 py-3">{Number(customer.total_orders || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium">{peso.format(Number(customer.total_spent || 0))}</td>
                      <td className="px-4 py-3">{Number(customer.loyalty_points || 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">{customer.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditForm(customer)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => deleteCustomer(customer)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No customers found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={saveCustomer} className="w-full max-w-2xl rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl">{form.customerId ? "Edit Customer" : "Add Customer"}</h2>
                <p className="text-sm text-muted-foreground">Passwords are optional for admin-created customers.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Name</Label><Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
              <div className="space-y-2"><Label>Loyalty Points</Label><Input type="number" min="0" value={form.loyaltyPoints} onChange={(event) => setForm({ ...form, loyaltyPoints: event.target.value })} /></div>
              <div className="space-y-2"><Label>Status</Label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CustomerForm["status"] })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              <div className="space-y-2"><Label>{form.customerId ? "New Password" : "Password"}</Label><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={form.customerId ? "Leave blank to keep current" : "Optional"} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Customer"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
