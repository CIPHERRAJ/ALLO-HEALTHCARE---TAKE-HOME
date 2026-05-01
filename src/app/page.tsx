'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from "next-auth/react";

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
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (productId: string, warehouseId: string) => {
    if (!session) {
      toast.error('Please login to reserve items');
      signIn('google');
      return;
    }

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          productId,
          warehouseId,
          units: 1,
        }),
      });

      if (res.status === 409) {
        toast.error('Not enough stock available');
        return;
      }

      if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        signIn('google');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reserve');
      }

      const reservation = await res.json();
      toast.success('Units reserved! Proceeding to checkout.');
      router.push(`/checkout/${reservation.id}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading products...</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Products</h1>
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Hi, {session.user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>Logout</Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => signIn('google')}>Login with Google</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <h3 className="font-semibold mb-2">Availability:</h3>
              <div className="space-y-3">
                {product.stocks.map((stock) => (
                  <div key={stock.warehouseId} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{stock.warehouseName}</p>
                      <p className="text-xs text-muted-foreground">
                        {stock.availableUnits} available / {stock.totalUnits} total
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={stock.availableUnits <= 0}
                      onClick={() => handleReserve(product.id, stock.warehouseId)}
                    >
                      {stock.availableUnits <= 0 ? 'Out of Stock' : 'Reserve'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
