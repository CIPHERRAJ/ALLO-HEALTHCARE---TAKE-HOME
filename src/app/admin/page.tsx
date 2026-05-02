'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  Package, 
  Plus, 
  Warehouse as WarehouseIcon, 
  DollarSign, 
  List, 
  Settings, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  LayoutGrid,
  FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Warehouse {
  id: string;
  name: string;
}

interface Stock {
  warehouseId: string;
  warehouseName: string;
  totalUnits: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stocks: Stock[];
}

export default function AdminDashboard() {
  const [activeView, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockLevels, setStockLevels] = useState<{ [key: string]: string }>({});

  const router = useRouter();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [wRes, pRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/products')
      ]);
      
      const wData = await wRes.json();
      const pData = await pRes.json();
      
      setWarehouses(wData);
      setProducts(pData);
      
      const initialStock: { [key: string]: string } = {};
      wData.forEach((w: Warehouse) => {
        initialStock[w.id] = '0';
      });
      setStockLevels(initialStock);
    } catch (error) {
      toast.error('Inventory synchronization failure');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setEditingId(null);
    const initialStock: { [key: string]: string } = {};
    warehouses.forEach(w => initialStock[w.id] = '0');
    setStockLevels(initialStock);
  };

  const handleEditClick = (product: Product) => {
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setEditingId(product.id);
    
    const stocks: { [key: string]: string } = {};
    warehouses.forEach(w => {
      const existing = product.stocks.find(s => s.warehouseId === w.id);
      stocks[w.id] = existing ? existing.totalUnits.toString() : '0';
    });
    setStockLevels(stocks);
    setView('EDIT');
  };

  const handleStockChange = (warehouseId: string, value: string) => {
    setStockLevels(prev => ({ ...prev, [warehouseId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const stocks = Object.entries(stockLevels)
      .map(([warehouseId, totalUnits]) => ({
        warehouseId,
        totalUnits: parseInt(totalUnits) || 0,
      }));

    const url = activeView === 'EDIT' ? `/api/products/${editingId}` : '/api/products';
    const method = activeView === 'EDIT' ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          stocks,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Protocol execution failure');
      }

      toast.success(activeView === 'EDIT' ? 'Asset parameters updated' : 'New asset deployed');
      resetForm();
      setView('LIST');
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Authorize permanent removal of this asset from the global network?')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Decommissioning failed');
      
      toast.success('Asset removed from registry');
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
          <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
        </div>
        <p className="mt-6 text-slate-600 font-semibold tracking-tight animate-pulse">Initializing Admin Terminal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* Precision Admin Sidebar */}
      <aside className="w-72 bg-slate-900 text-white hidden lg:flex flex-col shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <Settings className="h-64 w-64 -mr-20 -mt-20 rotate-12" />
        </div>

        <div className="p-8 flex items-center gap-4 border-b border-white/5 relative z-10">
           <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 ring-4 ring-blue-600/10">
              <Zap className="h-6 w-6 text-white fill-white" />
           </div>
           <div>
              <span className="block font-black tracking-tight text-lg uppercase">Console</span>
              <span className="block text-[9px] text-blue-400 font-black tracking-[0.2em]">ADMIN PRIVILEGE</span>
           </div>
        </div>
        
        <nav className="flex-grow px-4 space-y-2 mt-10 relative z-10">
           <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Operations</p>
           
           <button 
             onClick={() => setView('LIST')}
             className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${
               activeView === 'LIST' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'
             }`}
           >
              <LayoutGrid className={`h-4 w-4 ${activeView === 'LIST' ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className="text-[11px] font-black uppercase tracking-widest">Global Catalog</span>
           </button>
           
           <button 
             onClick={() => { setView('CREATE'); resetForm(); }}
             className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${
               activeView === 'CREATE' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'
             }`}
           >
              <Plus className={`h-4 w-4 ${activeView === 'CREATE' ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className="text-[11px] font-black uppercase tracking-widest">Deploy Asset</span>
           </button>

           <div className="pt-8 mt-8 border-t border-white/5">
              <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Infrastructure</p>
              <div className="text-slate-600 px-5 py-4 rounded-2xl flex items-center gap-4 cursor-not-allowed group">
                 <WarehouseIcon className="h-4 w-4" />
                 <span className="text-[11px] font-black uppercase tracking-widest">Node Map</span>
                 <Badge className="ml-auto bg-slate-800 text-[8px] border-none text-slate-500 px-1.5">LOCKED</Badge>
              </div>
              <div className="text-slate-600 px-5 py-4 rounded-2xl flex items-center gap-4 cursor-not-allowed group">
                 <ShieldCheck className="h-4 w-4" />
                 <span className="text-[11px] font-black uppercase tracking-widest">Security</span>
              </div>
           </div>
        </nav>

        <div className="p-8 border-t border-white/5 relative z-10">
           <Button variant="ghost" onClick={() => router.push('/')} className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-3">
              <ArrowLeft className="h-4 w-4" /> Exit Console
           </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-8 lg:p-16 overflow-y-auto bg-slate-50/30">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600 text-white border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md">
                     System Operator
                  </Badge>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Inventory Management Node</span>
               </div>
               <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                {activeView === 'LIST' ? 'Global Catalog.' : 
                 activeView === 'CREATE' ? 'Deploy Asset.' : 
                 'Refine Parameters.'}
              </h1>
              <p className="text-lg text-slate-500 font-medium max-w-xl">
                {activeView === 'LIST' ? 'Operational overview of all logistics assets across the global network.' : 
                 'Provisioning new units requires full specification validation.'}
              </p>
            </div>
          </div>

          {activeView === 'LIST' ? (
            /* Redesigned Product List */
            <div className="grid grid-cols-1 gap-6">
               {products.length === 0 ? (
                 <div className="py-40 text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 border border-slate-100/50">
                       <Package className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Registry Empty</h3>
                    <p className="text-slate-400 mb-10 max-w-sm font-medium">No assets detected in the global ledger. Initialize deployment to proceed.</p>
                    <Button onClick={() => setView('CREATE')} className="h-14 bg-slate-900 hover:bg-blue-600 rounded-2xl px-10 font-bold transition-all shadow-xl shadow-slate-200">
                       Initialize Deployment
                    </Button>
                 </div>
               ) : (
                 products.map((product) => (
                   <Card key={product.id} className="group border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.06)] transition-all duration-300 bg-white rounded-[32px] overflow-hidden">
                      <div className="flex flex-col md:flex-row items-center p-6 lg:p-8 gap-10">
                         <div className="h-20 w-20 bg-slate-50 rounded-[24px] flex items-center justify-center shrink-0 border border-slate-100/50 group-hover:scale-105 transition-transform duration-500">
                            <Package className="h-10 w-10 text-slate-300 group-hover:text-blue-600 transition-colors" />
                         </div>
                         
                         <div className="flex-grow space-y-4">
                            <div className="flex flex-wrap items-center gap-4">
                               <h3 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h3>
                               <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50/50 font-black text-[10px] uppercase tracking-widest px-3 py-1">
                                  ${product.price.toLocaleString()} / Unit
                               </Badge>
                               <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest ml-auto">ID: {product.id.slice(-8).toUpperCase()}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3">
                               {product.stocks.map(s => (
                                 <div key={s.warehouseId} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50 group/s hover:bg-white hover:border-blue-100 transition-colors">
                                    <WarehouseIcon className="h-3 w-3 text-slate-400 group-hover/s:text-blue-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/s:text-slate-900">{s.warehouseName}:</span>
                                    <span className="text-[11px] font-black text-blue-600">{s.totalUnits}</span>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="flex items-center gap-3 shrink-0">
                            <Button 
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditClick(product)}
                              className="h-12 w-12 rounded-2xl border-slate-100 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
                            >
                               <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(product.id)}
                              className="h-12 w-12 rounded-2xl border-slate-100 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                            >
                               <Trash2 className="h-4 w-4" />
                            </Button>
                         </div>
                      </div>
                   </Card>
                 ))
               )}
            </div>
          ) : (
            /* Minimalist Deployment Form */
            <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                 {/* Asset Specifications */}
                 <div className="lg:col-span-7 space-y-10">
                    <div className="space-y-8">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 px-1 border-l-2 border-blue-600 pl-4">Asset Specifications</h3>
                       
                       <div className="space-y-6 bg-white p-10 rounded-[40px] shadow-2xl shadow-blue-900/5 border border-slate-100/50">
                         <div className="space-y-2.5">
                           <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Universal Asset Name</Label>
                           <Input 
                             id="name" 
                             value={name} 
                             onChange={(e) => setName(e.target.value)} 
                             placeholder="e.g. HIGH-DENSITY GPU ARRAY"
                             className="rounded-2xl h-14 bg-slate-50 border-slate-100 focus:bg-white transition-all text-base font-medium px-5"
                             required
                           />
                         </div>
                         
                         <div className="space-y-2.5">
                           <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Market Valuation ($)</Label>
                           <div className="relative">
                             <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                             <Input 
                               id="price" 
                               type="number"
                               step="0.01"
                               value={price} 
                               onChange={(e) => setPrice(e.target.value)} 
                               placeholder="0.00"
                               className="rounded-2xl h-14 pl-12 bg-slate-50 border-slate-100 focus:bg-white transition-all text-base font-medium"
                               required
                             />
                           </div>
                         </div>

                         <div className="space-y-2.5">
                           <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Technical Documentation</Label>
                           <textarea 
                             id="description"
                             value={description}
                             onChange={(e) => setDescription(e.target.value)}
                             className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-5 h-44 text-base font-medium focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all resize-none"
                             placeholder="Provide detailed hardware specifications and regional compliance details..."
                           />
                         </div>
                       </div>
                    </div>
                 </div>

                 {/* Network Distribution */}
                 <div className="lg:col-span-5 space-y-10">
                    <div className="space-y-8">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 px-1 border-l-2 border-blue-600 pl-4">Network Distribution</h3>
                       
                       <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-blue-900/5 border border-slate-100/50 space-y-8">
                         <div className="flex items-center gap-4">
                           <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                              <WarehouseIcon className="h-6 w-6" />
                           </div>
                           <div>
                              <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Node Allocation</h4>
                              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Multi-Region Sync</p>
                           </div>
                         </div>
                         
                         <div className="space-y-5">
                           {warehouses.map((w) => (
                             <div key={w.id} className="flex items-center justify-between p-5 rounded-[24px] bg-slate-50/50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group/node">
                               <div className="space-y-1">
                                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">{w.name.split(' (')[1]?.replace(')', '') || 'GLOBAL'}</span>
                                  <span className="text-sm font-bold text-slate-900">{w.name.split(' (')[0]}</span>
                               </div>
                               <div className="w-20">
                                 <Input 
                                   type="number"
                                   min="0"
                                   value={stockLevels[w.id]}
                                   onChange={(e) => handleStockChange(w.id, e.target.value)}
                                   className="h-12 rounded-xl text-center font-black bg-white border-slate-200 group-hover/node:border-blue-400 focus:ring-4 focus:ring-blue-600/5 transition-all"
                                 />
                               </div>
                             </div>
                           ))}
                         </div>
                         <div className="pt-4 flex items-start gap-3">
                            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                               Propagation to global nodes is synchronous. Changes will be reflected across the entire logistics network immediately upon commitment.
                            </p>
                         </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Secure Commitment Bar */}
              <div className="sticky bottom-8 z-50 flex items-center justify-between p-8 bg-slate-900/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/5 mt-16 animate-in slide-in-from-bottom-10 duration-1000 delay-300">
                 <Button type="button" variant="ghost" onClick={() => setView('LIST')} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl px-8 font-black text-[10px] uppercase tracking-widest gap-3 transition-all">
                    <X className="h-4 w-4" /> Cancel Protocol
                 </Button>
                 <Button 
                   type="submit" 
                   disabled={submitting}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-12 h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
                 >
                   {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                   {activeView === 'EDIT' ? 'Commit Updates' : 'Authorize Deployment'}
                 </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
