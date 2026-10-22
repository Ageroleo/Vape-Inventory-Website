import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS } from '@/data/inventory';
import { VapeProduct } from '@/types/vape';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseUrl.includes('your-supabase-url')
);

const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  : null;

// Server-side in-memory cache
let serverMemoryCache: VapeProduct[] = INITIAL_PRODUCTS;

/**
 * GET /api/inventory
 * Fetches live inventory from Supabase via the server (bypassing browser CORS/adblockers)
 */
export async function GET() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('vape_inventory')
        .select('data')
        .eq('id', 'current')
        .maybeSingle();

      const isValidCatalog =
        !error &&
        data &&
        Array.isArray(data.data) &&
        data.data.length > 0 &&
        data.data.every((p: unknown) => {
          const item = p as VapeProduct;
          return item && item.id && Array.isArray(item.flavors);
        });

      if (isValidCatalog) {
        serverMemoryCache = data.data as VapeProduct[];
        return NextResponse.json({
          success: true,
          source: 'supabase',
          data: serverMemoryCache,
        });
      }

      // If table is empty or contains invalid/corrupted data, auto-seed with INITIAL_PRODUCTS
      console.log('[API /api/inventory] Seeding Supabase with INITIAL_PRODUCTS...');
      await supabase.from('vape_inventory').upsert({
        id: 'current',
        data: INITIAL_PRODUCTS,
        updated_at: new Date().toISOString(),
      });
      serverMemoryCache = INITIAL_PRODUCTS;
      return NextResponse.json({
        success: true,
        source: 'supabase_seeded',
        data: serverMemoryCache,
      });
    } catch (err) {
      console.warn('[API /api/inventory GET] Supabase read error:', err);
    }
  }

  // Fallback to server memory cache
  return NextResponse.json({
    success: true,
    source: 'server_memory',
    data: serverMemoryCache,
  });
}

/**
 * POST /api/inventory
 * Updates live inventory in Supabase from the server side
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const products = body?.products;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid products array' },
        { status: 400 }
      );
    }

    serverMemoryCache = products;

    if (supabase) {
      const { error } = await supabase.from('vape_inventory').upsert({
        id: 'current',
        data: products,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('[API /api/inventory POST] Supabase save error:', error.message);
        return NextResponse.json({
          success: false,
          error: error.message,
          data: serverMemoryCache,
        });
      }
    }

    return NextResponse.json({
      success: true,
      source: supabase ? 'supabase' : 'server_memory',
      data: serverMemoryCache,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error('[API /api/inventory POST] Exception:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
