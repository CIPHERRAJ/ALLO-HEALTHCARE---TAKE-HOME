'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, X, Trash2, Loader2, ChevronRight, Package, Warehouse, Zap, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CartSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeFromCart, clearCart, total } = useCart();
  const [isReserving, setIsReserving] = useState(false);
  const router = useRouter();

  // Re-sync items when localStorage changes
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
          toast.error(`Allocation conflict: Node ${data.item?.slice(-4) || 'delta'} reporting zero availability.`);
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
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white h-full shadow-[0_0_80px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500 ease-in-out">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Fulfillment Queue</h2>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                   <ShieldCheck className="h-3 w-3" />
                   Secured Priority Access
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-slate-50 h-10 w-10">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
                    <Package className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Queue Empty</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={`${item.productId}-${item.warehouseId}`} className="group relative">
                    <div className="flex gap-5">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100/50 group-hover:bg-slate-100 transition-colors">
                        <Package className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="flex-grow min-w-0 py-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{item.productName}</h4>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeFromCart(item.productId, item.warehouseId)}
                            className="text-slate-300 hover:text-red-500 rounded-xl h-6 w-6 -mr-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                          <Warehouse className="h-3 w-3" />
                          {item.warehouseName}
                        </div>
                        <p className="text-blue-600 font-black text-sm mt-3 tracking-tight">
                           ${item.price.toLocaleString()} <span className="text-slate-300 mx-1">×</span> {item.units}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Combined Value</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">${total.toLocaleString()}</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 mb-1">
                    {cartItems.length} Allocations
                  </Badge>
                </div>
                
                <Button 
                  disabled={isReserving}
                  onClick={handleBatchReserve}
                  className="w-full bg-slate-900 hover:bg-blue-600 text-white h-16 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isReserving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Secure All Units <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
                <p className="text-[9px] text-center text-slate-400 mt-6 font-black uppercase tracking-widest leading-relaxed">
                  * Atomic transaction protocol initialized across {new Set(cartItems.map(i => i.warehouseId)).size} nodes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
