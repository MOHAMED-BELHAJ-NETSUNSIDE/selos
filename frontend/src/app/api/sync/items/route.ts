import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAccessToken, resolveCompanyId, resolveCompanyName, iterateItems, getItemPrices } from '@/lib/business-central-server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    console.log('Starting BC → MySQL sync (items)…');

    // 1) Obtenir le token Business Central
    const token = await getAccessToken();
    console.log('Access token acquired.');

    // 2) Résoudre l'ID de l'entreprise
    const companyId = await resolveCompanyId(token);
    console.log('Using companyId:', companyId);

    // 3) Récupérer tous les items depuis BC
    const items = [];
    for await (const item of iterateItems(token, companyId)) {
      items.push(item);
    }

    console.log(`Fetched ${items.length} items from BC`);

    // 4) Synchroniser avec le backend par lots pour éviter "request entity too large"
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const BATCH_SIZE = 100; // Envoyer par lots de 100 items (réduit pour éviter 413)
    let totalCount = 0;
    const allLogs: string[] = [];

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      console.log(`Sending batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)} (${batch.length} items)`);
      
      try {
        const response = await axios.post(
          `${apiUrl}/bc-items/sync`,
          { items: batch },
          {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        totalCount += response.data.count || 0;
        if (response.data.logs && Array.isArray(response.data.logs)) {
          allLogs.push(...response.data.logs);
        }
      } catch (error: any) {
        console.error(`Error syncing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        allLogs.push(`Error syncing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error?.message || 'Unknown error'}`);
      }
    }

    allLogs.push(`✓ Items sync completed: ${totalCount} items synchronized`);

    // 5) Synchroniser automatiquement les prix après la synchronisation des articles
    // Récupérer les prix produit par produit (comme dans salesv3) pour garantir tous les types de vente
    console.log('Starting automatic prices sync after items sync...');
    allLogs.push('--- Starting prices synchronization (product by product) ---');
    
    let totalPriceCount = 0; // Déclarer avant le try pour être accessible après
    
    try {
      const companyName = await resolveCompanyName(token);
      console.log(`Fetching prices from BC itemSalesPrices for ${items.length} items (product by product)...`);
      allLogs.push(`Fetching prices for ${items.length} items...`);

      // Récupérer les prix produit par produit
      const allPrices: any[] = [];
      const salesTypesFound = new Set<string>();
      const pricesBySalesType = new Map<string, number>();
      const itemsWithMultiplePrices: Array<{ itemNo: string; count: number }> = [];
      
      // Traiter les items par lots pour éviter de surcharger l'API
      const ITEM_BATCH_SIZE = 10; // Traiter 10 items à la fois
      for (let i = 0; i < items.length; i += ITEM_BATCH_SIZE) {
        const itemBatch = items.slice(i, i + ITEM_BATCH_SIZE);
        console.log(`Processing items ${i + 1}-${Math.min(i + ITEM_BATCH_SIZE, items.length)}/${items.length}...`);
        
        // Récupérer les prix pour chaque item du lot en parallèle
        const pricePromises = itemBatch.map(async (item) => {
          const itemNumber = item.number || item.Number || item.itemNumber;
          if (!itemNumber) {
            console.warn(`Item without number:`, item);
            return [];
          }
          
          try {
            const prices = await getItemPrices(token, companyName, itemNumber);
            
            if (prices.length > 0) {
              // Analyser les types de vente
              prices.forEach(p => {
                const salesType = p.Sales_Type || 'null';
                salesTypesFound.add(salesType);
                pricesBySalesType.set(salesType, (pricesBySalesType.get(salesType) || 0) + 1);
              });
              
              if (prices.length > 1) {
                itemsWithMultiplePrices.push({ itemNo: itemNumber, count: prices.length });
              }
              
              console.log(`[${itemNumber}] Found ${prices.length} prices:`, prices.map((p: any) => `${p.Sales_Type || 'null'}`).join(', '));
            }
            
            return prices;
          } catch (error: any) {
            console.error(`Error fetching prices for item ${itemNumber}:`, error);
            return [];
          }
        });
        
        const batchPrices = await Promise.all(pricePromises);
        allPrices.push(...batchPrices.flat());
        
        // Petite pause entre les lots pour éviter de surcharger l'API
        if (i + ITEM_BATCH_SIZE < items.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Fetched ${allPrices.length} prices from BC itemSalesPrices (product by product)`);
      allLogs.push(`Fetched ${allPrices.length} prices from BC`);
      
      console.log(`[Sync Prices] Sales_Types found:`, Array.from(salesTypesFound));
      console.log(`[Sync Prices] Prices by Sales_Type:`, Array.from(pricesBySalesType.entries()));
      allLogs.push(`Sales_Types found: ${Array.from(salesTypesFound).join(', ')}`);
      allLogs.push(`Prices by type: ${Array.from(pricesBySalesType.entries()).map(([type, count]) => `${type}: ${count}`).join(', ')}`);
      
      if (itemsWithMultiplePrices.length > 0) {
        console.log(`[Sync Prices] Found ${itemsWithMultiplePrices.length} items with multiple prices from BC:`, itemsWithMultiplePrices.slice(0, 10));
        allLogs.push(`Found ${itemsWithMultiplePrices.length} items with multiple prices from BC`);
      } else {
        console.log(`[Sync Prices] Warning: No items found with multiple prices from BC.`);
        allLogs.push(`⚠ Warning: No items found with multiple prices from BC`);
      }
      
      // Vérifier si on a tous les types de vente attendus
      const expectedTypes = ['Customer', 'Customer Price Group', 'All Customers', 'Campaign'];
      const missingTypes = expectedTypes.filter(type => !salesTypesFound.has(type));
      if (missingTypes.length > 0 && salesTypesFound.size > 0) {
        console.log(`[Sync Prices] ⚠ Missing Sales_Types: ${missingTypes.join(', ')}`);
        allLogs.push(`⚠ Missing Sales_Types: ${missingTypes.join(', ')}`);
      }

      // Synchroniser les prix par lots
      const PRICE_BATCH_SIZE = 100;
      const priceLogs: string[] = [];

      for (let i = 0; i < allPrices.length; i += PRICE_BATCH_SIZE) {
        const batch = allPrices.slice(i, i + PRICE_BATCH_SIZE);
        console.log(`Syncing price batch ${Math.floor(i / PRICE_BATCH_SIZE) + 1}/${Math.ceil(allPrices.length / PRICE_BATCH_SIZE)} with ${batch.length} prices...`);
        
        try {
          const response = await axios.post(
            `${apiUrl}/bc-item-prices/sync`,
            { prices: batch },
            {
              headers: {
                Authorization: `Bearer ${session.user.accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.data.success) {
            totalPriceCount += response.data.count || 0;
            if (response.data.logs && Array.isArray(response.data.logs)) {
              priceLogs.push(...response.data.logs);
            }
          }
        } catch (error: any) {
          console.error(`Error syncing price batch ${Math.floor(i / PRICE_BATCH_SIZE) + 1}:`, error);
          const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
          priceLogs.push(`Error in price batch ${Math.floor(i / PRICE_BATCH_SIZE) + 1}: ${errorMessage}`);
          // Log plus de détails pour déboguer
          if (error?.response?.status === 404) {
            console.error(`Endpoint not found: ${apiUrl}/bc-item-prices/sync`);
            priceLogs.push(`  → Check if the endpoint /bc-item-prices/sync exists in the backend`);
          }
        }
      }

      allLogs.push(`✓ Prices sync completed: ${totalPriceCount} prices synchronized`);
      allLogs.push(...priceLogs);
      
    } catch (priceError: any) {
      console.error('Error during automatic prices sync:', priceError);
      allLogs.push(`⚠ Error during prices sync: ${priceError?.message || 'Unknown error'}`);
      // Ne pas faire échouer la synchronisation des articles si la synchronisation des prix échoue
    }

    return NextResponse.json({
      success: true,
      count: totalCount,
      priceCount: totalPriceCount || 0,
      logs: allLogs,
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.response?.data?.message || error?.message || 'Unknown error',
      },
      { status: error?.response?.status || 500 }
    );
  }
}

