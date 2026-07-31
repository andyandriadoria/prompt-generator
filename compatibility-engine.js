(function (global) {
    "use strict";

    const COLLECTION_BY_TYPE = {
        character: "characters",
        pose: "poses",
        expression: "expressions",
        outfit: "outfits",
        setting: "settings",
        cameraAngle: "cameraAngles",
        lighting: "lighting",
        cameraType: "cameraStyles",
        style: "stylePresets"
    };

    function normalizeTag(value) {
        return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    }

    function splitAlternatives(value) {
        if (Array.isArray(value)) return value.map(normalizeTag).filter(Boolean);
        return String(value || "")
            .split(/[|,]/)
            .map(normalizeTag)
            .filter(Boolean);
    }

    function inferTagsFromText(text) {
        const value = String(text || "").toLowerCase();
        const tags = [];
        const rules = {
            sportswear: /sport|jersey|tracksuit|yoga|workout|sneaker/,
            swimwear: /bikini|swimwear|swimsuit|pool/,
            lingerie: /lingerie|bra|panties|underwear|bralette/,
            revealing: /lingerie|bikini|bra|panties|underwear|sheer|plunging/,
            sleepwear: /pajama|sleepwear|nightgown/,
            formal: /dress|formal|evening|suit|kebaya/,
            fashion: /fashion|editorial|runway|dress|outfit|styling/,
            traditional: /kebaya|kimono|batik|traditional/,
            sci_fi: /sci[- ]?fi|futuristic|space|armor|mecha|cyberpunk/,
            futuristic: /futuristic|space|mecha|cyberpunk|high-tech/,
            combat: /combat|tactical|armor|weapon/,
            casual: /casual|t-shirt|jeans|hoodie|sneaker/,
            selfie: /selfie|phone|iphone/,
            mirror: /mirror/,
            bedroom: /bed|bedroom/,
            bathroom: /bath|shower|bathroom|towel/,
            sports: /running|jogging|sport|gym|track|futsal|tennis|soccer/,
            sensual: /sensual|seductive|lingerie/,
            religious: /mosque|masjid|kaaba|makkah|nabawi/,
            japanese: /japan|japanese|tokyo|sushi|izakaya|kimono|showa|japandi/,
            retro: /retro|vintage|1980s|80s|showa|analog|vinyl/,
            film: /film|analog|grain|halation/,
            cinematic: /cinematic|movie|film still|anamorphic/,
            indonesian: /indonesia|indonesian|desa|warkop|warung|gorengan|batik|kebaya/,
            warkop: /warkop|warung kopi/,
            warung: /warung|gorengan/,
            village: /village|desa|rural/,
            market: /market|pasar/,
            tropical: /tropical|palm|lush greenery|indonesia/,
            lifestyle: /lifestyle|everyday|candid|documentary/,
            street: /street|sidewalk|alley|road/,
            retail: /store|shop|retail|market|cafe|bookstore|arcade/,
            studio: /studio|softbox|product photography/,
            miniature: /miniature|scale model|scale-model|tiny/,
            diorama: /diorama/,
            papercut: /papercut|paper cut/,
            product: /product photography|commercial advertising|collectible/,
            handcrafted: /handcrafted|handmade|crafted/,
            aerial: /aerial|top-down|bird.?s eye/,
            overhead: /overhead/,
            wide: /wide shot|wide-angle/,
            natural: /natural light|daylight|authentic|realistic/,
            night: /night|neon|twilight|blue hour/,
            dramatic: /dramatic|intense|high contrast/
        };
        Object.entries(rules).forEach(([tag, pattern]) => {
            if (pattern.test(value)) tags.push(tag);
        });
        return tags;
    }

    function toTags(item) {
        if (!item) return [];
        const raw = Array.isArray(item.tags)
            ? item.tags
            : String(item.tags || "").split(",");
        const structural = [item.id, item.gender, item.type, item.category]
            .filter(Boolean);
        const text = [
            item.label, item.prompt, item.features, item.description,
            item.style_prompt, item.stylePrompt
        ].filter(Boolean).join(" ");
        return [...new Set([
            ...raw,
            ...structural,
            ...inferTagsFromText(text)
        ].map(normalizeTag).filter(Boolean))];
    }

    function hasAnyTag(item, expression) {
        const expected = splitAlternatives(expression);
        if (!expected.length) return true;
        const tags = toTags(item);
        return expected.some(tag => tags.includes(tag));
    }

    function intersectTags(item, expected) {
        const tags = new Set(toTags(item));
        return splitAlternatives(expected).filter(tag => tags.has(tag));
    }

    function normalizeRule(rule) {
        return {
            id: rule.id || "",
            sourceType: rule.source_type || rule.sourceType || "",
            sourceTag: rule.source_tag || rule.sourceTag || "",
            relation: String(rule.relation || "prefers").toLowerCase(),
            targetType: rule.target_type || rule.targetType || "",
            targetTag: rule.target_tag || rule.targetTag || "",
            severity: String(rule.severity || "info").toLowerCase(),
            weight: Number(rule.weight || 0),
            message: rule.message || ""
        };
    }

    function levelFromScore(score, blocked) {
        if (blocked) return "blocked";
        if (score >= 90) return "great";
        if (score >= 75) return "good";
        if (score >= 55) return "review";
        return "poor";
    }

    function labelFromLevel(level) {
        return {
            great: "Excellent match",
            good: "Compatible",
            review: "Needs review",
            poor: "Weak match",
            blocked: "Not recommended"
        }[level] || "Compatible";
    }

    function evaluateStyle(style, selection) {
        if (!style) return { penalty: 0, affinity: 0, messages: [] };
        const recommended = style.recommended_tags || style.recommendedTags || "";
        const excluded = style.excluded_tags || style.excludedTags || "";
        let penalty = 0;
        let affinity = 0;
        const messages = [];

        const selected = [
            ["pose", selection.pose],
            ["expression", selection.expression],
            ["outfit", selection.outfit],
            ["setting", selection.setting],
            ["camera angle", selection.cameraAngle],
            ["lighting", selection.lighting],
            ["camera style", selection.cameraType]
        ];

        selected.forEach(([typeLabel, item]) => {
            if (!item) return;
            const positive = intersectTags(item, recommended);
            const negative = intersectTags(item, excluded);
            affinity += Math.min(3, positive.length);
            if (negative.length) {
                penalty += 18;
                messages.push({
                    severity: "warn",
                    text: `${item.label || typeLabel} is less aligned with the “${style.label}” style.`,
                    ruleId: `style-${style.id}-${item.id || typeLabel}`
                });
            }
        });

        const exactDefaults = [
            [selection.cameraAngle, style.camera_angle_id || style.cameraAngleId],
            [selection.lighting, style.lighting_id || style.lightingId],
            [selection.cameraType, style.camera_style_id || style.cameraStyleId]
        ];
        exactDefaults.forEach(([item, preferredId]) => {
            if (item && preferredId && item.id === preferredId) affinity += 3;
        });

        return { penalty, affinity, messages };
    }

    function evaluate(database, selection) {
        const rules = Array.isArray(database?.compatibilityRules)
            ? database.compatibilityRules.map(normalizeRule)
            : [];
        let score = 100;
        let blocked = false;
        const messages = [];
        const appliedRules = [];

        rules.forEach(rule => {
            const source = selection?.[rule.sourceType];
            if (!source || !hasAnyTag(source, rule.sourceTag)) return;

            const target = selection?.[rule.targetType];
            const targetMatches = target ? hasAnyTag(target, rule.targetTag) : false;
            let violated = false;
            let hint = false;

            if (rule.relation === "requires") {
                violated = Boolean(target) && !targetMatches;
                hint = !target;
            } else if (rule.relation === "excludes") {
                violated = Boolean(target) && targetMatches;
            } else if (rule.relation === "prefers") {
                violated = Boolean(target) && !targetMatches;
                hint = !target;
            } else if (rule.relation === "supports") {
                if (targetMatches) score = Math.min(100, score + Math.abs(rule.weight));
            }

            if (violated) {
                score -= Math.abs(rule.weight);
                if (rule.severity === "block") blocked = true;
                if (rule.message) messages.push({ severity: rule.severity, text: rule.message, ruleId: rule.id });
                appliedRules.push({ ...rule, status: "violated" });
            } else if (hint && rule.message) {
                messages.push({ severity: "hint", text: rule.message, ruleId: rule.id });
                appliedRules.push({ ...rule, status: "hint" });
            } else if (targetMatches) {
                appliedRules.push({ ...rule, status: "matched" });
            }
        });

        const styleResult = evaluateStyle(selection?.style, selection || {});
        score -= styleResult.penalty;
        messages.push(...styleResult.messages);

        score = Math.max(0, Math.min(100, Math.round(score)));
        const level = levelFromScore(score, blocked);
        const uniqueMessages = [];
        const seen = new Set();
        messages.forEach(item => {
            if (!seen.has(item.text)) {
                seen.add(item.text);
                uniqueMessages.push(item);
            }
        });

        return {
            score,
            rankingScore: score + Math.min(24, styleResult.affinity * 3),
            styleAffinity: styleResult.affinity,
            level,
            label: labelFromLevel(level),
            blocked,
            messages: uniqueMessages.slice(0, 5),
            appliedRules
        };
    }

    function rankCandidates(database, selection, targetType, candidates) {
        const results = new Map();
        (candidates || []).forEach(item => {
            const simulated = { ...selection, [targetType]: item };
            results.set(item.id, evaluate(database, simulated));
        });
        return results;
    }

    function collectionName(type) {
        return COLLECTION_BY_TYPE[type] || "";
    }

    global.CompatibilityEngine = {
        evaluate,
        rankCandidates,
        inferTagsFromText,
        toTags,
        hasAnyTag,
        collectionName
    };
})(window);
