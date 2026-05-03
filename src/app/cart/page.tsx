'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { 
  Package, 
  Warehouse, 
  LogOut, 
  Loader2, 
  ChevronRight, 
  History, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Zap, 
  ShieldCheck,
  Search,
  Download
} from "lucide-react";
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
    
    // Background synchronization enabled for high-integrity live updates
    const pollInterval = setInterval(() => {
      fetchReservations();
    }, 15000); // Sync every 15 seconds

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    // Immediate refresh on timer expiry for a 'live' ledger experience
    const checkExpiries = setInterval(() => {
      const hasExpired = reservations.some(
        res => res.status === 'PENDING' && new Date(res.expiresAt) < new Date()
      );
      if (hasExpired) {
        fetchReservations();
      }
    }, 1000);

    return () => clearInterval(checkExpiries);
  }, [reservations]);

  const fetchReservations = async () => {
    try {
      const res = await fetch('/api/reservations');
      if (!res.ok) throw new Error('Failed to fetch activity');
      const data = await res.json();
      setReservations(data);
    } catch (error) {
      toast.error('Audit trail synchronization failure');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reservations.length === 0) return;
    
    const headers = ['ID', 'Product', 'Warehouse', 'Units', 'Total Price', 'Status', 'Created At'];
    const rows = reservations.map(res => [
      res.id,
      `"${res.product.name}"`,
      `"${res.warehouse.name}"`,
      res.units,
      (res.units * (res.product.price ?? 0)).toFixed(2),
      res.status,
      `"${new Date(res.createdAt).toLocaleString()}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ledger_export_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Ledger exported to CSV');
  };

  const getStatusConfig = (status: string, expiresAt: string) => {
    const isExpired = status === 'PENDING' && new Date(expiresAt) < new Date();
    if (isExpired) return { 
      label: 'EXPIRED', 
      icon: <XCircle className="h-4 w-4" />, 
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
        label: 'VOIDED', 
        icon: <Zap className="h-4 w-4" />, 
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
          <History className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
        </div>
        <p className="mt-6 text-slate-600 font-semibold tracking-tight animate-pulse">Syncing Transaction History...</p>
      </div>
    );
  }

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-white">
      {/* Precision Navbar */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-slate-200 transition-transform group-hover:scale-105">
               <ArrowLeft className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-black text-slate-900 leading-none tracking-tight text-lg">{isAdmin ? 'Audit Trail' : 'My Activity'}</span>
              <span className="block text-[9px] uppercase tracking-[0.2em] text-slate-600 font-black mt-1">Operator: {session?.user?.email?.split('@')[0].toUpperCase()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Button variant="outline" onClick={() => router.push('/')} className="h-10 rounded-xl border-slate-100 font-black text-[10px] uppercase tracking-widest px-6 hidden sm:flex">
               Return to Terminal
            </Button>
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
               <span className="text-xs font-black text-blue-600">{session?.user?.name?.[0].toUpperCase()}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto py-16 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-10">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <Badge className="bg-slate-900 text-white border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md">
                     System Registry
                  </Badge>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Transaction Audit Log</span>
               </div>
               <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Global Ledger.</h1>
               <p className="text-lg text-slate-500 font-medium max-w-xl">
                  Comprehensive audit trail for all inventory allocations and fulfillment protocols initiated by this node.
               </p>
            </div>
            
            <div className="flex items-center gap-3">
               <Button 
                 variant="outline" 
                 onClick={handleExportCSV}
                 className="h-12 rounded-xl border-slate-100 gap-2 text-[11px] font-black uppercase tracking-widest px-6 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
               >
                  <Download className="h-4 w-4" />
                  Export CSV
               </Button>
            </div>
          </div>

          {/* Ledger Interface */}
          {reservations.length === 0 ? (
            <div className="py-40 text-center flex flex-col items-center">
               <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 border border-slate-100/50">
                  <History className="h-10 w-10 text-slate-400" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-2">Registry Empty</h3>
               <p className="text-slate-600 mb-10 max-w-sm font-medium">No transaction records detected in the current session parameters.</p>
               <Button onClick={() => router.push('/')} className="h-14 bg-slate-900 hover:bg-blue-600 rounded-2xl px-10 font-bold transition-all shadow-xl shadow-slate-200">
                  Initialize Terminal
               </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 px-8 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                 <div className="col-span-6">Allocation Details</div>
                 <div className="col-span-3">Status Matrix</div>
                 <div className="col-span-3 text-right">Actions</div>
              </div>

              {reservations.map((res) => {
                const config = getStatusConfig(res.status, res.expiresAt);
                const isPending = res.status === 'PENDING' && config.label !== 'EXPIRED';
                
                return (
                  <Card key={res.id} className="group border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.06)] transition-all duration-300 bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-12 items-center p-6 lg:p-8 gap-8">
                        {/* Allocation Details */}
                        <div className="md:col-span-6 flex items-center gap-6">
                           <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 ${config.color} group-hover:scale-105`}>
                              {config.icon}
                           </div>
                           <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                 <h3 className="text-lg font-black text-slate-900 tracking-tight">{res.product.name}</h3>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{res.id.slice(-6).toUpperCase()}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">
                                 <div className="flex items-center gap-1.5">
                                    <Warehouse className="h-3 w-3" />
                                    {res.warehouse.name}
                                 </div>
                                 <div className="flex items-center gap-1.5">
                                    <Package className="h-3 w-3" />
                                    {res.units} Units • ${(res.units * (res.product.price ?? 0)).toLocaleString()}
                                 </div>
                                 <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(res.createdAt), { addSuffix: true })}
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Status Matrix */}
                        <div className="md:col-span-3">
                           <Badge variant="outline" className={`border-none font-black text-[9px] tracking-[0.2em] uppercase px-4 py-2 rounded-xl flex items-center w-fit gap-2.5 ${config.color}`}>
                              <span className={`w-2 h-2 rounded-full shadow-sm ${config.dot}`} />
                              {config.label}
                           </Badge>
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-3 flex justify-end items-center gap-4">
                           {isPending ? (
                             <Button 
                               onClick={() => router.push(`/checkout/${res.id}`)}
                               className="h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 px-8 group/btn transition-all active:scale-95"
                             >
                               Finalize <ChevronRight className="ml-2 h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                             </Button>
                           ) : (
                             <Button 
                               variant="ghost" 
                               onClick={() => router.push(`/checkout/${res.id}`)}
                               className="h-12 text-slate-600 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest px-6"
                             >
                               Details
                             </Button>
                           )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <footer className="mt-40 border-t border-slate-100 py-16 bg-white">
         <div className="max-w-[1440px] mx-auto px-6 flex flex-col items-center text-center space-y-6">
            <div className="flex items-center gap-2 opacity-30 grayscale">
               <ShieldCheck className="h-5 w-5" />
               <span className="text-sm font-black tracking-tighter uppercase">Protocol Integrity</span>
            </div>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] italic">
               "Ensuring integrity in every atomic reservation."
            </p>
         </div>
      </footer>
    </div>
  );
}
