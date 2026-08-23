(function (global) {
    "use strict";

    const STORAGE = {
        apiUrl: "promptGenApiUrl",
        forceFallback: "promptGenForceFallback",
        cache: "promptGenApiCache",
        cacheTime: "promptGenApiCacheTime"
    };

    const FALLBACK_URL = "./fallback.json";
    const DEFAULT_TIMEOUT_MS = 30000;
    const RETRY_DELAY_MS = 1200;

    function getConfigApiUrl() {
        return String(global.PROMPT_GEN_CONFIG?.apiUrl || "").trim();
    }

    function getMetaApiUrl() {
        return document.querySelector('meta[name="prompt-api-url"]')?.content?.trim() || "";
    }

    function getUrlParamApi() {
        const value = new URLSearchParams(window.location.search).get("api");
        return value ? value.trim() : "";
    }

    function getStoredApiUrl() {
        return localStorage.getItem(STORAGE.apiUrl)?.trim() || "";
    }

    function getApiSource() {
        if (getUrlParamApi()) return "url-parameter";
        if (getStoredApiUrl()) return "browser-override";
        if (getConfigApiUrl()) return "config.js";
        if (getMetaApiUrl()) return "legacy-meta";
        return "none";
    }

    function getApiUrl() {
        return getUrlParamApi() || getStoredApiUrl() || getConfigApiUrl() || getMetaApiUrl();
    }

    function isForceFallback() {
        return localStorage.getItem(STORAGE.forceFallback) === "true";
    }

    function appendRefreshParam(url) {
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}refresh=1&_=${Date.now()}`;
    }

    function validateApiUrl(url) {
        const clean = String(url || "").trim();
        if (!clean) throw new Error("Apps Script URL is empty.");

        let parsed;
        try {
            parsed = new URL(clean);
        } catch {
            throw new Error("Apps Script URL is not valid.");
        }

        if (parsed.protocol !== "https:") {
            throw new Error("Apps Script URL must use HTTPS.");
        }

        if (parsed.pathname.endsWith("/dev")) {
            throw new Error("Use the deployed Web App URL ending in /exec, not the test URL ending in /dev.");
        }

        if (!parsed.pathname.endsWith("/exec")) {
            throw new Error("Apps Script Web App URL must end in /exec.");
        }

        return clean;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function readableFetchError(error) {
        if (error?.name === "AbortError") {
            return "request timed out while Apps Script was starting";
        }
        return String(error?.message || error || "unknown API error");
    }

    async function fetchJsonOnce(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                method: "GET",
                cache: "no-store",
                redirect: "follow",
                signal: controller.signal
            });

            const text = await response.text();
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}${text ? `: ${text.slice(0, 140)}` : ""}`);
            }

            let json;
            try {
                json = JSON.parse(text);
            } catch {
                const looksLikeHtml = /^\s*</.test(text);
                throw new Error(looksLikeHtml
                    ? "API returned an HTML/login page. Check Web App access and use the /exec URL."
                    : "API response is not valid JSON.");
            }

            if (json?.ok === false) {
                throw new Error(json.error || "API returned an error.");
            }

            return json;
        } finally {
            clearTimeout(timeout);
        }
    }

    async function fetchJson(url, timeoutMs = DEFAULT_TIMEOUT_MS, attempts = 2) {
        let lastError;
        for (let attempt = 1; attempt <= attempts; attempt += 1) {
            try {
                return await fetchJsonOnce(url, timeoutMs);
            } catch (error) {
                lastError = error;
                if (attempt < attempts) await sleep(RETRY_DELAY_MS);
            }
        }
        throw lastError;
    }

    function asBoolean(value) {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        const text = String(value ?? "").trim().toLowerCase();
        if (["false", "0", "no", "inactive"].includes(text)) return false;
        return true;
    }

    function parseTags(value) {
        if (Array.isArray(value)) {
            return value.map(item => String(item).trim().toLowerCase()).filter(Boolean);
        }
        return String(value || "")
            .split(",")
            .map(item => item.trim().toLowerCase())
            .filter(Boolean);
    }

    function normalizeList(value) {
        if (!Array.isArray(value)) return [];
        return value
            .map(item => ({
                ...item,
                active: asBoolean(item.active),
                tags: parseTags(item.tags)
            }))
            .filter(item => item.active !== false)
            .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
    }

    function normalizeConfig(value) {
        if (!value) return {};
        if (!Array.isArray(value)) return value;
        return value.reduce((acc, row) => {
            const key = row.key || row.KEY;
            if (key) acc[key] = row.value ?? row.VALUE ?? "";
            return acc;
        }, {});
    }

    function normalize(raw) {
        const payload = raw?.data && typeof raw.data === "object" ? raw.data : raw;
        if (!payload || typeof payload !== "object") {
            throw new Error("Database response is not a valid object.");
        }

        return {
            meta: payload.meta || {},
            config: normalizeConfig(payload.config),
            promptModes: normalizeList(payload.promptModes || []),
            stylePresets: normalizeList(payload.stylePresets || []),
            characters: normalizeList(payload.characters),
            poses: normalizeList(payload.poses),
            expressions: normalizeList(payload.expressions),
            outfits: normalizeList(payload.outfits),
            settings: normalizeList(payload.settings),
            cameraAngles: normalizeList(payload.cameraAngles),
            lighting: normalizeList(payload.lighting),
            cameraStyles: normalizeList(payload.cameraStyles),
            aspectRatios: normalizeList(payload.aspectRatios),
            compatibilityRules: normalizeList(payload.compatibilityRules),
            catalogSubjects: normalizeList(payload.catalogSubjects || []),
            catalogTypes: normalizeList(payload.catalogTypes || []),
            catalogSettings: normalizeList(payload.catalogSettings || []),
            catalogPoses: normalizeList(payload.catalogPoses || []),
            catalogShots: normalizeList(payload.catalogShots || []),
            preservationLevels: normalizeList(payload.preservationLevels || [])
        };
    }

    function validate(data) {
        const required = [
            "characters", "poses", "expressions", "outfits",
            "settings", "cameraAngles", "lighting", "cameraStyles", "aspectRatios",
            "catalogSubjects", "catalogTypes", "catalogSettings", "catalogPoses", "catalogShots", "preservationLevels"
        ];
        const missing = required.filter(key => !Array.isArray(data[key]));
        if (missing.length) {
            throw new Error(`Missing database collections: ${missing.join(", ")}`);
        }
        return data;
    }

    function saveCache(data) {
        try {
            localStorage.setItem(STORAGE.cache, JSON.stringify(data));
            localStorage.setItem(STORAGE.cacheTime, String(Date.now()));
        } catch (error) {
            console.warn("Unable to save API cache:", error);
        }
    }

    function clearLocalCache() {
        localStorage.removeItem(STORAGE.cache);
        localStorage.removeItem(STORAGE.cacheTime);
    }

    function getCachedData(maxAgeMinutes = 60) {
        try {
            const raw = localStorage.getItem(STORAGE.cache);
            const timestamp = Number(localStorage.getItem(STORAGE.cacheTime) || 0);
            if (!raw || !timestamp) return null;
            const ageMinutes = (Date.now() - timestamp) / 60000;
            if (ageMinutes > maxAgeMinutes) return null;
            return validate(normalize(JSON.parse(raw)));
        } catch (error) {
            console.warn("Unable to read API cache:", error);
            return null;
        }
    }

    async function loadFallback() {
        return validate(normalize(await fetchJson(`${FALLBACK_URL}?_=${Date.now()}`, 8000, 1)));
    }

    async function load(options = {}) {
        const rawApiUrl = getApiUrl();
        const forceFallback = isForceFallback();
        const forceRefresh = Boolean(options.forceRefresh);

        if (forceRefresh) clearLocalCache();

        if (!forceFallback && rawApiUrl) {
            let apiUrl;
            try {
                apiUrl = validateApiUrl(rawApiUrl);
            } catch (urlError) {
                const data = await loadFallback();
                return {
                    data,
                    source: "fallback",
                    message: `API unavailable (${readableFetchError(urlError)}) · fallback database loaded`,
                    error: urlError
                };
            }

            try {
                const requestUrl = forceRefresh ? appendRefreshParam(apiUrl) : apiUrl;
                const data = validate(normalize(await fetchJson(requestUrl)));
                saveCache(data);
                return {
                    data,
                    source: "api",
                    message: forceRefresh
                        ? "Google Sheets refreshed"
                        : "Google Sheets API connected"
                };
            } catch (apiError) {
                console.warn("API load failed:", apiError);
                const reason = readableFetchError(apiError);
                const cached = forceRefresh ? null : getCachedData(24 * 60);
                if (cached) {
                    return {
                        data: cached,
                        source: "cache",
                        message: `API unavailable (${reason}) · cached database loaded`,
                        error: apiError
                    };
                }
                try {
                    const data = await loadFallback();
                    return {
                        data,
                        source: "fallback",
                        message: `API unavailable (${reason}) · fallback database loaded`,
                        error: apiError
                    };
                } catch (fallbackError) {
                    throw new Error(`API failed (${reason}) and fallback failed (${fallbackError.message}).`);
                }
            }
        }

        const data = await loadFallback();
        return {
            data,
            source: "fallback",
            message: forceFallback ? "Fallback database selected" : "Fallback database loaded"
        };
    }

    function saveApiUrl(url) {
        const clean = validateApiUrl(url);
        localStorage.setItem(STORAGE.apiUrl, clean);
        localStorage.removeItem(STORAGE.forceFallback);
        clearLocalCache();
    }

    function forceFallback() {
        localStorage.setItem(STORAGE.forceFallback, "true");
        clearLocalCache();
    }

    function resetSource() {
        localStorage.removeItem(STORAGE.apiUrl);
        localStorage.removeItem(STORAGE.forceFallback);
        clearLocalCache();
    }

    function getDiagnostics() {
        return {
            urlParam: getUrlParamApi(),
            storedUrl: getStoredApiUrl(),
            configUrl: getConfigApiUrl(),
            metaUrl: getMetaApiUrl(),
            effectiveUrl: getApiUrl(),
            effectiveSource: getApiSource(),
            forceFallback: isForceFallback()
        };
    }

    global.PromptDataLoader = {
        load,
        getApiUrl,
        getApiSource,
        getConfigApiUrl,
        saveApiUrl,
        forceFallback,
        resetSource,
        clearLocalCache,
        getDiagnostics
    };
})(window);
