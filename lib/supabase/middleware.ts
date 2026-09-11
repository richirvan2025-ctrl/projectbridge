import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type AppRole = "student" | "partner" | "campus" | null;

// Path yang wajib login. Key = path prefix, value = role yang diizinkan
// (null = siapa saja yang login boleh akses, tanpa cek role).
const PROTECTED_PATHS: Record<string, AppRole> = {
  "/dashboard": "partner",
  "/student": "student",
  "/campus": "campus",
};

function getRequiredRole(pathname: string): {
  prefix: string;
  role: AppRole;
} | null {
  for (const prefix of Object.keys(PROTECTED_PATHS)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return { prefix, role: PROTECTED_PATHS[prefix] };
    }
  }
  return null;
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Jika env belum diisi (mis. lupa set di Vercel), lewati refresh sesi
  // agar middleware tidak crash (MIDDLEWARE_INVOCATION_FAILED).
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("placeholder")
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // PENTING: refresh sesi + validasi JWT.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route protection: redirect ke /login atau cross-role kalau perlu
  const required = getRequiredRole(request.nextUrl.pathname);
  if (required) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Silakan masuk terlebih dahulu.");
      return NextResponse.redirect(loginUrl);
    }

    // Kalau path ini butuh role tertentu, cek role user.
    if (required.role !== null) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single<{ role: AppRole }>();

      const userRole = (profile?.role ?? null) as AppRole;
      if (userRole !== required.role) {
        // Arahkan ke dashboard yang sesuai role user, atau ke /login
        // kalau profil tidak ditemukan (kemungkinan trigger gagal).
        const target =
          userRole === "partner"
            ? "/dashboard"
            : userRole === "student"
              ? "/student"
              : userRole === "campus"
                ? "/campus"
                : "/login";
        return NextResponse.redirect(new URL(target, request.url));
      }
    }
  }

  return supabaseResponse;
}
