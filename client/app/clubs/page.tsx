"use client";

import React, { useState } from "react";
import Link from "next/link";

import { CentreClubCard } from "../_components/Discover/ClubCard";
import Footer from "../_components/Home/Footer";

interface Centre {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  link?: string;
  image?: string;
}

interface FilterOption {
  name: string;
  active: boolean;
}

const CentresPage = () => {
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([
    { name: "All", active: true },
    { name: "Research", active: false },
    { name: "Academic", active: false },
    { name: "Cultural", active: false },
    { name: "Student support", active: false },
    { name: "Innovation", active: false },
    { name: "Social", active: false },
    { name: "Leadership", active: false },
    { name: "Sports", active: false },
  ]);

  const allCentres: Centre[] = [
    {
      id: 1,
      title: "CNRI",
      subtitle: "Centre for Neurodiversity Research and Innovation",
      description:
        "Enhances understanding and support for neurodiverse individuals by fostering research and innovation, creating inclusive environments, and advancing societal awareness and acceptance.",
      link: "Centre for Neurodiversity Research and Innovation",
      image:
        "https://christuniversity.in/uploads/centers/thumb/472543836_2024-02-08_04-05-53.jpg",
    },
    {
      id: 2,
      title: "CAPS",
      subtitle: "Centre for Academic and Professional Support",
      description:
        "Provides academic and professional training, resources, and talks designed to support students' academic excellence and career development with workshops on various skills.",
      link: "Centre for Academic and Professional Support",
      image:
        "https://img.recraft.ai/DXVis5aciXPl_SpXpocvUcec6eLxmTogWC4mTJ-vDOY/rs:fit:2048:1024:0/q:95/g:no/plain/abs://prod/images/18ca971b-fabe-4b20-8fbf-9cdd1528e714@jpg",
    },
    {
      id: 3,
      title: "CAI",
      subtitle: "Centre for Artificial Intelligence",
      description:
        "Dedicated to advancing education, research, and innovation in artificial intelligence, focusing on practical applications of AI technologies in industries and academia.",
      link: "Centre for Artificial Intelligence",
      image:
        "https://img.recraft.ai/fZsh_b0fzcNaVdNLipdxoIPA-pj0NIm_SRLcnRapWRI/rs:fit:2048:1024:0/q:95/g:no/plain/abs://prod/images/76d78cf4-c7a2-479c-bd3d-d46d88cd63b3@jpg",
    },
    {
      id: 4,
      title: "CCD",
      subtitle: "Centre for Concept Design",
      description:
        "Emphasizes effective communication through media, content, and digital services, nurturing creativity and providing tools to conceptualize and design innovative digital media projects.",
      link: "Centre for Concept Design",
      image:
        "https://img.recraft.ai/zCoCzcmjv-7SID6sArhcETovDTS5jyo05awt9n8i0c8/rs:fit:2048:1024:0/q:95/g:no/plain/abs://prod/images/d59bffa0-a47d-4f61-a8e1-5464719b5913@jpg",
    },
    {
      id: 5,
      title: "CCHS",
      subtitle: "Centre for Counselling and Health Services",
      description:
        "Offers services to support mental and physical well-being of students including counseling sessions, mental health awareness programs, and professional health support.",
      link: "Centre for Counselling and Health Services",
      image:
        "https://img.recraft.ai/4PxhBChjdcjpDJSENE1SEt-5OVrHeTtUaTPlRgUKL0A/rs:fit:2048:1024:0/q:95/g:no/plain/abs://prod/images/bdd80302-62f6-478e-a598-dda7eaf5f46f@jpg",
    },
    {
      id: 6,
      title: "SDG Cell",
      subtitle: "Sustainable Development Goal Cell",
      description:
        "Committed to integrating UN Sustainable Development Goals into the university's framework through research, education, and community engagement initiatives.",
      link: "Sustainable Development Goal Cell",
      image:
        "https://img.recraft.ai/j8wS9gYWtLzTM61OIZ-hh8kHVDv3_hGRBQIvl8YVe1A/rs:fit:2048:1024:0/q:95/g:no/plain/abs://prod/images/f8478bc3-8c33-4344-b64a-27a521778253@jpg",
    },
  ];

  const activeFilter =
    filterOptions.find((filter) => filter.active)?.name || "All";

  const filteredCentres =
    activeFilter === "All"
      ? allCentres
      : allCentres.filter((centre) => {
          if (activeFilter === "Research") {
            return ["CNRI", "CAI", "CARD"].includes(centre.title);
          } else if (activeFilter === "Academic") {
            return ["CAPS", "CEDRIC", "TLEC"].includes(centre.title);
          } else if (activeFilter === "Cultural") {
            return ["CCD", "VWCN"].includes(centre.title);
          } else if (activeFilter === "Student support") {
            return ["CCHS", "CAPS"].includes(centre.title);
          } else if (activeFilter === "Innovation") {
            return ["CAI", "CCD", "SDG Cell"].includes(centre.title);
          }
          return false;
        });

  const handleFilterClick = (clickedFilter: string) => {
    setFilterOptions(
      filterOptions.map((filter) => ({
        ...filter,
        active: filter.name === clickedFilter,
      }))
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-12">
          <div className="flex flexrow items-center justify-between">
            <h1 className="text-3xl font-black text-[#154CB3] mb-2 mt-6">
              Explore centres and clubs
            </h1>
            <Link
              href="/Discover"
              className="flex items-center text-[#063168] hover:underline cursor-pointer text-xs sm:text-base"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back to Discovery
            </Link>
          </div>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">
            Browse through the various centres and cells that support academic
            and extracurricular activities.
          </p>

          <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
            {filterOptions.map((filter, index) => (
              <button
                key={index}
                onClick={() => handleFilterClick(filter.name)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer touch-manipulation ${
                  filter.active
                    ? "bg-[#154CB3] text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#063168] mb-4 sm:mb-6">
              {`${activeFilter === "All" ? "All" : activeFilter} (${
                filteredCentres.length
              })`}
            </h2>

            {filteredCentres.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                {filteredCentres.map((centre) => (
                  <CentreClubCard
                    key={centre.id}
                    title={centre.title}
                    subtitle={centre.subtitle}
                    description={centre.description}
                    link={centre.link}
                    image={centre.image}
                    type="center"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">
                  No centres found
                </h3>
                <p className="text-gray-500 text-sm sm:text-base">
                  Try adjusting your filters to find more centres.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CentresPage;
