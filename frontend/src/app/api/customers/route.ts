import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }

    const response = await api.get(`/bc-customers?${params.toString()}`);

    return NextResponse.json({
      success: true,
      data: response.data.data,
      count: response.data.count,
    });

  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.response?.data?.message || error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

