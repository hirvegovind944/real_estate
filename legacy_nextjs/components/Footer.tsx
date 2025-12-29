import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full border-t bg-white py-12 text-[#2C3E50]">
            <div className="container mx-auto grid grid-cols-1 gap-8 px-4 md:grid-cols-4 md:px-6">
                <div className="space-y-4">
                    <div className="h-8 w-8 rounded-lg bg-[#FF6B35] flex items-center justify-center">
                        <span className="text-white font-bold text-xl">R</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Find your dream home with the most trusted real estate platform in India.
                    </p>
                    <div className="flex gap-4">
                        <Facebook className="h-5 w-5 text-gray-400 hover:text-[#FF6B35]" />
                        <Twitter className="h-5 w-5 text-gray-400 hover:text-[#FF6B35]" />
                        <Instagram className="h-5 w-5 text-gray-400 hover:text-[#FF6B35]" />
                        <Linkedin className="h-5 w-5 text-gray-400 hover:text-[#FF6B35]" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider">Company</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li><Link href="#" className="hover:text-[#FF6B35]">About Us</Link></li>
                        <li><Link href="#" className="hover:text-[#FF6B35]">Careers</Link></li>
                        <li><Link href="#" className="hover:text-[#FF6B35]">Contact</Link></li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider">Services</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li><Link href="#" className="hover:text-[#FF6B35]">Buy Property</Link></li>
                        <li><Link href="#" className="hover:text-[#FF6B35]">Rent Property</Link></li>
                        <li><Link href="#" className="hover:text-[#FF6B35]">Sell Property</Link></li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider">Legal</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li><Link href="#" className="hover:text-[#FF6B35]">Terms</Link></li>
                        <li><Link href="#" className="hover:text-[#FF6B35]">Privacy</Link></li>
                    </ul>
                </div>
            </div>
            <div className="container mx-auto mt-12 border-t pt-8 text-center text-xs text-gray-500">
                © 2024 Real Estate Inc. All rights reserved.
            </div>
        </footer>
    );
}
