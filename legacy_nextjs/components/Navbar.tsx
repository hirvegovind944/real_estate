import Link from "next/link";
import { Search, Menu, User, Heart } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[#FF6B35] flex items-center justify-center">
                        <span className="text-white font-bold text-xl">R</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-[#2C3E50]">RealEstate</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/buy" className="text-sm font-medium hover:text-[#FF6B35] transition-colors">Buy</Link>
                    <Link href="/rent" className="text-sm font-medium hover:text-[#FF6B35] transition-colors">Rent</Link>
                    <Link href="/sell" className="text-sm font-medium hover:text-[#FF6B35] transition-colors">Sell</Link>
                    <Link href="/blog" className="text-sm font-medium hover:text-[#FF6B35] transition-colors">Blog</Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button className="hidden md:flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                        <User className="h-4 w-4" />
                        Sign In
                    </button>
                    <button className="p-2 md:hidden">
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </nav>
    );
}
