import { handlers, signIn, signOut, auth } from "@/auth";
import { NextResponse } from "next/server";

export const GET = handlers.GET;
export const POST = handlers.POST;

export { auth, signIn, signOut };
