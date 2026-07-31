(function (global) {
    "use strict";

    const STORAGE = {
        apiUrl: "promptGenApiUrl",
        forceFallback: "promptGenForceFallback",
        cache: "promptGenApiCache",
        cacheTime: "promptGenApiCacheTime"
    };

    const FALLBACK_URL = "./fallback.json";
    const DEFAULT_TIMEOUT_MS = 9000;

    function getMetaApiUrl() {
        return document.querySelector('meta[name="prompt-api-url"]')?.content?.trim() || "";
    }

    function getUrlParamApi() {
        const value = new URLSearchParams(window.location.search).get("api");
        return value ? value.trim() : "";
    }

    function getApiUrl() {
        return getUrlParamApi()
            || localStorage.getItem(STORAGE.apiUrl)
            || getMetaApiUrl();
    }

    function isForceFallback() {
        return localStorage.getItem(STORAGE.forceFallback) === "true";
    }

    function appendRefreshParam(url) {
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}refresh=1&_=${Date.now()}`;
    }

    async function fetchJson(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, {
                method: "GET",
                cache: "no-store",
                signal: controller.signal
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            if (json?.ok === false) throw new Error(json.error || "API returned an error.");
            return json;
        } finally {
            clearTimeout(timeout);
        }
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
            characters: normalizeList(payload.characters),
            poses: normalizeList(payload.poses),
            expressions: normalizeList(payload.expressions),
            outfits: normalizeList(payload.outfits),
            settings: normalizeList(payload.settings),
            cameraAngles: normalizeList(payload.cameraAngles),
            lighting: normalizeList(payload.lighting),
            cameraStyles: normalizeList(payload.cameraStyles),
            aspectRatios: normalizeList(payload.aspectRatios),
            compatibilityRules: normalizeList(payload.compatibilityRules)
        };
    }

    function validate(data) {
        const required = [
            "characters", "poses", "expressions", "outfits",
            "settings", "cameraAngles", "lighting", "cameraStyles", "aspectRatios"
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
        return validate(normalize(await fetchJson(`${FALLBACK_URL}?_=${Date.now()}`, 5000)));
    }

    async function load(options = {}) {
        const apiUrl = getApiUrl();
        const forceFallback = isForceFallback();
        const forceRefresh = Boolean(options.forceRefresh);

        if (forceRefresh) clearLocalCache();

        if (!forceFallback && apiUrl) {
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
                const cached = forceRefresh ? null : getCachedData(24 * 60);
                if (cached) {
                    return {
                        data: cached,
                        source: "cache",
                        message: "API unavailable · cached database loaded",
                        error: apiError
                    };
                }
                try {
                    const data = await loadFallback();
                    return {
                        data,
                        source: "fallback",
                        message: "API unavailable · fallback database loaded",
                        error: apiError
                    };
                } catch (fallbackError) {
                    throw new Error(`API failed (${apiError.message}) and fallback failed (${fallbackError.message}).`);
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
        const clean = String(url || "").trim();
        if (!clean) throw new Error("Please enter a valid Apps Script URL.");
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

    global.PromptDataLoader = {
        load,
        getApiUrl,
        saveApiUrl,
        forceFallback,
        resetSource,
        clearLocalCache
    };
})(window);
