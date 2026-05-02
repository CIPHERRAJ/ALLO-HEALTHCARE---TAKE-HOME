'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, Loader2, Package, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Security keys do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, adminSecret }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account Provisioned Successfully");
        router.push("/login");
      } else {
        toast.error(data.error || "Provisioning failed");
      }
    } catch (error) {
      toast.error("Network synchronization error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white lg:bg-slate-50/50 py-12 px-4">
      <div className="w-full max-w-[480px] space-y-8">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200 mb-4 animate-in zoom-in duration-500">
            <Package className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Operator Provisioning</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Initialize Global Access</p>
        </div>

        <Card className="border-none shadow-2xl shadow-blue-900/5 rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="pt-10 px-10 pb-2 text-center sm:text-left">
            <CardTitle className="text-xl font-bold">New Registration</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Configure your platform identity.</CardDescription>
          </CardHeader>
          
          <CardContent className="p-10 pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium px-4"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@allo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium px-4"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Security Key</Label>
                  <div className="relative group/pass">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium px-4 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Key</Label>
                  <div className="relative group/pass">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium px-4 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative pt-2 pb-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-white px-3 text-slate-300">Staff Credentials</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adminSecret" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Administrative Secret (Optional)</Label>
                <Input
                  id="adminSecret"
                  type="password"
                  placeholder="Enter token for elevated privileges"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium px-4 border-dashed"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-lg shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Initialize Account <UserPlus className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="px-10 pb-10 flex flex-col space-y-6 border-t border-slate-50 pt-8">
            <div className="text-center text-sm font-medium text-slate-500">
              Already have access?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-bold underline-offset-4 hover:underline">
                Return to Access Terminal
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              <CheckCircle2 className="h-3 w-3" />
              <span>Identity Verified via Global Ledger</span>
            </div>
          </CardFooter>
        </Card>
        
        <p className="text-center text-[10px] font-medium text-slate-400 tracking-wide uppercase">
          © 2026 Allo Healthcare Global. All rights reserved.
        </p>
      </div>
    </div>
  );
}
