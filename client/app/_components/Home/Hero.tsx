"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import gsap from "gsap";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { TypeAnimation } from "react-type-animation";

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [startTyping, setStartTyping] = useState(false);

  const handleSignInWithGoogle = async () => {
    const supabase = createClientComponentClient();
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (error) {
      console.error("Google authentication error:", error);
    }
  };

  const handleExploreClick = () => {
    if (!session && !isLoading) {
      handleSignInWithGoogle();
    } else if (session && !isLoading) {
      router.push("/Discover");
    }
  };

  useEffect(() => {
    const text = heroRef.current?.querySelectorAll("h1, p");
    const buttons = heroRef.current?.querySelectorAll("button");
    const imageDiv = heroRef.current?.querySelector(".image-container");

    if (text && text.length > 0) {
      gsap.from(text, {
        opacity: 0,
        x: -50,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        onComplete: () => {
          setStartTyping(true);
        },
      });
    }

    if (buttons && buttons.length > 0) {
      buttons.forEach((button) => {
        button.addEventListener("mouseenter", () => {
          gsap.to(button, { scale: 1.05, duration: 0.3, ease: "power2.out" });
        });
        button.addEventListener("mouseleave", () => {
          gsap.to(button, { scale: 1, duration: 0.3, ease: "power2.out" });
        });
      });
    }

    if (imageDiv) {
      gsap.from(imageDiv, {
        opacity: 0,
        scale: 0.8,
        duration: 1,
        delay: 0.5,
        ease: "elastic.out(1, 0.5)",
      });
    }
  }, []);

  const buttonsDisabled = isLoading;

  return (
    <div
      ref={heroRef}
      className="flex flex-col sm:flex-row justify-between items-center w-full px-4 sm:px-8 md:px-16 lg:px-36 py-12 sm:py-16 md:py-24"
    >
      <div className="w-full sm:w-1/2 mb-8 sm:mb-0">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#154CB3] leading-tight">
            Discover Christ University events and&nbsp;
            {startTyping ? (
              <TypeAnimation
                sequence={[
                  "connect.",
                  2000,
                  "",
                  500,
                  "participate.",
                  2000,
                  "",
                  500,
                  "excel.",
                  2000,
                  "",
                  500,
                ]}
                wrapper="span"
                speed={50}
                repeat={Infinity}
                style={{
                  display: "inline-block",
                  minWidth: "150px",
                  color: "#063168",
                }}
              />
            ) : (
              <span
                style={{ display: "inline-block", minWidth: "150px" }}
              ></span>
            )}
          </h1>
          <p className="mt-4 text-[#1e1e1eb6] text-base sm:text-lg font-medium">
            Your one-stop platform for Discovering, registering, and managing all Christ University events, festivals, and activities across all campuses.
          </p>
        </div>
        <div className="flex mt-4 sm:mt-6 gap-2 sm:gap-3 items-center select-none flex-row">
          <button
            onClick={handleSignInWithGoogle}
            disabled={buttonsDisabled}
            className="cursor-pointer font-semibold px-4 py-1.5 sm:px-4 sm:py-2 border-2 border-[#154CB3] hover:border-[#154cb3df] hover:bg-[#154cb3df] transition-all duration-200 ease-in-out text-xs sm:text-sm rounded-full text-white bg-[#154CB3] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Get started
          </button>
          <button
            onClick={handleExploreClick}
            disabled={buttonsDisabled}
            className="cursor-pointer font-semibold px-4 py-1.5 sm:px-4 sm:py-2 border-2 border-[#FFCC00] text-xs sm:text-sm rounded-full text-[#1e1e1e] bg-[#ffcc0034] hover:bg-[#ffcc003f] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Explore
          </button>
        </div>
      </div>
      <div className="w-full sm:w-1/2 flex justify-center sm:justify-end">
        <div className="image-container w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full overflow-hidden shadow-lg">
          <img 
            src="https://lh3.googleusercontent.com/p/AF1QipOtPhb_vPnrWFY8uYLWf790zXAzDjN1B1EceLhS=s1360-w1360-h1020-rw"
            alt="Christ University Campus"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
