'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, X, Trash2, Loader2, ChevronRight, Package, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CartSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeFromCart, clearCart, total } = useCart();
  const [isReserving, setIsReserving] = useState(false);
  const router = useRouter();

  // Re-sync items when localStorage changes in other components
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
          toast.error(`Stock conflict: ${data.item || 'one of your items'} is no longer available.`);
        } else {
          throw new Error(data.error || 'Failed to process batch reservation');
        }
        return;
      }

      toast.success('All items secured in inventory!');
      clearCart();
      setIsOpen(false);
      
      // If it was a batch, data is an array. We can go to the first one or a general activity page.
      if (Array.isArray(data)) {
        router.push('/cart'); // This is the activity log page
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
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="relative rounded-xl border-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2"
      >
        <ShoppingCart className="h-4 w-4" />
        Cart
        {cartItems.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
            {cartItems.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Your Cart</h2>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Fulfillment Queue</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <ShoppingCart className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-slate-500 font-medium">Your cart is empty</p>
                  <Button variant="link" onClick={() => setIsOpen(false)} className="text-blue-600 font-bold">
                    Browse Inventory
                  </Button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <Card key={`${item.productId}-${item.warehouseId}`} className="p-4 border-slate-100 shadow-sm rounded-2xl">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{item.productName}</h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase mt-1">
                            <Warehouse className="h-3 w-3" />
                            {item.warehouseName}
                          </div>
                          <p className="text-blue-600 font-bold text-sm mt-2">${item.price.toLocaleString()} × {item.units}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeFromCart(item.productId, item.warehouseId)}
                        className="text-slate-300 hover:text-red-500 rounded-lg h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-end mb-6">
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Total Valuation</p>
                  <p className="text-2xl font-black text-slate-900">${total.toLocaleString()}</p>
                </div>
                
                <Button 
                  disabled={isReserving}
                  onClick={handleBatchReserve}
                  className="w-full bg-slate-900 hover:bg-blue-600 text-white h-14 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all"
                >
                  {isReserving ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <>
                      Reserve All Items <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-center text-slate-400 mt-4 font-medium italic">
                  * Batching locks global inventory across {new Set(cartItems.map(i => i.warehouseId)).size} nodes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
