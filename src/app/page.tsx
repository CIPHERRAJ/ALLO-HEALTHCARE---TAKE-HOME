'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { Package, Warehouse, LogOut, Loader2, ChevronRight, ShoppingCart, Info, Activity, Globe, Box, ShieldCheck, Clock, AlertTriangle, Settings } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface Stock {
  warehouseId: string;
  warehouseName: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
  earliestExpiry: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  stocks: Stock[];
  price: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservingId, setReservingId] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error('Could not sync with inventory server');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (productId: string, warehouseId: string) => {
    setReservingId(`${productId}-${warehouseId}`);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ productId, warehouseId, units: 1 }),
      });

      if (res.status === 409) {
        toast.error('This item just went out of stock');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Reservation system unavailable');
      }

      const reservation = await res.json();
      toast.success('Inventory hold secured');
      router.push(`/checkout/${reservation.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setReservingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
          <Box className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
        </div>
        <p className="mt-6 text-slate-600 font-semibold tracking-tight animate-pulse">Syncing Global Inventory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Refined Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="container mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 ring-4 ring-blue-50">
               <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="block font-bold text-slate-900 leading-tight">Allo Logistics</span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">Internal OS v2.0</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 border-r pr-6 border-slate-200">
               {(session?.user as any)?.role === 'ADMIN' && (
                 <Button variant="ghost" onClick={() => router.push('/admin')} className="text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-bold transition-all">
                   <Settings className="h-4 w-4" />
                   Admin Console
                 </Button>
               )}
               <Button variant="ghost" onClick={() => router.push('/cart')} className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-semibold transition-all">
                 <ShoppingCart className="h-4 w-4" />
                 My Activity
               </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-none">{session?.user?.name}</p>
                <Badge variant="outline" className="mt-1 text-[9px] bg-slate-50 text-slate-500 font-bold border-slate-200">System Operator</Badge>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => signOut()} 
                className="rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto py-12 px-6">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
               <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3">
                  <Globe className="h-3 w-3 mr-1.5" /> Live Network
               </Badge>
               <span className="text-slate-300 text-sm">|</span>
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Marketplace</span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Enterprise Inventory</h1>
            <p className="text-lg text-slate-500 leading-relaxed font-medium">
              Real-time stock management across multi-region fulfillment centers. 
              <span className="text-blue-600 font-semibold ml-1">Secure your allocation before final confirmation.</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 px-6">
                <div className="p-2 bg-emerald-100 rounded-lg">
                   <Activity className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                   <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">System Status</p>
                   <p className="text-sm font-bold text-slate-900">All Nodes Active</p>
                </div>
             </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-3xl">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-[40%] bg-slate-50 relative flex items-center justify-center p-12 overflow-hidden border-b md:border-b-0 md:border-r border-slate-100">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Box className="h-32 w-32 -mr-8 -mt-8 rotate-12" />
                   </div>
                   <div className="relative z-10 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Package className="h-10 w-10 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-slate-200 text-slate-500 font-bold">
                        SKU: {product.id.slice(-6).toUpperCase()}
                      </Badge>
                   </div>
                </div>
                
                <div className="md:w-[60%] flex flex-col p-8">
                  <div className="mb-8">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-grow">
                        <CardTitle className="text-2xl font-bold text-slate-900">{product.name}</CardTitle>
                        <p className="text-blue-600 font-black text-xl mt-1 tracking-tight">${(product.price ?? 0).toLocaleString()}</p>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-blue-500/30 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <CardDescription className="text-slate-500 text-sm leading-relaxed line-clamp-2 font-medium">
                      {product.description}
                    </CardDescription>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Warehouse Nodes</p>
                       <span className="h-[1px] flex-grow mx-4 bg-slate-100" />
                    </div>
                    
                    {product.stocks.map((stock) => {
                      const isSoldOut = stock.totalUnits === 0;
                      const isFullyReserved = stock.availableUnits === 0 && stock.reservedUnits > 0;

                      return (
                        <div key={stock.warehouseId} className="relative group/stock">
                          <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                            isSoldOut ? 'bg-slate-50 border-slate-100 opacity-60' :
                            isFullyReserved ? 'bg-orange-50/30 border-orange-100' :
                            'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5'
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                                isSoldOut ? 'bg-slate-200 text-slate-400' :
                                isFullyReserved ? 'bg-orange-100 text-orange-600' :
                                'bg-white border border-slate-100 group-hover/stock:bg-blue-50 group-hover/stock:border-blue-100 text-slate-400 group-hover/stock:text-blue-600'
                              }`}>
                                <Warehouse className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{stock.warehouseName}</p>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`flex h-1.5 w-1.5 rounded-full ${
                                      isSoldOut ? 'bg-slate-400' :
                                      isFullyReserved ? 'bg-orange-500 animate-pulse' :
                                      'bg-emerald-500 animate-pulse'
                                    }`} />
                                    <p className={`text-[11px] font-bold ${
                                      isSoldOut ? 'text-slate-400' :
                                      isFullyReserved ? 'text-orange-600' :
                                      'text-slate-500'
                                    }`}>
                                      {isSoldOut ? 'Sold Out Permanently' :
                                       isFullyReserved ? 'Temporarily Held' :
                                       `${stock.availableUnits} units ready`}
                                    </p>
                                  </div>

                                  {isFullyReserved && stock.earliestExpiry && (
                                    <div className="flex items-center gap-1 ml-3.5">
                                      <Clock className="h-3 w-3 text-orange-400" />
                                      <p className="text-[9px] font-bold text-orange-400 uppercase tracking-tight">
                                        Next release {formatDistanceToNow(new Date(stock.earliestExpiry), { addSuffix: true })}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant={stock.availableUnits > 0 ? "default" : "secondary"}
                              className={`rounded-xl px-5 font-bold transition-all ${
                                stock.availableUnits > 0 
                                ? "bg-slate-900 hover:bg-blue-600 text-white shadow-md hover:shadow-blue-500/20" 
                                : "cursor-not-allowed opacity-40"
                              }`}
                              disabled={stock.availableUnits <= 0 || !!reservingId}
                              onClick={() => handleReserve(product.id, stock.warehouseId)}
                            >
                              {reservingId === `${product.id}-${stock.warehouseId}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isSoldOut ? (
                                'Sold Out'
                              ) : isFullyReserved ? (
                                'On Hold'
                              ) : (
                                <>
                                  Reserve <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
      
      {/* Footer Branding */}
      <footer className="mt-20 border-t border-slate-200 py-12 bg-white">
         <div className="container mx-auto px-6 flex flex-col items-center text-center">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
               <Package className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Allo Global Logistics Infrastructure</p>
            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">© 2026 Secured Transaction Protocol</p>
         </div>
      </footer>
    </div>
  );
}
