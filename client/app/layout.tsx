import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import NavigationBar from "./_components/NavigationBar";

import {
  EventsProvider,
  EventForCard,
  CarouselDisplayImage,
  FetchedEvent,
} from "../context/EventContext";

export const metadata: Metadata = {
  title: "SOCIO",
};

const deriveTags = (event: FetchedEvent): string[] => {
  const tags: string[] = [];
  if (event.category) {
    tags.push(event.category);
  }
  if (event.claims_applicable) {
    tags.push("Claims");
  }
  if (event.registration_fee === 0 || event.registration_fee === null) {
    tags.push("Free");
  } else if (event.registration_fee > 0) {
    tags.push("Paid");
  }
  return tags.filter((tag) => tag && tag.trim() !== "");
};

const getRandomEvents = (
  events: FetchedEvent[],
  count: number
): FetchedEvent[] => {
  if (!events || events.length === 0) return [];
  const shuffled = [...events].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, events.length));
};

const transformToEventCardData = (event: FetchedEvent): EventForCard => {
  return {
    id: event.id,
    event_id: event.event_id,
    title: event.title,
    fest: event.fest,
    date: event.event_date,
    time: event.event_time,
    location: event.venue || "Location TBD",
    tags: deriveTags(event),
    image:
      event.event_image_url ||
      "https://via.placeholder.com/400x250.png?text=Event+Image",
    organizing_dept: event.organizing_dept || "TBD",
  };
};

const transformToCarouselImage = (
  event: FetchedEvent
): CarouselDisplayImage => {
  return {
    id: event.id,
    src:
      event.banner_url ||
      event.event_image_url ||
      "https://via.placeholder.com/1200x400.png?text=Event+Banner",
    link: `/event/${event.event_id}`,
    title: event.title,
    department: event.organizing_dept || "",
  };
};

async function getInitialEventsData() {
  let allEvents: FetchedEvent[] = [];
  let carouselEvents: CarouselDisplayImage[] = [];
  let trendingEvents: EventForCard[] = [];
  let upcomingEvents: EventForCard[] = [];
  let isLoading = true;
  let error: string | null = null;

  try {
    const response = await fetch("http://localhost:8000/api/events", {
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMsg = `Network response was not ok: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.detail || errorMsg;
      } catch (jsonError) {}
      throw new Error(errorMsg);
    }

    const data = await response.json();

    if (data.events && Array.isArray(data.events)) {
      allEvents = data.events as FetchedEvent[];

      if (allEvents.length > 0) {
        const randomEventsForCarousel = getRandomEvents(allEvents, 3);
        carouselEvents = randomEventsForCarousel.map(transformToCarouselImage);

        const sortedEvents = [...allEvents].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latestEventsForSections = sortedEvents.slice(0, 3);

        trendingEvents = latestEventsForSections.map((event) => {
          const baseCardData = transformToEventCardData(event);
          const uniqueTags = Array.from(
            new Set(["Trending", ...baseCardData.tags])
          );
          return { ...baseCardData, tags: uniqueTags };
        });

        upcomingEvents = latestEventsForSections.map(transformToEventCardData);
      } else {
        console.log("No events found from API.");
      }
    } else {
      throw new Error("Fetched event data is not in the expected format.");
    }
  } catch (err: any) {
    console.error("Error fetching initial events in RootLayout:", err);
    error =
      err.message || "Failed to load initial events. Please try again later.";
    allEvents = [];
    carouselEvents = [];
    trendingEvents = [];
    upcomingEvents = [];
  } finally {
    isLoading = false;
  }

  return {
    allEvents,
    carouselEvents,
    trendingEvents,
    upcomingEvents,
    isLoading,
    error,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {
    allEvents,
    carouselEvents,
    trendingEvents,
    upcomingEvents,
    isLoading,
    error,
  } = await getInitialEventsData();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet" />
      </head>
      <body
        className="font-sans antialiased bg-[#FFFFFF] text-[#101010] font-[DM_Sans] overflow-x-hidden"
      >
        <AuthProvider>
          <EventsProvider
            initialAllEvents={allEvents}
            initialCarouselEvents={carouselEvents}
            initialTrendingEvents={trendingEvents}
            initialUpcomingEvents={upcomingEvents}
            initialIsLoading={isLoading}
            initialError={error}
          >
            <div className="relative w-full overflow-hidden">
              <NavigationBar />
              {children}
            </div>
          </EventsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
