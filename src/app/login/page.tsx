'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { ShieldCheck, ArrowRight, Loader2, Package, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Identity Verified");
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      toast.error("System connection failure");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white lg:bg-slate-50/50 px-4">
      <div className="w-full max-w-[440px] space-y-8">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200 mb-4 animate-in zoom-in duration-500">
            <Package className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Terminal</h1>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-[0.2em]">Allo Logistics Infrastructure</p>
        </div>

        <Card className="border-none shadow-2xl shadow-blue-900/5 rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="pt-10 px-10 pb-2">
            <CardTitle className="text-xl font-bold">Sign In</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Please enter your secure credentials.</CardDescription>
          </CardHeader>
          
          <CardContent className="p-10 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@allo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-base font-medium px-5"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-600">Security Key</Label>
                  <Link href="#" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Reset Access</Link>
                </div>
                <div className="relative group/pass">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-base font-medium px-5 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-lg shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Authorize Session <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="px-10 pb-10 flex flex-col space-y-6 border-t border-slate-50 pt-8">
            <div className="text-center text-sm font-medium text-slate-500">
              New to the platform?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold underline-offset-4 hover:underline">
                Create Operator Account
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3" />
              <span>End-to-End Encrypted Node</span>
            </div>
          </CardFooter>
        </Card>
        
        <p className="text-center text-[10px] font-medium text-slate-600 tracking-wide uppercase">
          © 2026 Allo Healthcare Global. All rights reserved.
        </p>
      </div>
    </div>
  );
}