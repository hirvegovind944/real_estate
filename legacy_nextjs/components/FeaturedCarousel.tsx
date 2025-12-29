import Image from "next/image";
import { Heart, Maximize2, ArrowRight } from "lucide-react";
import Link from "next/link";

const PROPERTIES = [
    {
        id: 1,
        title: "Luxury Sea View Apartment",
        location: "Bandra West, Mumbai",
        price: "₹4.5 Cr",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600&auto=format&fit=crop",
        specs: "3 BHK • 1850 sqft",
        status: "Ready to Move",
        isFeatured: true,
    },
    {
        id: 2,
        title: "Modern Villa with Pool",
        location: "Whitefield, Bangalore",
        price: "₹3.2 Cr",
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=600&auto=format&fit=crop",
        specs: "4 BHK • 3200 sqft",
        status: "Under Construction",
        isFeatured: true,
    },
    {
        id: 3,
        title: "Premium Gated Community",
        location: "Gurgaon Sec 42",
        price: "₹1.8 Cr",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
        specs: "2 BHK • 1200 sqft",
        status: "Ready to Move",
        isFeatured: false,
    },
    // Add more placeholders as needed
];

export default function FeaturedCarousel() {
    return (
        <section className="bg-white py-16">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-[#2C3E50]">Featured Properties</h2>
                        <p className="mt-2 text-gray-600">Handpicked projects for you</p>
                    </div>
                    <Link href="/search" className="hidden text-[#FF6B35] hover:underline md:flex items-center gap-1">
                        View All <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {PROPERTIES.map((property) => (
                        <div key={property.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl border border-gray-100">
                            {/* Image & Badges */}
                            <div className="relative h-64 w-full overflow-hidden">
                                <Image
                                    src={property.image}
                                    alt={property.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2C3E50] backdrop-blur-sm">
                                    {property.status}
                                </div>
                                <button className="absolute right-4 top-4 rounded-full p-2 text-white/80 hover:bg-white hover:text-red-500 transition-all backdrop-blur-sm bg-black/20">
                                    <Heart className="h-5 w-5" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                    <span className="text-xl font-bold text-white max-w-[80%] block truncate">{property.price}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="truncate text-lg font-semibold text-[#2C3E50]">{property.title}</h3>
                                <p className="mt-1 flex items-center text-sm text-gray-500">
                                    <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {property.location}
                                </p>

                                <div className="mt-4 flex items-center justify-between border-t pt-4">
                                    <span className="text-sm font-medium text-gray-700">{property.specs}</span>
                                    <button className="rounded-lg border border-[#FF6B35] px-4 py-2 text-sm font-medium text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white transition-colors">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-center md:hidden">
                    <Link href="/search" className="flex items-center gap-2 rounded-full border px-6 py-2 text-sm font-medium text-[#FF6B35] hover:bg-gray-50">
                        View All Properties <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
