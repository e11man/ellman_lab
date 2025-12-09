"use client";

import { AnimatedPromoCard } from '@/components/ui/promo-card';

export function DolphinMenuCard() {
    const handleDolphinMenuClick = async (e: React.MouseEvent) => {
        try {
            const response = await fetch('/api/dolphin_menu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            console.log('API response:', data);
        } catch (error) {
            console.error('Error calling dolphin_menu:', error);
        }
    };

    return (
        <div className="w-full flex items-center justify-center">
            <AnimatedPromoCard
                imageSrc="https://art.gametdb.com/wii/cover/US/RWIE01.png"
                title="Dolphin Emulator"
                subtitle="Open Wii Menu"
                buttonText="Launch"
                href="#"
                onButtonClick={handleDolphinMenuClick}
            />
        </div>
    );
}
