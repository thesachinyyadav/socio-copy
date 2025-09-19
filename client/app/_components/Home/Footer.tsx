import Link from "next/link";
import Image from "next/image";
import Logo from "@/app/logo.svg";
import { useAuth } from "@/context/AuthContext";

export default function Footer() {
  const { session } = useAuth();

  return (
    <footer className="w-full border-t border-gray-200 py-8 sm:py-12 px-4 sm:px-6 md:px-16 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-8 sm:gap-12 md:gap-16">
          <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-16">
            <div className="md:w-1/3">
              <Link href={session ? "/Discover" : "/"}>
                <Image
                  src={Logo}
                  alt="Logo"
                  width={100}
                  height={100}
                  className="cursor-pointer"
                />
              </Link>
              <p className="text-[#1e1e1e86] text-sm mt-2 sm:text-base mb-4 sm:mb-6 font-medium leading-snug">
                Lorem ipsum dolor sit amet,
                <br /> consect adipiscing elit.
              </p>

              <div className="flex gap-3 sm:gap-4">
                <Link
                  href="https://www.instagram.com/the.socio.official?igsh=ZWRvN3B5cmliMTYy&utm_source=qr"
                  className="bg-[#F6F6F6] hover:bg-[#F0F0F0] ease-in-out transition-all p-2 sm:p-3 rounded-full"
                  aria-label="Instagram"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#00000075]"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </Link>
                <Link
                  href="http://www.youtube.com/@the.socio.official"
                  className="bg-[#F6F6F6] hover:bg-[#F0F0F0] ease-in-out transition-all p-2 sm:p-3 rounded-full"
                  aria-label="YouTube"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    className="text-[#00000075]"
                  >
                    <path
                      fill="currentColor"
                      d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"
                    />
                  </svg>
                </Link>
                <Link
                  href="https://www.linkedin.com/company/socio.official/"
                  className="bg-[#F6F6F6] p-2 sm:p-3 hover:bg-[#F0F0F0] ease-in-out transition-all rounded-full"
                  aria-label="LinkedIn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    className="text-[#00000075]"
                  >
                    <path
                      fill="currentColor"
                      d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"
                    />
                  </svg>
                </Link>
                <Link
                  href="https://x.com/thesociofficial"
                  className="bg-[#F6F6F6] p-2 sm:p-3 hover:bg-[#F0F0F0] ease-in-out transition-all rounded-full"
                  aria-label="Twitter"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    className="text-[#00000075]"
                  >
                    <path
                      fill="currentColor"
                      d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12 mt-4 md:mt-0">
              <div>
                <h3 className="font-medium text-base sm:text-lg mb-3 sm:mb-4">
                  Social
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li>
                    <Link
                      href="https://www.instagram.com/the.socio.official?igsh=ZWRvN3B5cmliMTYy&utm_source=qr"
                      className="text-[#1e1e1e86] hover:text-[#1e1e1ea1] text-sm sm:text-base"
                    >
                      Instagram
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="http://www.youtube.com/@the.socio.official"
                      className="text-[#1e1e1e86] hover:text-[#1e1e1ea1] text-sm sm:text-base"
                    >
                      YouTube
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://www.linkedin.com/company/socio.official/"
                      className="text-[#1e1e1e86] hover:text-[#1e1e1ea1] text-sm sm:text-base"
                    >
                      LinkedIn
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://x.com/thesociofficial"
                      className="text-[#1e1e1e86] hover:text-[#1e1e1ea1] text-sm sm:text-base"
                    >
                      X / Twitter
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-base sm:text-lg mb-3 sm:mb-4">
                  Support
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li>
                    <a
                      href="/about"
                      className="text-[#1e1e1e86] hover:text-[#1e1e1ea1] text-sm sm:text-base"
                    >
                      Contact us
                    </a>
                  </li>
                  <li>
                    <a
                      href="/about"
                      className="text-[#1e1e1e86] hover:text-[#1e1e1ea1] text-sm sm:text-base"
                    >
                      FAQs
                    </a>
                  </li>
                  <li>
                    <a
                      href="/about"
                      className="text-[#1e1e1e86] hover:text-[#1e1e1ea1] text-sm sm:text-base"
                    >
                      Feedback
                    </a>
                  </li>
                  <li>
                    <a
                      href="/about"
                      className="text-[#1e1e1e86] hover:text-[#1e1e1ea1] text-sm sm:text-base"
                    >
                      About us
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-base sm:text-lg mb-3 sm:mb-4">
                  Legal
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li>
                    <Link
                      href="#"
                      className="text-[#1e1e1e86] hover:text-[#1e1e1ea1] text-sm sm:text-base"
                    >
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-[#1e1e1e86] hover:text-[#1e1e1ea1] text-sm sm:text-base"
                    >
                      Privacy policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-[#1e1e1e86] hover:text-[#1e1e1ea1] text-sm sm:text-base"
                    >
                      Cookie policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-12 md:mt-16 text-center sm:text-right text-[#1e1e1e86] font-medium text-sm sm:text-base">
            <p>© 2025 SOCIO. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
