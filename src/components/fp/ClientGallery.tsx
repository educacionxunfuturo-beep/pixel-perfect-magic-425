import { Pill, SectionTitle } from "./primitives";
import { Camera, Instagram, Heart } from "lucide-react";
import pugsImg from "@/assets/gallery/gallery-pugs-bath.jpg";
import poodleImg from "@/assets/gallery/gallery-poodle-van.jpg";
import shihtzuImg from "@/assets/gallery/gallery-shihtzu.jpg";
import bulldogImg from "@/assets/gallery/gallery-bulldog.jpg";
import pomImg from "@/assets/gallery/gallery-pomeranian.jpg";
import dachshundImg from "@/assets/gallery/gallery-dachshund.jpg";
import vanExtImg from "@/assets/gallery/gallery-van-exterior.jpg";

interface GalleryPhoto {
  src: string;
  dog: string;
  breed: string;
  area: string;
  service: string;
}

const PHOTOS: GalleryPhoto[] = [
  {
    src: pugsImg,
    dog: "Otis & Milo",
    breed: "Double Pug Hydrobath",
    area: "Midtown Toronto",
    service: "Organic Oatmeal Soak",
  },
  {
    src: poodleImg,
    dog: "Shadow",
    breed: "Standard Poodle",
    area: "Rosedale",
    service: "Van Cab Ride & Styling",
  },
  {
    src: pomImg,
    dog: "Milo",
    breed: "Pomeranian",
    area: "The Annex",
    service: "Teddy Bear Blowout",
  },
  {
    src: shihtzuImg,
    dog: "Coco",
    breed: "Shih Tzu",
    area: "Yorkville",
    service: "Scissor Face Tidy",
  },
  {
    src: bulldogImg,
    dog: "Rocky",
    breed: "English Bulldog",
    area: "King West",
    service: "Hydrobath & Facial",
  },
  {
    src: dachshundImg,
    dog: "Frankie",
    breed: "Mini Dachshund",
    area: "Leaside",
    service: "Bath & Paw Polish",
  },
];

import { useLiveGroomCounter } from "@/lib/useLiveGroomCounter";

export function ClientGallery() {
  const { count } = useLiveGroomCounter(648);
  return (
    <section className="border-t border-border bg-card/60 py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <SectionTitle
              eyebrow="The Fresh Pooch Club"
              title="Smiles Across Toronto"
              sub="100% real client transformations taken right in front of our mobile spa."
            />
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="gold"><Heart className="h-3 w-3 fill-current" /> <strong className="tabular-nums">{count}</strong> Happy Dogs</Pill>
            <a
              href="https://instagram.com/thefreshpooch"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-card px-4 py-2 text-xs font-bold text-teal hover:bg-teal hover:text-white transition-colors"
            >
              <Instagram className="h-3.5 w-3.5" /> @thefreshpooch
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PHOTOS.map((p, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <img
                  src={p.src}
                  alt={`${p.dog} - ${p.breed} in Toronto`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="font-serif text-sm font-semibold">{p.dog}</div>
                  <div className="text-[11px] text-white/80">{p.breed}</div>
                  <div className="mt-1 text-[10px] text-gold font-medium">{p.area}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
