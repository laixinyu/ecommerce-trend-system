import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // 已知的API错误
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Supabase错误
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any;
    return NextResponse.json(
      {
        error: supabaseError.message || '数据库错误',
        code: supabaseError.code,
      },
      { status: 500 }
    );
  }

  // 未知错误
  return NextResponse.json(
    {
      error: process.env.NODE_ENV === 'production'
        ? '服务器错误'
        : error instanceof Error
        ? error.message
        : '未知错误',
    },
    { status: 500 }
  );
}

// API响应包装器
export async function apiHandler<T>(
  handler: () => Promise<T>
): Promise<NextResponse> {
  try {
    const result = await handler();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
