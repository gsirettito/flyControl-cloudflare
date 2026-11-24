'use client';

import {
    Box,
} from "@mantine/core";
import { HeroSection } from "./components/Hero";
import { Footer } from "./components/Footer";
import { primary } from "@/components/ui/Theme/color";
import { ButtonUp } from "@/components/ButtonUp";

export const LoginIndex = () => {

    return (
        <Box style={{ minHeight: "100vh", backgroundColor: primary[0], overflow: 'hidden' }}>
            {/* ========== 1. HERO SECTION ========== */}
            <HeroSection />

            {/* ========== 11. FOOTER ========== */}
            <Footer />

            <ButtonUp />
        </Box>
    );
};