'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { differenceInSeconds } from 'date-fns';
import { ShieldCheck, Clock, Package, Warehouse, CreditCard, ArrowLeft, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

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
  // Stable idempotency key for this page instance
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
        // Refresh to show expired state
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
      toast.error('Failed to load reservation');
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
        toast.error('Reservation has expired');
        fetchReservation();
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to confirm purchase');
      }

      toast.success('Purchase confirmed!');
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
        throw new Error(data.error || 'Failed to cancel reservation');
      }

      toast.success('Reservation cancelled');
      router.push('/cart');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Validating Secure Session...</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-6">
        <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-bold text-slate-900">Session Invalid</h2>
        <p className="text-slate-500 mt-2 text-center max-w-sm">The reservation record could not be located in our global ledger.</p>
        <Button onClick={() => router.push('/')} className="mt-8 rounded-xl px-8 font-bold">Return to Terminal</Button>
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
    <div className="min-h-screen bg-[#f8fafc] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/cart')} 
          className="mb-8 text-slate-500 hover:text-slate-900 font-bold gap-2 pl-0"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Activity
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
          <Card className="border-none shadow-2xl shadow-blue-900/5 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-8">
              <div className="flex justify-between items-center mb-4">
                <Badge variant="outline" className="text-blue-400 border-blue-400/30 uppercase font-black tracking-widest text-[10px]">
                   Secure Transaction
                </Badge>
                <div className="flex items-center gap-2 text-blue-400">
                   <ShieldCheck className="h-5 w-5" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Encrypted</span>
                </div>
              </div>
              <CardTitle className="text-3xl font-black tracking-tight">Final Confirmation</CardTitle>
              <CardDescription className="text-slate-400 font-medium">Review your allocation details below.</CardDescription>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8">
              {/* Product Info */}
              <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="h-16 w-16 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <Package className="h-8 w-8 text-slate-300" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Inventory Item</p>
                  <h3 className="text-xl font-bold text-slate-900">{reservation.product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">{reservation.warehouse.name}</span>
                  </div>
                </div>
                <div className="ml-auto text-right">
                   <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Price</p>
                   <p className="text-2xl font-black text-blue-600">${(reservation.units * (reservation.product.price ?? 0)).toLocaleString()}</p>
                   <p className="text-[10px] text-slate-400 font-bold mt-1">{reservation.units} x ${(reservation.product.price ?? 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Status Allocation</p>
                    <Badge className={`px-4 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest ${
                      reservation.status === 'CONFIRMED' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                      reservation.status === 'RELEASED' ? 'bg-slate-400 hover:bg-slate-500' : 
                      isExpired ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600 animate-pulse'
                    }`}>
                      {isExpired ? 'EXPIRED' : reservation.status}
                    </Badge>
                 </div>

                 {reservation.status === 'PENDING' && !isExpired && (
                   <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl text-center relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="h-20 w-20 -mr-6 -mt-6" />
                     </div>
                     <p className="text-xs text-orange-800 font-black uppercase tracking-widest mb-1">Time to Confirm</p>
                     <p className="text-5xl font-black text-orange-900 font-mono tracking-tighter">{formatTime(timeLeft)}</p>
                   </div>
                 )}

                 {reservation.status === 'CONFIRMED' && (
                   <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
                     <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                     <p className="text-sm font-bold text-emerald-800">Inventory Secured</p>
                     <p className="text-xs text-emerald-600 font-medium mt-1">This transaction is officially logged in the system.</p>
                   </div>
                 )}

                 {(isExpired || reservation.status === 'RELEASED') && (
                   <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center">
                     <XCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                     <p className="text-sm font-bold text-red-800">{isExpired ? 'Allocation Expired' : 'Allocation Released'}</p>
                     <p className="text-xs text-red-600 font-medium mt-1">The reserved units have been returned to the available pool.</p>
                   </div>
                 )}
              </div>
            </CardContent>
            
            <CardFooter className="p-8 pt-0 flex flex-col gap-4">
              {reservation.status === 'PENDING' && !isExpired ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <Button 
                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-sm uppercase tracking-widest shadow-xl shadow-blue-200" 
                    onClick={handleConfirm} 
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Confirm Purchase
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-14 rounded-2xl font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" 
                    onClick={handleCancel} 
                    disabled={processing}
                  >
                    Cancel Reservation
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                   <Button 
                    variant="outline"
                    className="h-14 rounded-2xl font-bold text-slate-900 border-slate-200" 
                    onClick={() => router.push('/cart')}
                  >
                    Return to Activity
                  </Button>
                  <Button 
                    className="h-14 bg-slate-900 hover:bg-blue-600 rounded-2xl font-bold text-white shadow-xl" 
                    onClick={() => router.push('/')}
                  >
                    Back to Terminal
                  </Button>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2 mt-4">
                 <ShieldCheck className="h-3.5 w-3.5 text-slate-300" />
                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">End-to-End Secure Transaction Protocol</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
