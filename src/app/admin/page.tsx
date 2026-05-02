'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Package, Plus, Warehouse as WarehouseIcon, DollarSign, List, LayoutDashboard, Settings, Edit, Trash2, Save, X, ChevronRight } from 'lucide-react';
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
  
  // Form State (Shared for Create/Edit)
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
      
      // Initialize stock levels map
      const initialStock: { [key: string]: string } = {};
      wData.forEach((w: Warehouse) => {
        initialStock[w.id] = '0';
      });
      setStockLevels(initialStock);
    } catch (error) {
      toast.error('Data synchronization failed');
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
        throw new Error(data.error || 'Operation failed');
      }

      toast.success(activeView === 'EDIT' ? 'Product updated' : 'Product created');
      resetForm();
      setView('LIST');
      fetchInitialData(); // Refresh list
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This will also remove all stock records.')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      
      toast.success('Product removed from network');
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Package className="h-5 w-5 text-white" />
           </div>
           <div>
              <span className="block font-bold tracking-tight text-sm uppercase">Admin Console</span>
              <span className="block text-[9px] text-slate-400 font-black tracking-widest">LOGISTICS OS v2.4</span>
           </div>
        </div>
        
        <nav className="flex-grow px-4 space-y-2 mt-8">
           <button 
             onClick={() => setView('LIST')}
             className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
               activeView === 'LIST' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
             }`}
           >
              <List className="h-4 w-4" />
              <span className="text-sm font-bold">Product Catalog</span>
           </button>
           
           <button 
             onClick={() => { setView('CREATE'); resetForm(); }}
             className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
               activeView === 'CREATE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
             }`}
           >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-bold">Deploy New Asset</span>
           </button>

           <div className="pt-4 mt-4 border-t border-white/5">
              <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Infrastructure</p>
              <div className="text-slate-400 p-3 rounded-xl flex items-center gap-3 cursor-not-allowed opacity-50">
                 <WarehouseIcon className="h-4 w-4" />
                 <span className="text-sm font-bold">Node Management</span>
              </div>
              <div className="text-slate-400 p-3 rounded-xl flex items-center gap-3 cursor-not-allowed opacity-50">
                 <Settings className="h-4 w-4" />
                 <span className="text-sm font-bold">System Config</span>
              </div>
           </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeView === 'LIST' ? 'Global Catalog' : 
                 activeView === 'CREATE' ? 'Deploy New Asset' : 
                 'Edit Inventory Asset'}
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                {activeView === 'LIST' ? 'Manage and optimize current logistics assets.' : 
                 'Fill in specifications to propagate new units to the network.'}
              </p>
            </div>
            <Button variant="ghost" onClick={() => router.push('/')} className="rounded-xl font-bold text-slate-400 hover:text-blue-600 gap-2">
               <X className="h-4 w-4" /> Exit Terminal
            </Button>
          </div>

          {activeView === 'LIST' ? (
            /* Product List View */
            <div className="grid grid-cols-1 gap-4">
               {products.length === 0 ? (
                 <Card className="p-20 text-center border-dashed border-2 bg-transparent rounded-3xl">
                    <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No assets detected</h3>
                    <p className="text-slate-500 mb-6 font-medium">Start by deploying your first product.</p>
                    <Button onClick={() => setView('CREATE')} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8">
                       Initialize Deployment
                    </Button>
                 </Card>
               ) : (
                 products.map((product) => (
                   <Card key={product.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all bg-white rounded-2xl">
                      <div className="flex flex-col md:flex-row items-center p-5 gap-6">
                         <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                            <Package className="h-8 w-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                         </div>
                         
                         <div className="flex-grow text-center md:text-left">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                               <h3 className="text-lg font-black text-slate-900 leading-none">{product.name}</h3>
                               <span className="text-blue-600 font-bold text-sm bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                  ${product.price.toLocaleString()}
                               </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-tight">
                               {product.stocks.map(s => (
                                 <div key={s.warehouseId} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                    <WarehouseIcon className="h-3 w-3" />
                                    {s.warehouseName}: <span className="text-slate-700">{s.totalUnits}</span>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="flex items-center gap-2 shrink-0">
                            <Button 
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditClick(product)}
                              className="rounded-xl border-slate-200 hover:text-blue-600 hover:bg-blue-50"
                            >
                               <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(product.id)}
                              className="rounded-xl border-slate-200 hover:text-red-600 hover:bg-red-50"
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
            /* Create/Edit Form View */
            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Left Column: Specs */}
                 <div className="space-y-8">
                    <Card className="border-none shadow-sm rounded-3xl bg-white p-8">
                       <div className="space-y-6">
                         <div className="space-y-2">
                           <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400">Product Name</Label>
                           <Input 
                             id="name" 
                             value={name} 
                             onChange={(e) => setName(e.target.value)} 
                             placeholder="e.g. Enterprise Server Rack"
                             className="rounded-xl h-12 border-slate-200 focus:ring-blue-500"
                             required
                           />
                         </div>
                         
                         <div className="space-y-2">
                           <Label htmlFor="price" className="text-xs font-black uppercase tracking-widest text-slate-400">Unit Price ($)</Label>
                           <div className="relative">
                             <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                             <Input 
                               id="price" 
                               type="number"
                               step="0.01"
                               value={price} 
                               onChange={(e) => setPrice(e.target.value)} 
                               placeholder="0.00"
                               className="rounded-xl h-12 pl-10 border-slate-200 focus:ring-blue-500"
                               required
                             />
                           </div>
                         </div>

                         <div className="space-y-2">
                           <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-slate-400">Technical Description</Label>
                           <textarea 
                             id="description"
                             value={description}
                             onChange={(e) => setDescription(e.target.value)}
                             className="w-full rounded-xl border border-slate-200 p-4 h-32 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                             placeholder="Detailed specifications..."
                           />
                         </div>
                       </div>
                    </Card>
                 </div>

                 {/* Right Column: Inventory */}
                 <div className="space-y-8">
                    <Card className="border-none shadow-sm rounded-3xl bg-white p-8">
                       <div className="flex items-center gap-3 mb-8">
                         <div className="p-2.5 bg-blue-50 rounded-xl">
                            <WarehouseIcon className="h-5 w-5 text-blue-600" />
                         </div>
                         <h3 className="text-lg font-black text-slate-900 tracking-tight">Stock Allocation</h3>
                       </div>
                       
                       <div className="space-y-4">
                         {warehouses.map((w) => (
                           <div key={w.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all">
                             <span className="text-sm font-bold text-slate-700">{w.name}</span>
                             <div className="w-24">
                               <Input 
                                 type="number"
                                 min="0"
                                 value={stockLevels[w.id]}
                                 onChange={(e) => handleStockChange(w.id, e.target.value)}
                                 className="h-10 rounded-xl text-center font-black border-slate-200"
                               />
                             </div>
                           </div>
                         ))}
                       </div>
                       <p className="mt-6 text-[10px] font-bold text-slate-400 leading-relaxed italic">
                          * Updates to stock levels will be propagated to the network immediately.
                       </p>
                    </Card>
                 </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                 <Button type="button" variant="ghost" onClick={() => setView('LIST')} className="rounded-xl font-bold text-slate-500">
                    Cancel and Return
                 </Button>
                 <Button 
                   type="submit" 
                   disabled={submitting}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200"
                 >
                   {submitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
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
