"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ALLOWED_DOMAIN = "christuniversity.in";

function CatchTheDotGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);

  const width = 340;
  const height = 200;
  const radius = 12;

  const stateRef = useRef({
    x: Math.random() * (width - 2 * radius) + radius,
    y: Math.random() * (height - 2 * radius) + radius,
    vx: 1.6,
    vy: 1.2,
  });

  const reset = useCallback(() => {
    setScore(0);
    setTimeLeft(20);
    stateRef.current = {
      x: Math.random() * (width - 2 * radius) + radius,
      y: Math.random() * (height - 2 * radius) + radius,
      vx: 1.6,
      vy: 1.2,
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    let raf = 0;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      // Update physics
      const s = stateRef.current;
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < radius || s.x > width - radius) s.vx *= -1;
      if (s.y < radius || s.y > height - radius) s.vy *= -1;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Background
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, "#eef3ff");
      g.addColorStop(1, "#ffffff");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // Dot
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#154CB3";
      ctx.shadowColor = "rgba(21, 76, 179, 0.35)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = "#111827";
      ctx.font = "bold 12px ui-sans-serif, system-ui";
      ctx.fillText(`Score: ${score}`, 10, 18);
      ctx.fillText(`Time: ${timeLeft}s`, width - 70, 18);

      if (running && timeLeft > 0) {
        raf = requestAnimationFrame(draw);
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [running, score, timeLeft]);

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      return;
    }
    const t = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(t);
  }, [running, timeLeft]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!running) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const { x, y } = stateRef.current;
    const dist = Math.hypot(cx - x, cy - y);
    if (dist <= radius + 3) {
      // Hit! Increase score and speed, teleport dot
      setScore((s) => s + 1);
      const speedBoost = 0.1;
      stateRef.current.vx += (stateRef.current.vx > 0 ? speedBoost : -speedBoost);
      stateRef.current.vy += (stateRef.current.vy > 0 ? speedBoost : -speedBoost);
      stateRef.current.x = Math.random() * (width - 2 * radius) + radius;
      stateRef.current.y = Math.random() * (height - 2 * radius) + radius;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-3 text-left">
        <p className="text-sm text-gray-600">
          Quick game: click the moving dot to score before the time runs out.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white/60 shadow-inner p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-700">
            Score: <span className="font-semibold">{score}</span> · Time:{" "}
            <span className="font-semibold">{timeLeft}s</span>
          </div>
          <div className="flex items-center gap-2">
            {!running ? (
              <button
                onClick={() => {
                  reset();
                  setRunning(true);
                }}
                className="px-3 py-1.5 rounded-full text-white bg-[#154CB3] hover:bg-[#154cb3df] text-sm border border-[#154CB3] transition"
              >
                {timeLeft <= 0 ? "Play Again" : "Start"}
              </button>
            ) : (
              <button
                onClick={() => setRunning(false)}
                className="px-3 py-1.5 rounded-full text-[#154CB3] bg-white hover:bg-[#f6f8ff] text-sm border border-[#154CB3] transition"
              >
                Pause
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onClick={onClick}
            className="mx-auto block rounded-lg border border-gray-200 bg-white"
          />
          {!running && timeLeft <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg bg-white/90 px-4 py-3 border border-gray-200 shadow-sm text-center">
                <p className="text-sm text-gray-700">
                  Time's up! Final score: <span className="font-semibold">{score}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BeepPage() {
  const { signInWithGoogle, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorReason = searchParams.get("error");

  const handleLoginAgain = async () => {
    await signInWithGoogle();
  };

  const heading = useMemo(() => {
    if (errorReason === "invalid_domain") return "Access Limited to University Emails";
    if (errorReason === "not_authorized") return "Access Denied";
    return "Something Went Wrong";
  }, [errorReason]);

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
          <p className="text-gray-600 mb-3 text-sm">
            It’s not you — it’s us. Sorry about the mix-up!
          </p>
          <p className="text-gray-600 mb-6 text-md">
            Access to this platform is exclusively for students and faculty with
            a valid <strong className="text-[#154CB3]">{ALLOWED_DOMAIN}</strong>{" "}
            email address.
          </p>
          <p className="text-gray-600 mb-6 text-sm">
            Please ensure you are using your official university email.
          </p>
        </>
      );
    } else if (errorReason === "not_authorized") {
      return (
        <>
          <p className="text-gray-600 mb-3 text-sm">
            It’s not you — it’s us. Sorry about the inconvenience.
          </p>
          <p className="text-gray-600 mb-6 text-md">
            Only users with organiser privileges can access the management
            dashboard.
          </p>
          <p className="text-gray-600 mb-6 text-sm">
            If you believe this is an error, please contact the platform
            administrator.
          </p>
        </>
      );
    }
    return (
      <>
        <p className="text-gray-600 mb-3 text-sm">
          It’s not you — it’s us. Sorry for the error.
        </p>
        <p className="text-gray-600 mb-6 text-sm">
          A temporary issue prevented us from completing your request. You can try again or enjoy a quick mini‑game while we sort this out.
        </p>
      </>
    );
  };

  const showTryAgain =
    errorReason === "invalid_domain" ||
    (!errorReason || errorReason === "fetch_error" || errorReason === "network");

  const [showGame, setShowGame] = useState(
    !errorReason || errorReason === "fetch_error" || errorReason === "network"
  );

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-gradient-to-b from-[#eef3ff] to-white">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-12 -left-12 h-64 w-64 rounded-full bg-[#c5d6ff] opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -right-16 h-64 w-64 rounded-full bg-[#ffd2d2] opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-48 w-48 rounded-full bg-[#d9ffe2] opacity-40 blur-3xl" />

      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl bg-white/80 backdrop-blur-md p-8 text-center border border-gray-200 shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEE2E2] ring-1 ring-red-200">
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

          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F2E7A] mb-2">
            {heading}
          </h1>

          <p className="text-gray-700 mb-2 text-md">{getErrorMessage()}</p>
          {getAdditionalInfo()}

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            {showTryAgain && (
              <button
                onClick={handleLoginAgain}
                disabled={isLoading}
                className="flex-1 cursor-pointer font-semibold px-6 py-3 border-2 border-[#154CB3] hover:border-[#154cb3df] hover:bg-[#154cb3df] transition-all duration-200 ease-in-out text-md rounded-full text-white bg-[#154CB3] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Try Again"}
              </button>
            )}

            <a href={"/Discover"} className="flex-1">
              <button className="w-full cursor-pointer font-semibold px-6 py-3 border-2 border-transparent hover:bg-[#f3f3f3] transition-all duration-200 ease-in-out text-md rounded-full text-[#154CB3]">
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

          {/* Fun section */}
          <div className="mt-8 text-left">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#0F2E7A]">Need a breather?</h2>
              <button
                onClick={() => setShowGame((s) => !s)}
                className="text-sm rounded-full px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                {showGame ? "Hide mini‑game" : "Play a mini‑game"}
              </button>
            </div>
            {showGame && <CatchTheDotGame />}
            {!showGame && (
              <p className="text-sm text-gray-500">
                It’s not your problem — it’s ours. We’re on it. In the meantime, feel free to explore the homepage.
              </p>
            )}
          </div>
        </div>

        {/* Footer reassurance */}
        <p className="mt-6 text-xs text-gray-500 text-center">
          We log errors automatically to help prevent this from happening again. Thanks for your patience!
        </p>
      </div>
    </div>
  );
}