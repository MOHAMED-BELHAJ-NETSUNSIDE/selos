import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAccessToken, resolveCompanyId, iterateCustomers } from '@/lib/business-central-server';
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

    console.log('Starting BC → MySQL sync (customers)…');

    // 1) Obtenir le token Business Central
    const token = await getAccessToken();
    console.log('Access token acquired.');

    // 2) Résoudre l'ID de l'entreprise
    const companyId = await resolveCompanyId(token);
    console.log('Using companyId:', companyId);

    // 3) Récupérer tous les clients depuis BC
    const customers = [];
    for await (const customer of iterateCustomers(token, companyId)) {
      customers.push(customer);
    }

    console.log(`Fetched ${customers.length} customers from BC`);

    // 4) Synchroniser avec le backend par lots pour éviter "request entity too large"
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const BATCH_SIZE = 100; // Envoyer par lots de 100 customers (réduit pour éviter 413)
    let totalCount = 0;
    const allLogs: string[] = [];

    for (let i = 0; i < customers.length; i += BATCH_SIZE) {
      const batch = customers.slice(i, i + BATCH_SIZE);
      console.log(`Sending batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(customers.length / BATCH_SIZE)} (${batch.length} customers)`);
      
      try {
        const response = await axios.post(
          `${apiUrl}/bc-customers/sync`,
          { customers: batch },
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

    return NextResponse.json({
      success: true,
      count: totalCount,
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

