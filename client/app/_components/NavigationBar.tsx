"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/app/logo.svg";
import { useAuth } from "@/context/AuthContext";
import { NotificationSystem } from "./NotificationSystem";

export default function NavigationBar() {
  const { session, userData, isLoading, signInWithGoogle, signOut } = useAuth();

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <>
        <nav className="w-full flex justify-between items-center pt-8 pb-7 px-12 text-[#154CB3] select-none">
          <div className="h-10 w-24"></div>
          <div className="h-10 w-24"></div>
        </nav>
        <hr className="border-[#3030304b]" />
      </>
    );
  }

  return (
    <>
      <nav className="w-full flex justify-between items-center pt-8 pb-7 px-6 md:px-12 text-[#154CB3] select-none">
        <Link href={session ? "/discover" : "/"}>
          <Image
            src={Logo}
            alt="Logo"
            width={100}
            height={100}
            className="cursor-pointer"
          />
        </Link>

        <div className="flex gap-2 items-center">
          {session && userData ? (
            userData.is_organiser ? (
              <div className="flex gap-4 items-center">
                <NotificationSystem />
                <Link href="/manage">
                  <button className="cursor-pointer font-semibold px-4 py-2 border-2 rounded-full text-sm hover:bg-[#f3f3f3] transition-all duration-200 ease-in-out">
                    Manage events
                  </button>
                </Link>
                {userData.course && (
                  <Link href="/profile">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative">
                        {userData?.avatar_url ? (
                          <Image
                            src={userData.avatar_url}
                            alt="Profile"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white text-sm">
                            {userData?.name
                              ? userData.name.charAt(0).toUpperCase()
                              : "U"}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )}
                {!userData.course && (
                  <button
                    onClick={handleSignOut}
                    className="cursor-pointer font-semibold px-4 py-2 border-2 border-[#d6392b] hover:border-[#d6392b] hover:bg-[#d6392bdd] transition-all duration-200 ease-in-out text-sm rounded-full text-white bg-[#d6392b]"
                  >
                    Log out
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-4 items-center">
                <NotificationSystem />
                <Link href="/profile">
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {userData?.name || "User"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative">
                    {userData?.avatar_url ? (
                      <Image
                        src={userData.avatar_url}
                        alt="Profile"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white text-sm">
                        {userData?.name
                          ? userData.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
              </div>
            )
          ) : (
            <>
              <button
                onClick={handleSignIn}
                className="cursor-pointer font-semibold px-4 py-2 border-2 rounded-full text-sm hover:bg-[#f3f3f3] transition-all duration-200 ease-in-out"
              >
                Log in
              </button>
              <button
                onClick={handleSignIn}
                className="cursor-pointer font-semibold px-4 py-2 border-2 border-[#154CB3] hover:border-[#154cb3df] hover:bg-[#154cb3df] transition-all duration-200 ease-in-out text-sm rounded-full text-white bg-[#154CB3]"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>
      <hr className="border-[#3030304b]" />
    </>
  );
}
