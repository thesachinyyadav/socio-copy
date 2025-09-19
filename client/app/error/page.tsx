"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

const ALLOWED_DOMAIN = "christuniversity.in";

export default function BeepPage() {
  const { signInWithGoogle, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorReason = searchParams.get("error");

  const handleLoginAgain = async () => {
    await signInWithGoogle();
  };

  const getErrorMessage = () => {
    if (errorReason === "invalid_domain") {
      return `It looks like you tried to sign in with an email address that isn't from Christ University.`;
    } else if (errorReason === "not_authorized") {
      return `You do not have the necessary permissions to access the management dashboard.`;
    }
    return "An authentication error occurred.";
  };

  const getAdditionalInfo = () => {
    if (errorReason === "invalid_domain") {
      return (
        <>
          <p className="text-gray-600 mb-6 text-md">
            Access to this platform is exclusively for students and faculty with
            a valid <strong className="text-[#154CB3]">{ALLOWED_DOMAIN}</strong>{" "}
            email address.
          </p>
          <p className="text-gray-600 mb-8 text-sm">
            Please ensure you are using your official university email.
          </p>
        </>
      );
    } else if (errorReason === "not_authorized") {
      return (
        <>
          <p className="text-gray-600 mb-6 text-md">
            Only users with organiser privileges can access the management
            dashboard.
          </p>
          <p className="text-gray-600 mb-8 text-sm">
            If you believe this is an error, please contact the platform
            administrator.
          </p>
        </>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 pt-12">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center border-2 border-gray-200">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-8 w-8 text-[#DC2626]"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 0 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-[#154CB3] mb-3">
          Access Denied
        </h1>
        <p className="text-gray-700 mb-2 text-md">{getErrorMessage()}</p>
        {getAdditionalInfo()}

        {errorReason === "invalid_domain" && (
          <button
            onClick={handleLoginAgain}
            disabled={isLoading}
            className="w-full cursor-pointer font-semibold px-6 py-3 border-2 border-[#154CB3] hover:border-[#154cb3df] hover:bg-[#154cb3df] transition-all duration-200 ease-in-out text-md rounded-full text-white bg-[#154CB3] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Try Again with Google"}
          </button>
        )}
        <a href={"/Discover"}>
          <button className="mt-4 w-full cursor-pointer font-semibold px-6 py-3 border-2 border-transparent hover:bg-[#f3f3f3] transition-all duration-200 ease-in-out text-md rounded-full text-[#154CB3]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="inline h-5 w-5 mr-2 align-text-bottom"
            >
              <g clipPath="url(#a)">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.25-7.25a.75.75 0 0 0 0-1.5H8.66l2.1-1.95a.75.75 0 1 0-1.02-1.1l-3.5 3.25a.75.75 0 0 0 0 1.1l3.5 3.25a.75.75 0 0 0 1.02-1.1l-2.1-1.95h4.59Z"
                  clipRule="evenodd"
                />
              </g>
              <defs>
                <clipPath id="a">
                  <path d="M0 0h20v20H0z" />
                </clipPath>
              </defs>
            </svg>
            Go to Homepage
          </button>
        </a>
      </div>
    </div>
  );
}
