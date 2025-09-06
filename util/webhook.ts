export async function sendWebhook(payload: {content: string, fileContent?: string}, webhookUrl: string) {
    try {
        const form = new FormData();
        form.append("payload_json", JSON.stringify({ content: payload.content }));

        if (payload.fileContent) {
            const file = new Blob([payload.fileContent], { type: "text/plain" });
            form.append("files[0]", file, "msg.txt");
        }

        const response = await fetch(webhookUrl, {
            method: "POST",
            body: form,
        });

        if (!response.ok) {
            console.error(`Error sending webhook: ${response.status} ${await response.text()}`);
        }
    } catch (error) {
        console.error("Failed to send message:", error);
    }
}
