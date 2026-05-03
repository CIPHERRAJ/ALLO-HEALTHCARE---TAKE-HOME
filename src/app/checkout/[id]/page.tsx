'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { differenceInSeconds } from 'date-fns';
import { ShieldCheck, Clock, Package, Warehouse, CreditCard, ArrowLeft, Loader2, AlertCircle, CheckCircle2, XCircle, Zap, Globe } from 'lucide-react';

interface Reservation {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED';
  expiresAt: string;
  units: number;
  product: { name: string; price: number };
  warehouse: { name: string };
}

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [confirmationKey] = useState(typeof window !== 'undefined' ? crypto.randomUUID() : '');
  const router = useRouter();

  useEffect(() => {
    fetchReservation();
  }, [id]);

  useEffect(() => {
    if (!reservation || reservation.status !== 'PENDING') return;

    const interval = setInterval(() => {
      const seconds = differenceInSeconds(new Date(reservation.expiresAt), new Date());
      setTimeLeft(Math.max(0, seconds));
      
      if (seconds <= 0) {
        clearInterval(interval);
        fetchReservation();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  const fetchReservation = async () => {
    try {
      const res = await fetch(`/api/reservations/${id}`);
      if (!res.ok) throw new Error('Failed to fetch reservation');
      const data = await res.json();
      setReservation(data);
      
      const seconds = differenceInSeconds(new Date(data.expiresAt), new Date());
      setTimeLeft(Math.max(0, seconds));
    } catch (error) {
      toast.error('Failed to load reservation record');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/reservations/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Idempotency-Key': confirmationKey,
        },
      });

      if (res.status === 410) {
        toast.error('Allocation window has closed');
        fetchReservation();
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Protocol execution failure');
      }

      toast.success('Allocation permanently secured');
      fetchReservation();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/reservations/${id}/release`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Release protocol failure');
      }

      toast.success('Units returned to available pool');
      router.push('/cart');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
          <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
        </div>
        <p className="mt-6 text-slate-600 font-semibold tracking-tight animate-pulse">Establishing Secure Session...</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mb-8">
           <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Record Terminated</h2>
        <p className="text-slate-500 mt-4 text-center max-w-sm font-medium">The requested allocation record could not be synchronized with the global ledger.</p>
        <Button onClick={() => router.push('/')} className="mt-10 h-14 rounded-2xl px-10 bg-slate-900 font-bold shadow-xl shadow-slate-200">Return to Terminal</Button>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft <= 0 && reservation.status === 'PENDING';

  return (
    <div className="min-h-screen bg-white lg:bg-slate-50/30 py-12 lg:py-24 px-6">
      <div className="max-w-[1000px] mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/cart')} 
          className="mb-12 text-slate-600 hover:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] gap-3 pl-0"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Activity
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Transaction Card */}
          <div className="lg:col-span-8">
            <Card className="border-none shadow-2xl shadow-blue-900/5 rounded-[40px] overflow-hidden bg-white">
              <div className="bg-slate-900 p-10 lg:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Globe className="h-40 w-40 -mr-10 -mt-10" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-blue-600 text-white border-none uppercase font-black tracking-widest text-[9px] px-3 py-1 rounded-md">
                       Protocol 7-B Ready
                    </Badge>
                    <div className="flex items-center gap-2 text-blue-400">
                       <ShieldCheck className="h-5 w-5 fill-current" />
                       <span className="text-[9px] font-black uppercase tracking-[0.2em]">Verified Node</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none">Final Confirmation.</h1>
                    <p className="text-slate-600 font-medium text-lg">Inventory units are temporarily locked for your session.</p>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-10 lg:p-12 space-y-12">
                {/* Product Detail */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 pb-12 border-b border-slate-50">
                  <div className="h-24 w-24 bg-slate-50 rounded-[32px] flex items-center justify-center shrink-0 border border-slate-100">
                    <Package className="h-10 w-10 text-slate-500" />
                  </div>
                  <div className="flex-grow space-y-2">
                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">Inventory Allocation</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{reservation.product.name}</h3>
                    <div className="flex items-center gap-3">
                      <Warehouse className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{reservation.warehouse.name}</span>
                    </div>
                  </div>
                  <div className="sm:text-right space-y-1">
                     <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">Transaction Value</p>
                     <p className="text-4xl font-black text-blue-600 tracking-tighter">${(reservation.units * (reservation.product.price ?? 0)).toLocaleString()}</p>
                     <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{reservation.units} Units @ ${reservation.product.price.toLocaleString()}</p>
                  </div>
                </div>

                {/* Status Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 px-1">Fulfillment Status</p>
                      <div className={`p-6 rounded-[24px] border flex items-center justify-between transition-all ${
                        reservation.status === 'CONFIRMED' ? 'bg-emerald-50 border-emerald-100' : 
                        reservation.status === 'RELEASED' ? 'bg-slate-50 border-slate-100' : 
                        isExpired ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'
                      }`}>
                         <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                              reservation.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-600' : 
                              reservation.status === 'RELEASED' ? 'bg-slate-200 text-slate-600' : 
                              isExpired ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                               {reservation.status === 'CONFIRMED' ? <CheckCircle2 className="h-6 w-6" /> : 
                                reservation.status === 'RELEASED' ? <XCircle className="h-6 w-6" /> : 
                                isExpired ? <AlertCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                            </div>
                            <div>
                               <p className={`text-sm font-black uppercase tracking-widest ${
                                 reservation.status === 'CONFIRMED' ? 'text-emerald-700' : 
                                 reservation.status === 'RELEASED' ? 'text-slate-500' : 
                                 isExpired ? 'text-red-700' : 'text-orange-700'
                               }`}>
                                 {isExpired ? 'EXPIRED' : reservation.status}
                               </p>
                               <p className="text-[10px] font-bold text-slate-600 uppercase mt-0.5 tracking-tight">System Registry</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {reservation.status === 'PENDING' && !isExpired && (
                     <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 px-1">Allocation Timer</p>
                        <div className="bg-slate-900 p-6 rounded-[24px] text-center relative overflow-hidden group">
                           <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                           <p className="text-4xl font-black text-white font-mono tracking-tighter relative z-10">{formatTime(timeLeft)}</p>
                           <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.3em] mt-2 relative z-10">Hold Valid</p>
                        </div>
                     </div>
                   )}
                </div>
              </CardContent>
              
              <CardFooter className="p-10 lg:p-12 pt-0 flex flex-col gap-6">
                {reservation.status === 'PENDING' && !isExpired ? (
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <Button 
                      className="flex-grow h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02]" 
                      onClick={handleConfirm} 
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="animate-spin h-5 w-5" /> : <CreditCard className="mr-3 h-5 w-5" />}
                      Confirm Purchase
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-16 rounded-2xl px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all"
                      onClick={handleCancel}
                      disabled={processing}
                    >
                      Cancel Purchase
                    </Button>                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                     <Button 
                      variant="outline"
                      className="flex-grow h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-900 border-slate-100 hover:bg-slate-50 shadow-sm" 
                      onClick={() => router.push('/cart')}
                    >
                      View Audit Log
                    </Button>
                    <Button 
                      className="flex-grow h-16 bg-slate-900 hover:bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white shadow-xl transition-all" 
                      onClick={() => router.push('/')}
                    >
                      Exit Terminal
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Side Integrity Info */}
          <div className="lg:col-span-4 space-y-8">
             <div className="p-8 rounded-[32px] bg-blue-50/50 border border-blue-100/50 space-y-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                   <Zap className="h-6 w-6 text-blue-600 fill-blue-600" />
                </div>
                <div className="space-y-2">
                   <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Integrity Protocol</h4>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Your allocation is secured via 256-bit encryption. Units are exclusively held for this session ID until the timer expires.
                   </p>
                </div>
             </div>

             <div className="px-4 space-y-4">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                   <ShieldCheck className="h-3 w-3" />
                   <span>Security ID: {id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                   <Globe className="h-3 w-3" />
                   <span>Node: Global-East-1</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
