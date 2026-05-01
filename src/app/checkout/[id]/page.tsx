'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { differenceInSeconds } from 'date-fns';

interface Reservation {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED';
  expiresAt: string;
  units: number;
  product: { name: string };
  warehouse: { name: string };
}

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchReservation();
  }, [id]);

  useEffect(() => {
    if (!reservation || reservation.status !== 'PENDING') return;

    const interval = setInterval(() => {
      const seconds = differenceInSeconds(new Date(reservation.expiresAt), new Date());
      setTimeLeft(Math.max(0, seconds));
      
      if (seconds <= 0) {
        clearInterval(interval);
        // Refresh to show expired state
        fetchReservation();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  const fetchReservation = async () => {
    try {
      const res = await fetch(`/api/reservations/${id}`);
      if (!res.ok) throw new Error('Failed to fetch reservation');
      const data = await res.json();
      setReservation(data);
      
      const seconds = differenceInSeconds(new Date(data.expiresAt), new Date());
      setTimeLeft(Math.max(0, seconds));
    } catch (error) {
      toast.error('Failed to load reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/reservations/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Idempotency-Key': crypto.randomUUID(),
        },
      });

      if (res.status === 410) {
        toast.error('Reservation has expired');
        fetchReservation();
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to confirm purchase');
      }

      toast.success('Purchase confirmed!');
      fetchReservation();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/reservations/${id}/release`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel reservation');
      }

      toast.success('Reservation cancelled');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading reservation...</div>;
  if (!reservation) return <div className="p-8 text-center">Reservation not found</div>;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft <= 0 && reservation.status === 'PENDING';

  return (
    <div className="container mx-auto py-8 px-4 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Checkout</CardTitle>
              <CardDescription>Complete your purchase</CardDescription>
            </div>
            <Badge variant={
              reservation.status === 'CONFIRMED' ? 'default' : 
              reservation.status === 'RELEASED' ? 'secondary' : 
              isExpired ? 'destructive' : 'outline'
            }>
              {isExpired ? 'EXPIRED' : reservation.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b pb-4">
            <p className="text-sm text-muted-foreground">Product</p>
            <p className="font-semibold">{reservation.product.name}</p>
          </div>
          <div className="border-b pb-4">
            <p className="text-sm text-muted-foreground">Warehouse</p>
            <p className="font-semibold">{reservation.warehouse.name}</p>
          </div>
          <div className="border-b pb-4">
            <p className="text-sm text-muted-foreground">Quantity</p>
            <p className="font-semibold">{reservation.units} unit(s)</p>
          </div>

          {reservation.status === 'PENDING' && !isExpired && (
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <p className="text-sm text-orange-800 font-medium">Time remaining to pay:</p>
              <p className="text-3xl font-bold text-orange-900 font-mono">{formatTime(timeLeft)}</p>
            </div>
          )}

          {isExpired && (
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-sm text-red-800 font-medium">Reservation expired</p>
              <p className="text-xs text-red-700">The units have been released back to stock.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {reservation.status === 'PENDING' && !isExpired ? (
            <>
              <Button className="w-full" size="lg" onClick={handleConfirm} disabled={processing}>
                {processing ? 'Processing...' : 'Confirm Purchase'}
              </Button>
              <Button className="w-full" variant="ghost" onClick={handleCancel} disabled={processing}>
                Cancel Reservation
              </Button>
            </>
          ) : (
            <Button className="w-full" variant="outline" onClick={() => router.push('/')}>
              Back to Products
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
