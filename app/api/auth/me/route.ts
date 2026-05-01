import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getCurrentSession } from "@/lib/session";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const localSession = await getCurrentSession();

  if (localSession) {
    return NextResponse.json({
      user: {
        id: localSession.id,
        role: localSession.role,
        name: localSession.name,
        identifier: localSession.identifier,
        email: localSession.identifier,
        provider: "local",
      },
    });
  }

  const googleSession = await getServerSession(authOptions);

  if (googleSession?.user?.email) {
    return NextResponse.json({
      user: {
        id: googleSession.user.email,
        role: "customer",
        name: googleSession.user.name || googleSession.user.email,
        identifier: googleSession.user.email.toLowerCase(),
        email: googleSession.user.email.toLowerCase(),
        provider: "google",
      },
    });
  }

  return NextResponse.json({ user: null }, { status: 401 });
}