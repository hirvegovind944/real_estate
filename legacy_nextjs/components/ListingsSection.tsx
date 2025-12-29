import { Filter, Grid, List, Heart, MessageCircle, Phone, CheckSquare } from "lucide-react";
import NextImage from "next/image";

// Mock data generator
const generateProperties = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: i + 10,
        title: `Premium Apartment ${i + 1}`,
        location: "Andheri West, Mumbai",
        price: `₹${(1.5 + i * 0.2).toFixed(2)} Cr`,
        area: `${1000 + i * 50} sqft`,
        bhk: `${2 + (i % 3)} BHK`,
        image: `https://images.unsplash.com/photo-${[
            "1600596542815-2a4b9ee3974c",
            "1600585154340-be6161a56a0c",
            "1600607687939-ce8a6c25118c",
            "1512917774080-9991f1c4c750"
        ][i % 4]}?auto=format&fit=crop&w=600&q=80`,
        agent: "https://i.pravatar.cc/150?img=" + (i % 10),
    }));
};

const PROPERTIES = generateProperties(12);

export default function ListingsSection() {
    return (
        <section className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Sidebar Filters */}
                    <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#2C3E50]">Filters</h3>
                            <button className="text-sm text-[#FF6B35]">Reset</button>
                        </div>

                        {/* Filter Groups */}
                        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-6">
                            <div>
                                <h4 className="mb-3 text-sm font-semibold text-gray-900">Furnishing</h4>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                        <input type="checkbox" className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]" />
                                        <span className="flex-1">Fully Furnished</span>
                                        <span className="text-xs text-gray-400">(45)</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                        <input type="checkbox" className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]" />
                                        <span className="flex-1">Semi Furnished</span>
                                        <span className="text-xs text-gray-400">(120)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100" />

                            <div>
                                <h4 className="mb-3 text-sm font-semibold text-gray-900">Amenities</h4>
                                <div className="space-y-2">
                                    {["Parking", "Swimming Pool", "Gym", "Lift", "Power Backup"].map((amenity) => (
                                        <label key={amenity} className="flex items-center gap-2 text-sm text-gray-600">
                                            <input type="checkbox" className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]" />
                                            <span className="flex-1">{amenity}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Header / Controls */}
                        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-xl font-bold text-[#2C3E50]">Properties for Sale in Mumbai</h2>
                                <p className="text-sm text-gray-500">Showing 1-12 of 245 properties</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex rounded-lg bg-white p-1 border">
                                    <button className="rounded-md bg-gray-100 p-2 text-gray-900 shadow-sm"><Grid className="h-4 w-4" /></button>
                                    <button className="rounded-md p-2 text-gray-400 hover:text-gray-900"><List className="h-4 w-4" /></button>
                                </div>
                                <select className="rounded-lg border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-[#FF6B35] focus:ring-[#FF6B35]">
                                    <option>Sort by: Recommended</option>
                                    <option>Price: Low to High</option>
                                    <option>Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {PROPERTIES.map((property) => (
                                <div key={property.id} className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg border border-gray-100">
                                    <div className="relative h-48 bg-gray-200">
                                        <NextImage
                                            src={property.image}
                                            alt={property.title}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                                            Just Added
                                        </div>
                                        <button className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-gray-400 hover:text-red-500">
                                            <Heart className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#2C3E50]">{property.price}</h3>
                                                <p className="text-sm font-medium text-gray-900">{property.bhk} Apartment</p>
                                                <p className="text-xs text-gray-500">{property.location}</p>
                                            </div>
                                            <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                                                {/* Agent Avatar */}
                                                <div className="h-full w-full bg-indigo-100" />
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" /> {property.area}</span>
                                            <span>•</span>
                                            <span>Ready to Move</span>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <button className="flex-1 rounded-lg bg-[#FF6B35] py-2 text-sm font-medium text-white hover:bg-[#ff5514]">
                                                Contact
                                            </button>
                                            <button className="flex items-center justify-center rounded-lg border border-gray-200 px-3 hover:bg-gray-50">
                                                <MessageCircle className="h-4 w-4 text-green-600" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 flex justify-center">
                            <button className="rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                Load More Properties
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
