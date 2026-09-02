(function (global) {
    "use strict";

    const STORAGE_KEY = "promptGenHistoryV1";
    const ALIASES = Object.freeze({
        "outdoor-7-11-store-outdoor": "outdoor-7-eleven-store",
        "outdoor-above-classic-city-street-outdoor": "outdoor-above-classic-city-street",
        "outdoor-above-cityscape-outdoor": "outdoor-above-cityscape",
        "outdoor-athena-s-sanctuary-outdoor": "outdoor-athenas-sanctuary",
        "outdoor-chic-urban-fashion-storefront-outdoor": "outdoor-chic-urban-fashion-storefront",
        "outdoor-city-park-outdoor": "outdoor-city-park",
        "outdoor-courtyard-masjidil-haram-outdoor": "outdoor-courtyard-masjidil-haram",
        "outdoor-courtyard-masjid-nabawi-outdoor": "outdoor-courtyard-masjid-nabawi",
        "outdoor-coastel-outdoor": "outdoor-coastal-retreat",
        "outdoor-dusty-desert-outdoor": "outdoor-dusty-desert",
        "outdoor-forest-pathway-outdoor": "outdoor-forest-pathway",
        "outdoor-forest-trail-outdoor": "outdoor-forest-trail",
        "outdoor-front-cafe-outdoor": "outdoor-front-cafe",
        "outdoor-futsal-field-outdoor": "outdoor-futsal-field",
        "outdoor-garden-swing-area-outdoor": "outdoor-garden-swing-area",
        "outdoor-garden-pathway-outdoor": "outdoor-garden-pathway",
        "outdoor-golden-wheat-field-outdoor": "outdoor-golden-wheat-field",
        "outdoor-gorengan-cart-outdoor": "outdoor-gorengan-cart",
        "outdoor-grassy-park-outdoor": "outdoor-grassy-park",
        "outdoor-green-tea-plantation-outdoor": "outdoor-green-tea-plantation",
        "outdoor-ikea-Store": "outdoor-ikea-store",
        "outdoor-indomaret-Store": "outdoor-indomaret-store",
        "outdoor-indonesian-street-outdoor": "outdoor-indonesian-street",
        "outdoor-industrial-cafe-outdoor": "outdoor-industrial-cafe",
        "outdoor-japanese-alleyway-outdoor": "outdoor-japanese-alleyway",
        "outdoor-jogging-park-outdoor": "outdoor-jogging-park",
        "outdoor-kios": "outdoor-roadside-kiosk",
        "outdoor-landfill-outdoor": "outdoor-landfill",
        "outdoor-modern-courtyard-garden-outdoor": "outdoor-modern-courtyard-garden",
        "outdoor-modern-outdoor-cafe-coutyard": "outdoor-modern-outdoor-cafe-courtyard",
        "outdoor-modern-park-minimalis-landscape-outdoor": "outdoor-modern-minimalist-park",
        "outdoor-modern-urban-park-canopy-outdoor": "outdoor-modern-urban-park-canopy",
        "outdoor-mountain-ridge-outdoor": "outdoor-mountain-ridge",
        "outdoor-night-market-outdoor": "outdoor-night-market",
        "outdoor-octagon-cage-outdoor": "outdoor-mma-octagon-cage",
        "outdoor-open-air-market-outdoor": "outdoor-open-air-market",
        "outdoor-front-porch-outdoor": "outdoor-front-porch",
        "outdoor-red-carpet-outdoor": "outdoor-red-carpet",
        "outdoor-residential-street-outdoor": "outdoor-residential-street",
        "outdoor-resort-pool-outdoor": "outdoor-resort-pool",
        "outdoor-rocky-hilltop-makkah-view-outdoor": "outdoor-rocky-hilltop-makkah-view",
        "outdoor-rooftop-outdoor": "outdoor-rooftop",
        "outdoor-running-track-outdoor": "outdoor-running-track",
        "outdoor-snowy-landscape-outdoor": "outdoor-snowy-landscape",
        "outdoor-sport-park-outdoor": "outdoor-fitness-park",
        "outdoor-stadium-outdoor": "outdoor-football-stadium",
        "outdoor-storefront-outdoor": "outdoor-storefront",
        "outdoor-tall-grass-field-outdoor": "outdoor-tall-grass-field",
        "outdoor-tennis-court-outdoor": "outdoor-tennis-court",
        "outdoor-tropical-garden-walkway-with-modern-architecture-outdoor": "outdoor-tropical-garden-walkway-with-modern-architecture",
        "outdoor-upscale-urban-street-outdoor": "outdoor-upscale-urban-street",
        "outdoor-urban-architecture-stairs-outdoor-indoor": "outdoor-urban-architecture-stairs",
        "outdoor-mall-outdoor-indoor": "outdoor-futuristic-shopping-mall",
        "outdoor-balcony-twilight-outdoor": "outdoor-twilight-balcony",
        "outdoor-village-desa-outdoor": "outdoor-indonesian-village",
        "outdoor-village-nature-outdoor": "outdoor-indonesian-village-nature",
        "outdoor-volcano-outdoor": "outdoor-volcano",
        "outdoor-warkop-sidewalk-outdoor": "outdoor-warkop-sidewalk",
        "outdoor-warkop-outdoor": "outdoor-warkop",
        "outdoor-wet-gothic-street-outdoor": "outdoor-wet-gothic-street",
        "outdoor-zen-japanese-garden-outdoor": "outdoor-zen-japanese-garden",
        "indoor-airport-indoor": "indoor-airport-terminal",
        "indoor-apart-bedroom-indoor": "indoor-apartment-bedroom",
        "indoor-aquatic-center-indoor": "indoor-aquatic-center",
        "indoor-bathroom-indoor": "indoor-modern-bathroom",
        "indoor-bathtub-indoor": "indoor-luxury-spa-bathtub",
        "indoor-bathroom-glass-indoor": "indoor-glass-shower-bathroom",
        "indoor-bedroom-girls-indoor": "indoor-girls-bedroom",
        "indoor-bed-indoor": "indoor-rumpled-white-bed",
        "indoor-catwalk-indoor": "indoor-minimal-fashion-runway",
        "indoor-city-train-studio": "indoor-modern-city-train",
        "indoor-car-indoor": "indoor-car-interior",
        "indoor-comic-con-indoor": "indoor-comic-con",
        "indoor-control-room-space-station-indoor": "indoor-space-station-control-room",
        "indoor-cozy-cafe-indoor": "indoor-cozy-cafe",
        "indoor-dining-space-station-indoor": "indoor-space-station-dining-area",
        "indoor-fitting-room-indoor": "indoor-fitting-room",
        "indoor-flower-shop-indoor": "indoor-flower-shop",
        "indoor-futuristic-lab-indoor": "indoor-futuristic-robotics-garage",
        "indoor-girls-bedroom-bunk-dec-indoor": "indoor-girls-bunk-bedroom",
        "indoor-girls-bedroom-single-bed-indoor": "indoor-girls-single-bed-bedroom",
        "indoor-hotel-lobby-indoor": "indoor-hotel-lobby",
        "indoor-hotel-room-indoor": "indoor-hotel-room",
        "indoor-gym-indoor": "indoor-luxury-modern-gym",
        "indoor-hangar-indoor": "indoor-industrial-hangar",
        "indoor-kitchen-indoor": "indoor-modern-kitchen",
        "indoor-laundry-room-minimalist-indoor": "indoor-minimalist-laundry-room",
        "indoor-laundry-room-japandi-indoor": "indoor-japandi-laundry-room",
        "indoor-library-indoor": "indoor-library",
        "indoor-library-ngintip-indoor": "indoor-cozy-vintage-library",
        "indoor-live-music-venue-indoor": "indoor-vintage-live-music-venue",
        "indoor-living-room-boho-cozy-indoor": "indoor-cozy-boho-living-room",
        "indoor-living-room-boho-indo-indoor": "indoor-indonesian-boho-living-room",
        "indoor-living-room-boho-mid-indoor": "indoor-boho-mid-century-living-room",
        "indoor-living-room-modern-indoor": "indoor-modern-living-room",
        "indoor-living-room-simplicity-indoor": "indoor-simple-lived-in-living-room",
        "indoor-living-room-nordic-indoor": "indoor-nordic-living-room",
        "indoor-luxury-bar-indoor": "indoor-luxury-bar",
        "indoor-mall-indoor": "indoor-shopping-mall",
        "indoor-midori-boutique-indoor": "indoor-midori-boutique",
        "indoor-minimalist-japanese-room-indoor": "indoor-minimalist-japanese-room",
        "indoor-minimalist-art-gallery-indoor": "indoor-minimalist-art-gallery",
        "indoor-music-exhibition-indoor": "indoor-music-exhibition",
        "indoor-office-cubicle-indoor": "indoor-office-cubicle",
        "indoor-office-modern-indoor": "indoor-modern-office",
        "indoor-outer-space-cartoon-studio": "indoor-cartoon-outer-space-world",
        "indoor-padel-court-indoor": "indoor-padel-court",
        "indoor-penthouse-indoor": "indoor-luxury-penthouse",
        "indoor-pilates-studio-indoor": "indoor-pilates-studio",
        "indoor-public-restroom-indoor": "indoor-run-down-public-restroom",
        "indoor-simple-bedroom-indoor": "indoor-simple-bedroom",
        "indoor-small-indoor-live-music-venue-indoor": "indoor-small-vintage-live-music-venue",
        "indoor-space-cockpit-indoor": "indoor-retro-space-cockpit",
        "indoor-subway-train-indoor": "indoor-old-subway-train",
        "indoor-supermarket-indoor": "indoor-modern-supermarket",
        "indoor-traditional-japan-farmhouse-indoor": "indoor-traditional-japanese-farmhouse",
        "indoor-traditional-japan-bedroom-indoor": "indoor-traditional-japanese-bedroom",
        "indoor-traditional-rural-kitchen-indoor": "indoor-traditional-rural-kitchen",
        "indoor-traditional-rural-studio-indoor": "indoor-traditional-rural-studio",
        "indoor-yoga-room-indoor": "indoor-warm-yoga-room",
        "luxury-living-room": "indoor-elegant-luxury-living-room",
        "modern-library": "indoor-modern-contemporary-library",
        "airport-lounge": "indoor-premium-airport-lounge",
        "boutique-interior": "indoor-premium-boutique-interior",
        "minimal-studio": "indoor-minimal-fashion-studio",
        "warm-home-interior": "indoor-warm-contemporary-home",
        "luxury-garden-courtyard": "outdoor-luxury-garden-courtyard",
        "classic-veranda": "outdoor-classic-veranda",
        "resort-terrace": "outdoor-luxury-resort-terrace",
        "classic-modern-interior": "indoor-classic-modern-interior",
        "cafe-tea-house": "indoor-refined-cafe-tea-house",
        "Courtyard-Transition-Gallery": "indoor-textile-gallery-courtyard-transition",
        "Display-Niche-Gallery": "indoor-textile-gallery-display-niche",
        "Main-Gallery-Wall": "indoor-textile-gallery-main-wall",
        "Contemporary-cafe-courtyard": "outdoor-contemporary-cafe-courtyard",
        "Contemporary-Garden-Lounge": "indoor-contemporary-conservatory-garden-lounge",
        "Boutique-Dressing-Corner": "indoor-scandinavian-boutique-dressing-corner",
        "Mediterranean-Villa-Courtyard": "outdoor-mediterranean-villa-courtyard",
        "luxury-garden-veranda": "outdoor-luxury-garden-veranda",
        "elegant-urban-architecture": "outdoor-elegant-urban-architecture",
        "contemporary-boutique-hotel-courtyard": "outdoor-contemporary-boutique-hotel-courtyard",
        "stainless-steel-elevator": "indoor-stainless-steel-elevator",
        "hotel-lobby": "indoor-hotel-lobby",
        "hotel-room": "indoor-hotel-room",
        "fitting-room": "indoor-fitting-room",
        "front-cafe": "outdoor-front-cafe",
        "urban-architecture-stairs": "outdoor-urban-architecture-stairs",
        "modern-courtyard": "outdoor-modern-courtyard-garden",
        "outdoor-cafe-courtyard": "outdoor-modern-outdoor-cafe-courtyard",
        "city-park": "outdoor-city-park",
        "tropical-garden": "outdoor-tropical-garden-walkway-with-modern-architecture",
        "front-porch": "outdoor-front-porch",
        "upscale-urban-street": "outdoor-upscale-urban-street",
        "mall": "indoor-shopping-mall",
        "modern-gallery": "indoor-minimalist-art-gallery",
        "luxury-courtyard": "outdoor-luxury-garden-courtyard"
    });

    function resolve(value) {
        const key = String(value || "").trim();
        return ALIASES[key] || key;
    }

    function migrate() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return 0;
            const items = JSON.parse(raw);
            if (!Array.isArray(items)) return 0;

            let changed = 0;
            items.forEach(item => {
                const state = item?.state;
                if (!state) return;
                ["setting", "catalogSetting"].forEach(key => {
                    const current = state[key];
                    const next = resolve(current);
                    if (current && next !== current) {
                        state[key] = next;
                        changed += 1;
                    }
                });
            });

            if (changed) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
                global.dispatchEvent(new CustomEvent("promptgen:historychange", { detail: { migratedSettings: changed } }));
            }
            return changed;
        } catch (error) {
            console.warn("Unable to migrate legacy setting IDs in Prompt History:", error);
            return 0;
        }
    }

    global.PromptSettingIdMigration = Object.freeze({ resolve, migrate });
    migrate();
})(window);
