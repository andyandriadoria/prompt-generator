(function (global) {
    "use strict";

    const PRONOUNS = {
        female: {
            subject: "she", subjectCap: "She",
            object: "her", possessive: "her", possessiveCap: "Her",
            reflexive: "herself"
        },
        male: {
            subject: "he", subjectCap: "He",
            object: "him", possessive: "his", possessiveCap: "His",
            reflexive: "himself"
        },
        neutral: {
            subject: "they", subjectCap: "They",
            object: "them", possessive: "their", possessiveCap: "Their",
            reflexive: "themself"
        }
    };

    function normalizeGender(value) {
        return Object.prototype.hasOwnProperty.call(PRONOUNS, value) ? value : "neutral";
    }

    function inferGender(features) {
        const text = String(features || "").toLowerCase();
        if (/\b(man|male|boy|gentleman)\b/.test(text)) return "male";
        if (/\b(woman|female|girl|lady)\b/.test(text)) return "female";
        return "neutral";
    }

    function withArticle(text) {
        const clean = String(text || "").trim();
        if (!clean) return "";
        if (/^(a|an|the)\s/i.test(clean)) return clean;
        return `${/^[aeiou]/i.test(clean) ? "an" : "a"} ${clean}`;
    }

    function ensureSentence(text) {
        const clean = String(text || "").trim().replace(/\s+/g, " ");
        if (!clean) return "";
        return /[.!?]$/.test(clean) ? clean : `${clean}.`;
    }

    function replacePronouns(text, gender) {
        const p = PRONOUNS[normalizeGender(gender)];
        let result = String(text || "");

        const replacements = [
            [/\bHerself\b/g, p.reflexive.charAt(0).toUpperCase() + p.reflexive.slice(1)],
            [/\bherself\b/g, p.reflexive],
            [/\bShe\b/g, p.subjectCap],
            [/\bshe\b/g, p.subject],
            [/\bHer\b/g, p.possessiveCap],
            [/\bher\b/g, p.possessive]
        ];

        replacements.forEach(([pattern, value]) => {
            result = result.replace(pattern, value);
        });
        return result;
    }

    function settingSentence(setting) {
        const clean = String(setting || "").trim();
        if (!clean) return "";
        if (/^(in|inside|on|at|above|beside|behind|within|under|near|along|outside|by)\b/i.test(clean)) {
            return ensureSentence(`The scene takes place ${clean}`);
        }
        return ensureSentence(`The background features ${clean}`);
    }

    function build(state) {
        const features = String(state.features || "").trim();
        const selectedGender = state.gender === "auto"
            ? (state.characterGender || inferGender(features))
            : state.gender;
        const gender = normalizeGender(selectedGender);
        const p = PRONOUNS[gender];
        const config = state.config || {};
        const stylePreset = state.stylePreset || null;
        const parts = [];

        if (features) {
            const opening = String(stylePreset?.prompt_opening || stylePreset?.promptOpening || config.promptOpening || "A hyper-realistic photograph of").trim();
            parts.push(ensureSentence(`${opening} ${withArticle(features)}`));
        }

        if (state.action) {
            parts.push(ensureSentence(`${p.subjectCap} is ${replacePronouns(state.action, gender)}`));
        }

        if (state.expression) {
            parts.push(ensureSentence(`${p.possessiveCap} expression is ${replacePronouns(state.expression, gender)}`));
        }

        if (state.outfit) {
            parts.push(ensureSentence(`${p.subjectCap} wears ${replacePronouns(state.outfit, gender)}`));
        }

        if (state.setting) {
            parts.push(replacePronouns(settingSentence(state.setting), gender));
        }

        const stylePrompt = String(stylePreset?.style_prompt || stylePreset?.stylePrompt || "").trim();
        if (stylePrompt) {
            parts.push(ensureSentence(`Visual style: ${replacePronouns(stylePrompt, gender)}`));
        }

        if (state.cameraAngle) {
            parts.push(ensureSentence(`The image is captured from ${withArticle(state.cameraAngle)}`));
        }

        if (state.lighting) {
            parts.push(ensureSentence(`Lighting: ${replacePronouns(state.lighting, gender)}`));
        }

        if (state.cameraType) {
            parts.push(ensureSentence(`Captured with ${state.cameraType}`));
        }

        if (state.aspectRatio) {
            parts.push(ensureSentence(`Aspect ratio ${state.aspectRatio}`));
        }

        const suffix = String(config.promptSuffix || "").trim();
        if (suffix) {
            parts.push(ensureSentence(`Quality details: ${suffix}`));
        }

        const negativePrompt = String(stylePreset?.negative_prompt || stylePreset?.negativePrompt || "").trim();
        if (state.includeNegativePrompt && negativePrompt) {
            parts.push(ensureSentence(`Avoid: ${negativePrompt}`));
        }

        return parts
            .filter(Boolean)
            .join(" ")
            .replace(/\s+([,.!?])/g, "$1")
            .replace(/\.{2,}/g, ".")
            .trim();
    }

    global.PromptBuilder = {
        build,
        inferGender,
        replacePronouns
    };
})(window);
