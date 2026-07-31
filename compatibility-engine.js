(function (global) {
    "use strict";

    const COLLECTION_BY_TYPE = {
        character: "characters",
        pose: "poses",
        expression: "expressions",
        outfit: "outfits",
        setting: "settings"
    };

    function toTags(item) {
        if (!item) return [];
        const raw = Array.isArray(item.tags)
            ? item.tags
            : String(item.tags || "").split(",");
        const structural = [item.id, item.gender, item.type, item.category]
            .filter(Boolean)
            .map(value => String(value).trim().toLowerCase().replace(/\s+/g, "_"));
        return [...new Set([...raw, ...structural]
            .map(value => String(value).trim().toLowerCase().replace(/\s+/g, "_"))
            .filter(Boolean))];
    }

    function splitAlternatives(value) {
        return String(value || "")
            .split("|")
            .map(part => part.trim().toLowerCase().replace(/\s+/g, "_"))
            .filter(Boolean);
    }

    function hasAnyTag(item, expression) {
        const expected = splitAlternatives(expression);
        if (!expected.length) return true;
        const tags = toTags(item);
        return expected.some(tag => tags.includes(tag));
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
                if (rule.message) {
                    messages.push({
                        severity: rule.severity,
                        text: rule.message,
                        ruleId: rule.id
                    });
                }
                appliedRules.push({ ...rule, status: "violated" });
            } else if (hint && rule.message) {
                messages.push({
                    severity: "hint",
                    text: rule.message,
                    ruleId: rule.id
                });
                appliedRules.push({ ...rule, status: "hint" });
            } else if (targetMatches) {
                appliedRules.push({ ...rule, status: "matched" });
            }
        });

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

    function inferTagsFromText(text) {
        const value = String(text || "").toLowerCase();
        const tags = [];
        const rules = {
            sportswear: /sport|jersey|tracksuit|yoga|workout|sneaker/,
            swimwear: /bikini|swimwear|swimsuit/,
            lingerie: /lingerie|bra|panties|underwear|bralette/,
            revealing: /lingerie|bikini|bra|panties|underwear|sheer|plunging/,
            sleepwear: /pajama|sleepwear|nightgown/,
            formal: /dress|formal|evening|suit|kebaya/,
            traditional: /kebaya|kimono|batik|traditional/,
            sci_fi: /sci[- ]?fi|futuristic|space|armor|mecha|cyberpunk/,
            combat: /combat|tactical|armor|weapon/,
            casual: /casual|t-shirt|jeans|hoodie|sneaker/,
            selfie: /selfie|phone/,
            mirror: /mirror/,
            bedroom: /bed|bedroom/,
            bathroom: /bath|shower|bathroom|towel/,
            sports: /running|jogging|sport|gym|track/,
            sensual: /sensual|seductive|lingerie/,
            religious: /mosque|masjid|kaaba|makkah|nabawi/
        };
        Object.entries(rules).forEach(([tag, pattern]) => {
            if (pattern.test(value)) tags.push(tag);
        });
        return tags;
    }

    function collectionName(type) {
        return COLLECTION_BY_TYPE[type] || "";
    }

    global.CompatibilityEngine = {
        evaluate,
        rankCandidates,
        inferTagsFromText,
        toTags,
        collectionName
    };
})(window);
