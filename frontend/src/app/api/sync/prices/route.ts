import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAccessToken, resolveCompanyId, resolveCompanyName, iterateItemPrices } from '@/lib/business-central-server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting BC → MySQL sync (item prices from itemSalesPrices)…');

    const token = await getAccessToken();
    console.log('Access token acquired.');

    const companyId = await resolveCompanyId(token);
    const companyName = await resolveCompanyName(token);
    console.log('Using companyId:', companyId, 'companyName:', companyName);

    const prices = [];
    for await (const price of iterateItemPrices(token, companyId, companyName)) {
      prices.push(price);
    }

    console.log(`Fetched ${prices.length} prices from BC itemSalesPrices`);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const BATCH_SIZE = 100;
    let totalCount = 0;
    const allLogs: string[] = [];

    for (let i = 0; i < prices.length; i += BATCH_SIZE) {
      const batch = prices.slice(i, i + BATCH_SIZE);
      console.log(`Syncing batch ${i / BATCH_SIZE + 1} with ${batch.length} prices...`);
      try {
        const response = await axios.post(
          `${apiUrl}/api/bc-item-prices/sync`,
          { prices: batch },
          {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`,
            },
          }
        );

        if (response.data.success) {
          totalCount += response.data.count;
          allLogs.push(...(response.data.logs || []));
        }
      } catch (error: any) {
        console.error(`Error syncing batch ${i / BATCH_SIZE + 1}:`, error);
        allLogs.push(`Error in batch ${i / BATCH_SIZE + 1}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalCount,
      logs: allLogs,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

