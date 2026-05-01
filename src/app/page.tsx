'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { Package, Warehouse, LogOut, Loader2, ChevronRight, ShoppingCart } from "lucide-react";

interface Stock {
  warehouseId: string;
  warehouseName: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  stocks: Stock[];
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Syncing live inventory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navigation Bar */}
      <nav className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-slate-900 tracking-tight">Allo Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right mr-2">
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
            <h1 className="text-3xl font-bold text-slate-900">Global Inventory</h1>
            <p className="text-slate-500 mt-1">Manage and reserve stock across all active warehouses.</p>
          </div>
          <div className="flex gap-2">
             <Badge variant="secondary" className="px-3 py-1 bg-white border shadow-sm text-slate-600 font-medium">
                {products.length} Products Active
             </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow bg-white">
              <div className="flex flex-col md:flex-row h-full">
                <div className="md:w-1/3 bg-slate-100 flex items-center justify-center p-8 border-r">
                   <Package className="h-16 w-16 text-slate-300" />
                </div>
                <div className="md:w-2/3 flex flex-col p-6">
                  <div className="mb-6">
                    <CardTitle className="text-xl font-bold text-slate-900 mb-2">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                  </div>
                  
                  <div className="space-y-4 flex-grow">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Warehouse Availability</p>
                    {product.stocks.map((stock) => (
                      <div key={stock.warehouseId} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                            <Warehouse className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{stock.warehouseName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`w-2 h-2 rounded-full ${stock.availableUnits > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <p className="text-xs text-slate-500 font-medium">
                                {stock.availableUnits} units available
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={stock.availableUnits > 0 ? "default" : "secondary"}
                          className={stock.availableUnits > 0 ? "bg-blue-600 hover:bg-blue-700 shadow-sm" : "cursor-not-allowed opacity-50"}
                          disabled={stock.availableUnits <= 0 || !!reservingId}
                          onClick={() => handleReserve(product.id, stock.warehouseId)}
                        >
                          {reservingId === `${product.id}-${stock.warehouseId}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : stock.availableUnits <= 0 ? (
                            'Out of Stock'
                          ) : (
                            <>
                              Reserve <ChevronRight className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
