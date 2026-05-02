'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdminRegistration, setIsAdminRegistration] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");
  const [adminExists, setAdminExists] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const res = await fetch('/api/register/status');
      const data = await res.json();
      setAdminExists(data.adminExists);
    } catch (e) {
      setAdminExists(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, isAdminRegistration, adminSecret }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register");
      }

      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="text-center space-y-1">
          <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
            A
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription className="text-slate-500">
            Join Allo Inventory platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className={`p-4 rounded-xl border transition-all ${isAdminRegistration ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-start gap-3">
                 <div className="mt-0.5">
                    <input 
                      id="adminMode"
                      type="checkbox" 
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      checked={isAdminRegistration}
                      onChange={(e) => setIsAdminRegistration(e.target.checked)}
                    />
                 </div>
                 <Label htmlFor="adminMode" className="cursor-pointer">
                    <span className="block font-bold text-blue-900 text-sm">Register as System Administrator</span>
                    <span className="block text-[11px] text-blue-700/70 font-medium">
                      {adminExists ? "Requires Admin Secret key" : "No admin detected. Initial setup mode."}
                    </span>
                 </Label>
              </div>

              {isAdminRegistration && (
                <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="adminSecret" className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Admin Secret Key</Label>
                  <Input
                    id="adminSecret"
                    type="password"
                    placeholder="Enter secret key..."
                    className="bg-white border-blue-200 focus-visible:ring-blue-500"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    required={isAdminRegistration}
                  />
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 text-lg font-medium shadow-sm transition-all hover:scale-[1.01]" 
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Register"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in here
            </Link>
          </div>
          <p className="text-center text-xs text-slate-400">
            © 2026 Allo Healthcare. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
