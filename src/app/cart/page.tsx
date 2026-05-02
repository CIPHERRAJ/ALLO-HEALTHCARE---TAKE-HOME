'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { Package, Warehouse, LogOut, Loader2, ChevronRight, ShoppingCart, History, Clock, CheckCircle2, XCircle, ArrowLeft, Filter, Search } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface Reservation {
  id: string;
  productId: string;
  warehouseId: string;
  units: number;
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED';
  expiresAt: string;
  createdAt: string;
  product: { name: string; price: number };
  warehouse: { name: string };
}

export default function CartPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await fetch('/api/reservations');
      if (!res.ok) throw new Error('Failed to fetch activity');
      const data = await res.json();
      setReservations(data);
    } catch (error) {
      toast.error('Could not load your activity');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string, expiresAt: string) => {
    const isExpired = status === 'PENDING' && new Date(expiresAt) < new Date();
    if (isExpired) return { 
      label: 'EXPIRED', 
      icon: <Clock className="h-4 w-4" />, 
      color: 'bg-red-50 text-red-700 border-red-100',
      dot: 'bg-red-500'
    };
    
    switch (status) {
      case 'PENDING': return { 
        label: 'ACTIVE HOLD', 
        icon: <Clock className="h-4 w-4" />, 
        color: 'bg-orange-50 text-orange-700 border-orange-100',
        dot: 'bg-orange-500 animate-pulse'
      };
      case 'CONFIRMED': return { 
        label: 'FULFILLED', 
        icon: <CheckCircle2 className="h-4 w-4" />, 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        dot: 'bg-emerald-500'
      };
      case 'RELEASED': return { 
        label: 'RELEASED', 
        icon: <XCircle className="h-4 w-4" />, 
        color: 'bg-slate-50 text-slate-500 border-slate-100',
        dot: 'bg-slate-400'
      };
      default: return { 
        label: status, 
        icon: <Package className="h-4 w-4" />, 
        color: 'bg-slate-50 text-slate-500 border-slate-100',
        dot: 'bg-slate-400'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
          <History className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
        </div>
        <p className="mt-6 text-slate-600 font-semibold tracking-tight animate-pulse">Retrieving Activity Logs...</p>
      </div>
    );
  }

  const pendingCount = reservations.filter(r => r.status === 'PENDING' && new Date(r.expiresAt) > new Date()).length;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="container mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:bg-blue-600 transition-colors">
               <ArrowLeft className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-bold text-slate-900 leading-tight">Activity Log</span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">Session ID: {session?.user?.email?.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/')} className="rounded-xl border-slate-200 font-bold text-xs uppercase tracking-wider hidden sm:flex">
               Return to Terminal
            </Button>
            <div className="h-10 w-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center">
               <span className="text-xs font-bold text-blue-700">{session?.user?.name?.[0].toUpperCase()}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Transactions</h1>
               <p className="text-slate-500 font-medium mt-1">Audit trail for your inventory reservations and fulfillments.</p>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-bold">{pendingCount} Pending holds</span>
               </div>
            </div>
          </div>

          {/* Activity List */}
          {reservations.length === 0 ? (
            <Card className="p-20 text-center border-none shadow-sm bg-white rounded-3xl">
               <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                     <History className="h-10 w-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Transaction History</h3>
                  <p className="text-slate-500 mb-8 max-w-sm font-medium">Your audit log is currently empty. Start by reserving units from the inventory terminal.</p>
                  <Button onClick={() => router.push('/')} className="bg-slate-900 hover:bg-blue-600 rounded-xl px-8 font-bold transition-all">
                     Initialize Marketplace
                  </Button>
               </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {reservations.map((res) => {
                const config = getStatusConfig(res.status, res.expiresAt);
                const isPending = res.status === 'PENDING' && config.label !== 'EXPIRED';
                
                return (
                  <Card key={res.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all bg-white rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-6">
                      {/* Left: Status Icon */}
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${config.color} border group-hover:scale-110 transition-transform`}>
                        {config.icon}
                      </div>
                      
                      {/* Middle: Info */}
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-slate-900 leading-none">{res.product.name}</h3>
                          <Badge variant="outline" className={`border-none font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-lg ${config.color}`}>
                             <span className={`w-1.5 h-1.5 rounded-full mr-2 ${config.dot}`} />
                             {config.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-400">
                           <div className="flex items-center gap-1.5">
                              <Warehouse className="h-3.5 w-3.5" />
                              {res.warehouse.name}
                           </div>
                           <div className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5" />
                              {res.units} Units • ${(res.units * (res.product.price ?? 0)).toLocaleString()}
                           </div>
                           <div className="text-slate-300">•</div>
                           <div>{formatDistanceToNow(new Date(res.createdAt), { addSuffix: true })}</div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                         {isPending ? (
                           <Button 
                             onClick={() => router.push(`/checkout/${res.id}`)}
                             className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-100 px-6 group/btn"
                           >
                             Complete <ChevronRight className="ml-1.5 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                           </Button>
                         ) : (
                           <Button 
                             variant="ghost" 
                             onClick={() => router.push(`/checkout/${res.id}`)}
                             className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest"
                           >
                             Details
                           </Button>
                         )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <footer className="mt-20 border-t border-slate-200 py-12 bg-white">
         <div className="container mx-auto px-6 flex flex-col items-center text-center">
            <p className="text-slate-400 text-sm font-medium italic">"Ensuring integrity in every reservation."</p>
         </div>
      </footer>
    </div>
  );
}
