import { OAuth2Client } from "google-auth-library";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

import { generateToken } from "@/lib/auth/jwt";
import { dbConnect } from "@/lib/db/mongodb";
import User from "@/models/User";

const ALLOWED_EMAIL = "theshumanhere@gmail.com";

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
}

export async function POST(req) {
  try {
    const googleClientId = getGoogleClientId();
    if (!googleClientId) {
      return NextResponse.json(
        {
          error: true,
          message: { global: ["Google login is not configured."] },
        },
        { status: 500 },
      );
    }

    const { credential } = await req.json();
    if (!credential) {
      return NextResponse.json(
        {
          error: true,
          message: { global: ["Google credential is missing."] },
        },
        { status: 400 },
      );
    }

    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
    const allowedEmail = (process.env.GOOGLE_ALLOWED_EMAIL || ALLOWED_EMAIL).toLowerCase();

    if (!payload?.email_verified || email !== allowedEmail) {
      return NextResponse.json(
        {
          error: true,
          message: { global: ["This Google account is not allowed to sign in."] },
        },
        { status: 403 },
      );
    }

    await dbConnect();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username: email.split("@")[0],
        email,
        password: `GoogleOnly#${crypto.randomUUID()}A1`,
        role: "admin",
      });
    } else if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const token = generateToken(user);
    (await cookies()).set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 604800,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json(
      {
        error: false,
        message: "Signed in with Google.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Google login error:", error);
    return NextResponse.json(
      {
        error: true,
        message: { global: ["Google login failed. Please try again."] },
      },
      { status: 500 },
    );
  }
}
