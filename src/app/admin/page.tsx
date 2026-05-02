'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Package, Plus, Warehouse as WarehouseIcon, DollarSign, List, LayoutDashboard, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Warehouse {
  id: string;
  name: string;
}

export default function AdminDashboard() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockLevels, setStockLevels] = useState<{ [key: string]: string }>({});

  const router = useRouter();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      setWarehouses(data);
      
      // Initialize stock levels
      const initialStock: { [key: string]: string } = {};
      data.forEach((w: Warehouse) => {
        initialStock[w.id] = '0';
      });
      setStockLevels(initialStock);
    } catch (error) {
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (warehouseId: string, value: string) => {
    setStockLevels(prev => ({ ...prev, [warehouseId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const stocks = Object.entries(stockLevels)
      .filter(([_, units]) => parseInt(units) > 0)
      .map(([warehouseId, totalUnits]) => ({
        warehouseId,
        totalUnits: parseInt(totalUnits),
      }));

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
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
        throw new Error(data.error || 'Failed to create product');
      }

      toast.success('Product created successfully');
      setName('');
      setDescription('');
      setPrice('');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5" />
           </div>
           <span className="font-bold tracking-tight">Admin Console</span>
        </div>
        <nav className="flex-grow px-4 space-y-2 mt-4">
           <div className="bg-blue-600/10 text-blue-400 p-3 rounded-xl flex items-center gap-3">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-sm font-bold">Inventory Control</span>
           </div>
           <div className="hover:bg-white/5 text-slate-400 p-3 rounded-xl flex items-center gap-3 cursor-pointer">
              <List className="h-4 w-4" />
              <span className="text-sm font-bold">Product List</span>
           </div>
           <div className="hover:bg-white/5 text-slate-400 p-3 rounded-xl flex items-center gap-3 cursor-pointer">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-bold">Settings</span>
           </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create New Asset</h1>
              <p className="text-slate-500 font-medium mt-1">Deploy new inventory items across the global network.</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/')} className="rounded-xl font-bold">
               Back to Terminal
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
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
                        className="w-full rounded-xl border border-slate-200 p-4 h-32 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Detailed specifications..."
                      />
                    </div>
                  </div>
               </Card>

               <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg">
                       <WarehouseIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Stock Allocation</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {warehouses.map((w) => (
                      <div key={w.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-sm font-bold text-slate-700">{w.name}</span>
                        <div className="w-24">
                          <Input 
                            type="number"
                            min="0"
                            value={stockLevels[w.id]}
                            onChange={(e) => handleStockChange(w.id, e.target.value)}
                            className="h-10 rounded-xl text-center font-bold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
               </Card>
            </div>

            <div className="flex justify-end pt-4">
               <Button 
                type="submit" 
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200"
               >
                 {submitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
                 Authorize Deployment
               </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
