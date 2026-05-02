'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Activity, 
  Globe, 
  Box, 
  ShieldCheck, 
  Clock, 
  Settings, 
  Plus, 
  ArrowUpRight,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useCart } from '@/lib/cart-store';
import { CartSheet } from '@/components/cart-sheet';

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
  const router = useRouter();
  const { data: session } = useSession();
  const { addToCart } = useCart();

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
      toast.error('Inventory synchronization failure');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, stock: Stock) => {
    addToCart({
      productId: product.id,
      productName: product.name,
      warehouseId: stock.warehouseId,
      warehouseName: stock.warehouseName,
      price: product.price,
      units: 1,
    });
    toast.success(`${product.name} allocated to fulfillment queue`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
          <Box className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
        </div>
        <p className="mt-6 text-slate-600 font-semibold tracking-tight animate-pulse">Syncing Global Inventory...</p>
      </div>
    );
  }

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Precision Navigation */}
      <nav className="sticky top-0 z-[60] bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-200 transition-transform group-hover:scale-105">
               <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="block font-black text-slate-900 leading-none tracking-tight text-lg">ALLO <span className="text-blue-600">OS</span></span>
              <span className="block text-[9px] uppercase tracking-[0.2em] text-slate-600 font-black mt-1">Infrastructure v2.4</span>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-1 border-r pr-8 border-slate-100">
               {isAdmin && (
                 <Button variant="ghost" onClick={() => router.push('/admin')} className="h-10 text-[11px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50/50 gap-2">
                   <Settings className="h-3.5 w-3.5" />
                   Admin Terminal
                 </Button>
               )}
               {!isAdmin && <CartSheet />}
               <Button variant="ghost" onClick={() => router.push('/cart')} className="h-10 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 gap-2">
                 <Activity className="h-3.5 w-3.5" />
                 {isAdmin ? 'Audit Trail' : 'Activity'}
               </Button>
            </div>
            
            <div className="flex items-center gap-5 pl-2">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{session?.user?.name}</p>
                <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest mt-0.5">{isAdmin ? 'Site Administrator' : 'Authorized Operator'}</p>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => signOut()} 
                className="h-10 w-10 rounded-xl border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto py-16 px-6 lg:px-12">
        {/* Dynamic Header */}
        <div className="mb-20 flex flex-col xl:flex-row xl:items-end justify-between gap-10">
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
               <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2 animate-pulse" />
                  Live Network Active
               </Badge>
               <span className="w-1 h-1 rounded-full bg-slate-200" />
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Global Inventory Protocol</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[0.95]">
              Real-time <br />
              <span className="text-slate-500">Fulfillment</span> Terminal.
            </h1>
            <p className="text-xl text-slate-500 max-w-xl font-medium leading-relaxed">
              Secure priority allocation across our multi-region network. 
              High-integrity reservations with automated expiration protection.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="bg-slate-900 p-6 rounded-[24px] shadow-2xl shadow-slate-200 flex items-center gap-6 min-w-[280px]">
                <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                   <Zap className="h-7 w-7 text-blue-400 fill-blue-400" />
                </div>
                <div>
                   <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-1">System Health</p>
                   <p className="text-lg font-bold text-white tracking-tight">Optimal Performance</p>
                </div>
             </div>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 gap-12">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
             <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">Available Manifest</h2>
             <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <span>Displaying {products.length} Units</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span>Sort by Demand</span>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {products.map((product) => (
              <div key={product.id} className="group relative">
                <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 bg-white rounded-[40px] overflow-hidden flex flex-col md:flex-row h-full border border-transparent hover:border-slate-100">
                  <div className="md:w-[42%] bg-slate-50 relative flex items-center justify-center p-12 group-hover:bg-slate-100/50 transition-colors">
                     <div className="absolute top-6 left-6">
                        <Badge variant="outline" className="border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest bg-white/50 backdrop-blur-sm">
                           REF: {product.id.slice(-6).toUpperCase()}
                        </Badge>
                     </div>
                     <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                          <Package className="h-12 w-12 text-slate-500 group-hover:text-blue-600 transition-colors" />
                        </div>
                     </div>
                  </div>
                  
                  <div className="md:w-[58%] flex flex-col p-10 lg:p-12">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{product.name}</h3>
                        <p className="text-2xl font-black text-slate-600 tracking-tighter">${(product.price ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-500 group-hover:border-blue-100 group-hover:text-blue-600 transition-all">
                        <ArrowUpRight className="h-5 w-5" />
                      </div>
                    </div>
                    
                    <p className="text-slate-500 text-sm leading-relaxed font-medium mb-10 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="space-y-5 mt-auto">
                      {product.stocks.map((stock) => {
                        const isSoldOut = stock.totalUnits === 0;
                        const isFullyReserved = stock.availableUnits === 0 && stock.reservedUnits > 0;

                        return (
                          <div key={stock.warehouseId} className="flex items-center justify-between group/stock border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center gap-4">
                              <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover/stock:bg-blue-50 group-hover/stock:border-blue-100 transition-colors">
                                <Warehouse className="h-5 w-5 text-slate-600 group-hover/stock:text-blue-600" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{stock.warehouseName}</p>
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isSoldOut ? 'bg-slate-300' :
                                    isFullyReserved ? 'bg-orange-400' : 'bg-emerald-500'
                                  }`} />
                                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                    {isSoldOut ? 'Depleted' : isFullyReserved ? 'Held' : `${stock.availableUnits} Active`}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {!isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-11 rounded-2xl px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                  stock.availableUnits > 0 
                                  ? "text-blue-600 hover:bg-blue-600 hover:text-white" 
                                  : "text-slate-500 cursor-not-allowed"
                                }`}
                                disabled={stock.availableUnits <= 0}
                                onClick={() => handleAddToCart(product, stock)}
                              >
                                {isSoldOut ? 'Void' : isFullyReserved ? 'Wait' : 'Reserve'}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {/* Minimalist Footer */}
      <footer className="mt-40 border-t border-slate-100 py-20 bg-white">
         <div className="max-w-[1440px] mx-auto px-6 flex flex-col items-center text-center space-y-8">
            <div className="flex items-center gap-3 opacity-20 grayscale grayscale-100">
               <ShieldCheck className="h-6 w-6" />
               <span className="text-xl font-black tracking-tighter">ALLO ENTERPRISE</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
               {['Compliance', 'Security', 'Infrastructure', 'Node Status'].map(item => (
                 <span key={item} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-blue-600 cursor-pointer transition-colors">{item}</span>
               ))}
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              © 2026 Allo Global Logistics Infrastructure. Secured by Enterprise Protocol v2.
            </p>
         </div>
      </footer>
    </div>
  );
}
