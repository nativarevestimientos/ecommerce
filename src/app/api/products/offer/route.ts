import { NextResponse } from 'next/server';
import { getRandomOfferPopupProduct } from '@/lib/special-offers.server';

export const dynamic = 'force-dynamic';

const noStoreHeaders = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  try {
    const offer = await getRandomOfferPopupProduct();
    return NextResponse.json(offer, { headers: noStoreHeaders });
  } catch (error) {
    console.error('Error fetching popup offer:', error);
    return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500, headers: noStoreHeaders });
  }
}
