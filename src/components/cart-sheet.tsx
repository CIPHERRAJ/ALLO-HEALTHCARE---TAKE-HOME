'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '@/lib/cart-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Trash2, Loader2, Package, Warehouse, ShieldCheck, ArrowRight, Activity, Globe, Zap, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CartSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const [isReserving, setIsReserving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-cart', handleOpen);
    return () => window.removeEventListener('open-cart', handleOpen);
  }, []);

  const handleBatchReserve = async () => {
    if (items.length === 0) return;
    
    setIsReserving(true);
    const idempotencyKey = crypto.randomUUID();
    
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(items.map(item => ({
          productId: item.productId,
          warehouseId: item.warehouseId,
          units: item.units
        }))),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast.error(`Allocation conflict detected.`);
        } else {
          throw new Error(data.error || 'Protocol request rejected');
        }
        return;
      }

      toast.success('Units successfully secured');
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
      {items.length > 0 && (
        <Button 
          variant="ghost" 
          onClick={() => setIsOpen(true)}
          className="h-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 hover:bg-slate-50 gap-2 relative group"
        >
          <Zap className="h-4 w-4 group-hover:text-blue-600 transition-colors" />
          Queue
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              {items.length}
            </span>
          )}
        </Button>
      )}

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 lg:p-12">
          {/* Viewport-filling Backdrop Blur */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[80px] animate-in fade-in duration-500" onClick={() => setIsOpen(false)} />
          
          {/* Floating Manifest Card */}
          <div className="relative w-full max-w-5xl h-full max-h-[90vh] bg-white rounded-[40px] lg:rounded-[56px] shadow-[0_40px_150px_-20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 pointer-events-auto">
            
            <div className="flex flex-col lg:flex-row h-full overflow-hidden">
               
               {/* Execution Control - Moves to bottom on mobile, side on desktop */}
               <div className="order-2 lg:order-1 lg:w-[38%] bg-slate-900 text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden shrink-0">
                  <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                     <ShieldCheck className="h-96 w-96 -ml-20 -mt-20 rotate-12" />
                  </div>

                  <div className="relative z-10 hidden lg:block">
                    <div className="flex items-center gap-4 mb-12">
                       <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                          <Zap className="h-6 w-6 text-white fill-white" />
                       </div>
                       <div>
                          <h2 className="text-xl font-black tracking-tight uppercase text-white">MANIFEST</h2>
                          <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mt-1">SYSTEM v2.4</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h3 className="text-4xl font-black tracking-tight leading-[1.1] text-white">Review <br /><span className="text-slate-500">Allocations.</span></h3>
                       <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-[240px]">
                          Verify units and warehouse nodes before authorizing global lock protocol.
                       </p>
                    </div>
                  </div>

                  <div className="relative z-10 space-y-6 lg:space-y-8">
                     <div className="pt-0 lg:pt-8 lg:border-t border-white/10 flex lg:block justify-between items-end">
                        <div>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1 lg:mb-2">Total Value</p>
                          <p className="text-3xl lg:text-5xl font-black tracking-tighter text-white">${total.toLocaleString()}</p>
                        </div>
                        <div className="lg:hidden flex items-center gap-2 mb-1">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Secured</span>
                        </div>
                     </div>

                     <Button 
                       disabled={isReserving || items.length === 0}
                       onClick={handleBatchReserve}
                       className="w-full h-14 lg:h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl lg:rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                     >
                       {isReserving ? (
                         <Loader2 className="h-5 w-5 animate-spin" />
                       ) : (
                         <>
                           Authorize Hold <ArrowRight className="h-5 w-5" />
                         </>
                       )}
                     </Button>
                  </div>
               </div>

               {/* Registry Deck */}
               <div className="order-1 lg:order-2 flex-grow flex flex-col bg-white overflow-hidden">
                  <div className="p-6 lg:p-10 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
                        <Activity className="h-4 w-4 text-blue-600" />
                        Inventory Registry ({items.length})
                     </span>
                     <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full h-10 w-10 text-slate-300 hover:text-slate-900 hover:bg-slate-50">
                       <X className="h-6 w-6" />
                     </Button>
                  </div>

                  <div className="flex-grow overflow-y-auto p-6 lg:p-10 space-y-4 lg:space-y-6 scrollbar-hide bg-white">
                     {items.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center py-20">
                          <Package className="h-16 w-16 text-slate-100 mb-6" />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Registry Idle</p>
                       </div>
                     ) : (
                       items.map((item) => (
                         <div key={`${item.productId}-${item.warehouseId}`} className="group flex items-center gap-4 lg:gap-8 bg-slate-50/50 p-4 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-slate-100/50 hover:bg-white hover:border-blue-100 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] transition-all duration-500">
                           <div className="h-12 w-12 lg:h-16 lg:w-16 bg-white rounded-2xl lg:rounded-3xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                              <Package className="h-6 w-6 lg:h-8 lg:w-8 text-slate-400 group-hover:text-blue-500" />
                           </div>
                           
                           <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                 <h4 className="text-sm lg:text-lg font-black text-slate-900 tracking-tight truncate mr-2">{item.productName}</h4>
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   onClick={() => removeFromCart(item.productId, item.warehouseId)}
                                   className="text-slate-200 hover:text-red-500 h-6 w-6 lg:h-8 lg:w-8 rounded-lg lg:rounded-xl transition-colors shrink-0"
                                 >
                                   <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                                 </Button>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-500">
                                 <span className="flex items-center gap-1">
                                    <Warehouse className="h-3 w-3 text-blue-600" />
                                    {item.warehouseName}
                                 </span>
                                 <span className="hidden lg:block w-1 h-1 rounded-full bg-slate-200" />
                                 <span className="text-slate-900">@ ${item.price.toLocaleString()}</span>
                              </div>
                           </div>
                           
                           <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 p-1">
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 rounded-lg text-slate-400 hover:text-blue-600"
                                    onClick={() => updateQuantity(item.productId, item.warehouseId, item.units - 1)}
                                 >
                                    <Minus className="h-3 w-3" />
                                 </Button>
                                 <span className="text-[10px] font-black w-4 text-center">{item.units}</span>
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 rounded-lg text-slate-400 hover:text-blue-600"
                                    onClick={() => updateQuantity(item.productId, item.warehouseId, item.units + 1)}
                                 >
                                    <Plus className="h-3 w-3" />
                                 </Button>
                              </div>
                              <p className="text-lg lg:text-xl font-black text-slate-900 tracking-tighter">${(item.price * item.units).toLocaleString()}</p>
                           </div>
                         </div>
                       ))
                     )}
                  </div>

                  <div className="p-6 lg:p-10 border-t border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/20">
                     <button 
                       onClick={() => clearCart()}
                       className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-red-600 transition-colors"
                     >
                        Purge Queue
                     </button>
                     <div className="hidden lg:flex items-center gap-3">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Protocol Verified</span>
                     </div>
                  </div>
               </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
