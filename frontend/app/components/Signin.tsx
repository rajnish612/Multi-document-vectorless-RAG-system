"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GoogleSignIn() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/main");
    }
  }, [isSignedIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Multi-RAG Agent</h1>

        <p className="text-gray-500 mt-2 mb-6">Sign in to continue</p>

        <SignInButton>
          <button className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition">
            Continue with Google
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
