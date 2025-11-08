// (() => {
//     const q = sel => document.querySelector(sel);
//     const qa = sel => [...document.querySelectorAll(sel)];
//     const safe = el => el?.innerText?.trim() || null;
//
//     const data = {};
//
//     data.code = safe(q("#video_id .text")) || safe(q("#video_id .value"));
//     data.title = safe(q("#video_title"))
//     	?.split("\n")[0]      // remove anything after newline
//     	.replace(/Correction$/i, "")  // remove trailing "Correction"
//     	.trim();
//     data.date = safe(q("#video_date .text")) || safe(q("#video_date .value"));
//     data.studio = safe(q("#video_maker .text")) || safe(q("#video_maker .value"));
//     data.label = safe(q("#video_label .text")) || safe(q("#video_label .value"));
//     data.genres = qa("#video_genres a").map(a => a.innerText.trim());
//     data.actresses = qa("#video_cast .star a").map(a => a.innerText.trim());
//     data.rating = safe(q("#video_review .score"));
//     data.cover = q("#video_jacket_img")?.src || null;
//     data.url = location.href;
//     data.extractedAt = new Date().toISOString();
//
//     // ✅ Expose metadata so popup can access it
//     window.__JAVDATA__ = data;
// })();

(() => {
    const data = { site: location.hostname, url: location.href };
    let stream = null;

    // ✅ JAVTiful
    if (location.hostname.includes("javtiful")) {
        const title = document.querySelector(".video-title")?.innerText.trim() || "";
        const codeMatch = title.match(/([A-Z]{2,5}-\d{2,4})/i);
        stream = {
            code: codeMatch?.[1] || null,
            source: "javtiful",
            url: location.href,
            type: "streaming",
        };
    }

    // ✅ 123av
    if (location.hostname.includes("123av")) {
        const details = document.querySelectorAll(".detail-item span:nth-child(2)");

        const code = details[0]?.innerText.trim();

        stream = {
            code,
            source: "123av",
            url: location.href,
            type: "streaming",
        };
    }

    // ✅ JAVLibrary (existing)
    if (location.hostname.includes("javlibrary")) {
        // existing logic...
        const q = sel => document.querySelector(sel);
        const qa = sel => [...document.querySelectorAll(sel)];
        const safe = el => el?.innerText?.trim() || null;

        const data = {};

        data.code = safe(q("#video_id .text")) || safe(q("#video_id .value"));
        data.title = safe(q("#video_title"))
            ?.split("\n")[0]      // remove anything after newline
            .replace(/Correction$/i, "")  // remove trailing "Correction"
            .trim();
        data.date = safe(q("#video_date .text")) || safe(q("#video_date .value"));
        data.studio = safe(q("#video_maker .text")) || safe(q("#video_maker .value"));
        data.label = safe(q("#video_label .text")) || safe(q("#video_label .value"));
        data.genres = qa("#video_genres a").map(a => a.innerText.trim());
        data.actresses = qa("#video_cast .star a").map(a => a.innerText.trim());
        data.rating = safe(q("#video_review .score"));
        data.cover = q("#video_jacket_img")?.src || null;
        data.url = location.href;
        data.extractedAt = new Date().toISOString();

        // ✅ Expose metadata so popup can access it
        data.type = "metadata";
        window.__JAVDATA__ = data;
        return;
    }

    if (stream) {
        window.__JAVDATA__ = stream;
        return;
    }

    // default fallback
    window.__JAVDATA__ = data;

})();
