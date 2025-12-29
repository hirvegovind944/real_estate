import { Search, MapPin, Home, DollarSign, BedDouble } from "lucide-react";

export default function HeroSection() {
    return (
        <div className="relative h-[600px] w-full overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2000&auto=format&fit=crop')", // Real estate background
                }}
            >
                <div className="absolute inset-0 bg-black/40" /> {/* Overlay */}
            </div>

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
                <h1 className="mb-8 text-4xl font-bold text-white md:text-6xl drop-shadow-md">
                    Find Your Dream Home Today
                </h1>

                {/* Search Bar */}
                <div className="w-full max-w-5xl rounded-xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        {/* Location */}
                        <div className="relative flex items-center border-b border-gray-200 pb-2 md:border-b-0 md:border-r md:px-4 md:pb-0">
                            <MapPin className="mr-2 h-5 w-5 text-gray-400" />
                            <div className="flex w-full flex-col items-start">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Location</label>
                                <select className="w-full bg-transparent text-sm font-medium text-[#2C3E50] focus:outline-none cursor-pointer appearance-none">
                                    <option>Mumbai</option>
                                    <option>Delhi NCR</option>
                                    <option>Bangalore</option>
                                </select>
                            </div>
                        </div>

                        {/* Type */}
                        <div className="relative flex items-center border-b border-gray-200 pb-2 md:border-b-0 md:border-r md:px-4 md:pb-0">
                            <Home className="mr-2 h-5 w-5 text-gray-400" />
                            <div className="flex w-full flex-col items-start">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Property Type</label>
                                <select className="w-full bg-transparent text-sm font-medium text-[#2C3E50] focus:outline-none cursor-pointer appearance-none">
                                    <option>Apartment</option>
                                    <option>Villa</option>
                                    <option>Plot</option>
                                </select>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="relative flex items-center border-b border-gray-200 pb-2 md:border-b-0 md:border-r md:px-4 md:pb-0">
                            <DollarSign className="mr-2 h-5 w-5 text-gray-400" />
                            <div className="flex w-full flex-col items-start">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Budget</label>
                                <select className="w-full bg-transparent text-sm font-medium text-[#2C3E50] focus:outline-none cursor-pointer appearance-none">
                                    <option>₹50L - ₹1Cr</option>
                                    <option>₹1Cr - ₹5Cr</option>
                                    <option>₹5Cr+</option>
                                </select>
                            </div>
                        </div>

                        {/* BHK */}
                        <div className="relative flex items-center border-b border-gray-200 pb-2 md:border-b-0 md:px-4 md:pb-0">
                            <BedDouble className="mr-2 h-5 w-5 text-gray-400" />
                            <div className="flex w-full flex-col items-start">
                                <label className="text-xs font-semibold text-gray-500 uppercase">BHK</label>
                                <select className="w-full bg-transparent text-sm font-medium text-[#2C3E50] focus:outline-none cursor-pointer appearance-none">
                                    <option>2 BHK</option>
                                    <option>3 BHK</option>
                                    <option>4+ BHK</option>
                                </select>
                            </div>
                        </div>

                        {/* Button */}
                        <div className="flex items-center">
                            <button className="flex h-12 w-full items-center justify-center rounded-lg bg-[#FF6B35] text-white transition-all hover:bg-[#ff5514] shadow-lg hover:shadow-xl active:scale-95">
                                <Search className="mr-2 h-5 w-5" />
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
