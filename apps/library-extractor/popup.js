async function getTabData() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.__JAVDATA__
    });

    return result?.[0]?.result || {};
}

// Clean fields before sending
function cleanData(raw) {
    const cleaned = { ...raw };

    // ✅ Fix rating: remove parentheses and convert to number
    if (typeof cleaned.rating === "string") {
        cleaned.rating = cleaned.rating
            .replace(/[()]/g, "")   // remove "(" and ")"
            .trim();

        const parsed = parseFloat(cleaned.rating);
        cleaned.rating = isNaN(parsed) ? null : parsed;
    }

    return cleaned;
}

async function getPageData() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
            metadata: window.__JAVDATA__?.type === "metadata" ? window.__JAVDATA__ : null,
            streaming: window.__JAVDATA__?.type === "streaming" ? window.__JAVDATA__ : null
        })
    });

    return result?.[0]?.result || {};
}


document.addEventListener("DOMContentLoaded", async () => {
    const output = document.getElementById("output");
    const copyBtn = document.getElementById("copyBtn");
    const sendBtn = document.getElementById("sendBtn");

    const { metadata, streaming } = await getPageData();
    const displayData = metadata || streaming || {};
    const json = JSON.stringify(displayData, null, 2);

    output.textContent = json;

    // ✅ Copy JSON to clipboard
    copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(json);
        copyBtn.innerText = "Copied!";
        setTimeout(() => (copyBtn.innerText = "Copy JSON"), 1500);
    });

    // ✅ Send to API
    // sendBtn.addEventListener("click", async () => {
    //     sendBtn.innerText = "Sending...";
    //
    //     try {
    //         const cleanedData = cleanData(data);
    //
    //         const res = await fetch("http://localhost:3333/videos", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify(cleanedData),
    //         });
    //
    //         if (!res.ok) throw new Error(await res.text());
    //
    //         sendBtn.innerText = "Sent!";
    //     } catch (err) {
    //         console.error(err);
    //         sendBtn.innerText = "Failed!";
    //     }
    //
    //     setTimeout(() => (sendBtn.innerText = "Send to API"), 1500);
    // });
    if (metadata && metadata.type === "metadata") {
        // ✅ JAVLibrary metadata
        sendBtn.innerText = "Send Metadata";

        sendBtn.addEventListener("click", async () => {
            sendBtn.innerText = "Sending...";

            const payload = cleanData(metadata);

            try {
                const res = await fetch("http://localhost:3333/videos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) throw new Error(await res.text());

                sendBtn.innerText = "Sent";

            } catch (err) {
                console.error(err);
                sendBtn.innerText = "Failed";
            }

            setTimeout(() => (sendBtn.innerText = "Send Metadata"), 1500);
        });

    } else if (streaming && streaming.type === "streaming") {
        // ✅ Streaming link (123av / javtiful)
        sendBtn.innerText = "Send Streaming Link";

        sendBtn.addEventListener("click", async () => {
            sendBtn.innerText = "Sending...";

            const payload = {
                code: streaming.code,
                source: streaming.source,
                url: streaming.url
            };

            try {
                const res = await fetch("http://localhost:3333/streaming", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) throw new Error(await res.text());

                sendBtn.innerText = "Sent";

            } catch (err) {
                console.error(err);
                sendBtn.innerText = "Failed";
            }

            setTimeout(() => (sendBtn.innerText = "Send Streaming Link"), 1500);
        });

    } else {
        // ✅ No supported site → hide the send button
        sendBtn.style.display = "none";
    }
});
