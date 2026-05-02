'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, X, Trash2, Loader2, ChevronRight, Package, Warehouse, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CartSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeFromCart, clearCart, total } = useCart();
  const [isReserving, setIsReserving] = useState(false);
  const router = useRouter();

  const [cartItems, setCartItems] = useState(items);
  
  useEffect(() => {
    setCartItems(items);
  }, [items]);

  useEffect(() => {
    const handleUpdate = () => {
      const savedCart = localStorage.getItem('allo-cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    };
    window.addEventListener('cart-updated', handleUpdate);
    return () => window.removeEventListener('cart-updated', handleUpdate);
  }, []);

  const handleBatchReserve = async () => {
    if (cartItems.length === 0) return;
    
    setIsReserving(true);
    const idempotencyKey = crypto.randomUUID();
    
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(cartItems.map(item => ({
          productId: item.productId,
          warehouseId: item.warehouseId,
          units: item.units
        }))),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast.error(`Allocation conflict: Node reporting zero availability.`);
        } else {
          throw new Error(data.error || 'Fulfillment request rejected');
        }
        return;
      }

      toast.success('Inventory units successfully locked');
      clearCart();
      setIsOpen(false);
      
      if (Array.isArray(data)) {
        router.push('/cart'); 
      } else {
        router.push(`/checkout/${data.id}`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        onClick={() => setIsOpen(true)}
        className="h-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 hover:bg-slate-50 gap-2 relative"
      >
        <Zap className="h-3.5 w-3.5 fill-current" />
        Queue
        {cartItems.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
            {cartItems.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 lg:p-10 bg-slate-900 text-white flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-5">
                 <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <Zap className="h-6 w-6 text-white fill-white" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black tracking-tight leading-none uppercase">Fulfillment Terminal</h2>
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                       <ShieldCheck className="h-3 w-3" />
                       Atomic Protocol Ready
                    </p>
                 </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-white/10 h-10 w-10 text-white/50">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="flex-grow overflow-y-auto max-h-[60vh] p-8 lg:p-10 space-y-6 bg-slate-50/50">
              {cartItems.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-24 h-24 bg-white rounded-[40px] shadow-sm flex items-center justify-center mb-8 border border-slate-100">
                    <Package className="h-10 w-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Queue Status: Idle</h3>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mt-2">Initialize allocation to proceed</p>
                </div>
              ) : (
                <div className="space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 px-1">Inventory Targets</p>
                   {cartItems.map((item) => (
                    <div key={`${item.productId}-${item.warehouseId}`} className="group relative">
                      <div className="flex gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.08)] transition-all">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100/50 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors duration-500">
                          <Package className="h-8 w-8 text-slate-300 group-hover:text-blue-500" />
                        </div>
                        <div className="flex-grow min-w-0 py-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-black text-slate-900 text-base truncate tracking-tight">{item.productName}</h4>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeFromCart(item.productId, item.warehouseId)}
                              className="text-slate-200 hover:text-red-500 rounded-2xl h-8 w-8 -mr-2 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            <Warehouse className="h-3.5 w-3.5 text-blue-600" />
                            {item.warehouseName}
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                             <p className="text-blue-600 font-black text-lg tracking-tighter">
                                ${item.price.toLocaleString()} <span className="text-slate-300 mx-1 text-sm font-medium">×</span> {item.units}
                             </p>
                             <Badge variant="outline" className="rounded-lg border-slate-100 bg-slate-50 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                Locked Unit
                             </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {cartItems.length > 0 && (
              <div className="p-10 border-t border-slate-100 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Combined Asset Valuation</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl font-black text-slate-900 tracking-tighter">${total.toLocaleString()}</span>
                       <span className="text-xs font-black text-blue-600 uppercase tracking-widest">USD</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Button 
                      variant="ghost"
                      onClick={() => clearCart()}
                      className="h-16 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      Purge Queue
                    </Button>
                    <Button 
                      disabled={isReserving}
                      onClick={handleBatchReserve}
                      className="h-16 px-10 bg-slate-900 hover:bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
                    >
                      {isReserving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Authorize Secure Hold <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-3">
                   <ShieldCheck className="h-4 w-4 text-emerald-500" />
                   <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em]">
                     Encrypted Multi-Node Synchronization Protocol v2.4
                   </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
