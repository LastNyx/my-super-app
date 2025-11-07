async function getTabData() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.__JAVDATA__
    });

    return result?.[0]?.result || {};
}

document.addEventListener("DOMContentLoaded", async () => {
    const output = document.getElementById("output");
    const copyBtn = document.getElementById("copyBtn");
    const sendBtn = document.getElementById("sendBtn");

    const data = await getTabData();
    const json = JSON.stringify(data, null, 2);

    output.textContent = json;

    // ✅ Copy JSON to clipboard
    copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(json);
        copyBtn.innerText = "Copied!";
        setTimeout(() => (copyBtn.innerText = "Copy JSON"), 1500);
    });

    // ✅ Send to API
    sendBtn.addEventListener("click", async () => {
        sendBtn.innerText = "Sending...";

        try {
            const res = await fetch("http://localhost:3333/videos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: json,
            });

            if (!res.ok) throw new Error(await res.text());

            sendBtn.innerText = "Sent!";
        } catch (err) {
            sendBtn.innerText = "Failed!";
        }

        setTimeout(() => (sendBtn.innerText = "Send to API"), 1500);
    });
});
