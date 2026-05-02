'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { Package, Warehouse, LogOut, Loader2, ChevronRight, ShoppingCart, History, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface Reservation {
  id: string;
  productId: string;
  warehouseId: string;
  units: number;
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED';
  expiresAt: string;
  createdAt: string;
  product: { name: string };
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

  const getStatusIcon = (status: string, expiresAt: string) => {
    const isExpired = status === 'PENDING' && new Date(expiresAt) < new Date();
    if (isExpired) return <Clock className="h-5 w-5 text-red-500" />;
    
    switch (status) {
      case 'PENDING': return <Clock className="h-5 w-5 text-orange-500" />;
      case 'CONFIRMED': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'RELEASED': return <XCircle className="h-5 w-5 text-slate-400" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string, expiresAt: string) => {
    const isExpired = status === 'PENDING' && new Date(expiresAt) < new Date();
    if (isExpired) return 'EXPIRED';
    return status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your activity...</p>
      </div>
    );
  }

  const pendingCount = reservations.filter(r => r.status === 'PENDING' && new Date(r.expiresAt) > new Date()).length;
  const confirmedCount = reservations.filter(r => r.status === 'CONFIRMED').length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navigation Bar */}
      <nav className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-slate-900 tracking-tight">Allo Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => router.push('/')} className="text-slate-600">
               Marketplace
             </Button>
            <div className="hidden md:block text-right mr-2 border-l pl-4">
              <p className="text-sm font-semibold text-slate-900 leading-none">{session?.user?.name}</p>
              <p className="text-xs text-slate-500 mt-1">{session?.user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-slate-500 hover:text-red-600">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
               </div>
               <h1 className="text-3xl font-bold text-slate-900">My Activity</h1>
            </div>
            <p className="text-slate-500">Track your current reservations and purchase history.</p>
          </div>
          <div className="flex gap-2">
             <Badge variant="secondary" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-100 border">
                {pendingCount} Active Holds
             </Badge>
             <Badge variant="secondary" className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-100 border">
                {confirmedCount} Purchases
             </Badge>
          </div>
        </div>

        {reservations.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 bg-transparent">
             <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                   <Package className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No activity yet</h3>
                <p className="text-slate-500 mb-6">You haven't reserved or purchased any products yet.</p>
                <Button onClick={() => router.push('/')}>
                   Browse Products
                </Button>
             </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reservations.map((res) => {
              const statusLabel = getStatusLabel(res.status, res.expiresAt);
              const isExpired = statusLabel === 'EXPIRED';
              
              return (
                <Card key={res.id} className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-all ${
                   res.status === 'PENDING' && !isExpired ? 'ring-2 ring-blue-500/20' : ''
                }`}>
                  <div className="flex flex-col md:flex-row items-center p-4 gap-4">
                    <div className={`p-4 rounded-xl ${
                      res.status === 'CONFIRMED' ? 'bg-emerald-50' : 
                      res.status === 'RELEASED' ? 'bg-slate-50' : 
                      isExpired ? 'bg-red-50' : 'bg-orange-50'
                    }`}>
                      {getStatusIcon(res.status, res.expiresAt)}
                    </div>
                    
                    <div className="flex-grow text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{res.product.name}</h3>
                        <div className="flex justify-center md:justify-start gap-2">
                           <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5">
                              {res.warehouse.name}
                           </Badge>
                           <Badge className={`text-[10px] uppercase font-bold py-0 h-5 ${
                             res.status === 'CONFIRMED' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                             res.status === 'RELEASED' ? 'bg-slate-400 hover:bg-slate-500' : 
                             isExpired ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'
                           }`}>
                             {statusLabel}
                           </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                         {res.units} unit(s) • {formatDistanceToNow(new Date(res.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
                      {res.status === 'PENDING' && !isExpired ? (
                        <Button 
                          size="sm" 
                          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                          onClick={() => router.push(`/checkout/${res.id}`)}
                        >
                          Complete Payment <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-slate-400 hover:text-blue-600"
                          onClick={() => router.push(`/checkout/${res.id}`)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
