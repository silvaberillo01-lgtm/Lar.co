import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl
  const publicPaths = ['/login', '/onboarding', '/update-password']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  // A verificação de sessão é uma chamada de rede ao Supabase. Se o projeto
  // estiver indisponível/pausado, ela pode travar e fazer o middleware estourar
  // o tempo limite da Vercel (504 MIDDLEWARE_INVOCATION_TIMEOUT) em TODAS as
  // rotas. Aplicamos um timeout e tratamos falha como "não autenticado" para
  // degradar de forma graciosa em vez de derrubar o site inteiro.
  let user = null
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('auth.getUser timeout')), 3000)
    )
    const result = await Promise.race([supabase.auth.getUser(), timeout])
    user = result.data.user
  } catch (err) {
    console.error('[middleware] falha ao verificar sessão:', err)
    // Em rota pública seguimos normalmente; em rota protegida mandamos pro login.
    if (!isPublic) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // Usuário não autenticado → login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Usuário autenticado na raiz → agora
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/agora', request.url))
  }

  // Usuário autenticado tentando acessar login → agora
  if (user && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/agora', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
}
