import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function middleware(req: NextRequest) {
  // 创建响应对象
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // 添加 CORS 头
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理 preflight 请求
  if (req.method === 'OPTIONS') {
    return res;
  }

  const path = req.nextUrl.pathname;

  // 跳过 API 路由和静态资源的认证检查
  if (path.startsWith('/api') || path.startsWith('/_next')) {
    return res;
  }

  // 开发模式：绕过所有认证检查
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    console.log('🔓 开发模式已启用，跳过认证检查');
    return res;
  }

  try {
    // 检查环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase 环境变量未配置');
      return res;
    }

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
            res = NextResponse.next({
              request: req,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 定义需要认证的路径
    const protectedPaths = ['/dashboard', '/products', '/search', '/compare', '/reports', '/profile'];

    // 定义认证相关路径
    const authPaths = ['/login', '/register'];

    // 如果用户已登录且访问认证页面，重定向到仪表板
    if (session && authPaths.some((authPath) => path.startsWith(authPath))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 如果用户未登录且访问受保护页面，重定向到登录页
    if (!session && protectedPaths.some((protectedPath) => path.startsWith(protectedPath))) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
