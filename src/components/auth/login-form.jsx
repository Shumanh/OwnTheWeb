"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const buttonRef = useRef(null);

  const router = useRouter();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleCredential = useCallback(async function handleGoogleCredential(response) {
    setErrors({});
    setMessage("");
    setLoading(true);

    try {
      const loginResponse = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await loginResponse.json();

      if (data.error === false) {
        setMessage(data.message);
        setTimeout(() => {
          router.push("/blogs/view");
        }, 1000);
      } else {
        setErrors(data.message || { global: "Something went wrong" });
      }
    } catch (error) {
      setErrors({ global: ["Google login failed. Please try again."] });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!scriptReady || !googleClientId || !buttonRef.current || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
    });

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      text: "signin_with",
      shape: "rectangular",
      width: 352,
    });
  }, [scriptReady, googleClientId, handleGoogleCredential]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black px-4">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
      <div className="w-full max-w-md bg-neutral-900 rounded-xl shadow-lg border border-gray-800 p-6">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center text-gray-400 transition-colors duration-200 hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-white">Sign in to Writza</h1>
        <p className="text-sm text-gray-400 mb-6">Only theshumanhere@gmail.com can access the writing tools.</p>

        <div className="space-y-4" aria-busy={loading}>
          {errors.global && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
              {Array.isArray(errors.global) ? errors.global[0] : errors.global}
            </div>
          )}

          {!googleClientId ? (
            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-100">
              Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID.
            </div>
          ) : (
            <div className={loading ? "pointer-events-none opacity-60" : ""}>
              <div ref={buttonRef} className="min-h-11" />
            </div>
          )}

          {loading && <p className="text-sm text-gray-400">Signing in...</p>}
          {message && <div className="rounded-md bg-green-600 p-3 text-center text-sm text-white">{message}</div>}

          <div className="text-center text-sm text-gray-400">
            Access is restricted to one Google account.
          </div>
        </div>
      </div>
    </div>
  );
}
