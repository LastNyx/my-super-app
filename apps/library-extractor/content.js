(() => {
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
    window.__JAVDATA__ = data;
})();
