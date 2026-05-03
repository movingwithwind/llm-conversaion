import { requestJson } from "./client";
import { getChatMessagesResponseSchema, type regenerateBodyType } from "./schema";

export const chatAPi = {
	async Get(nodeIds: Array<string | number>) {
		if (nodeIds.length === 0) {
			throw new Error("No selected nodes to fetch messages for");
		}

		const query = nodeIds.map((id) => `ids=${encodeURIComponent(String(id))}`).join("&");
		const url = `/api/chat?${query}`;
		const data = await requestJson(url, {
			scheama: getChatMessagesResponseSchema,
		});
		return data;
	},

	async Post(formData: FormData, signal?: AbortSignal) {
		const data = await requestJson("/api/chat", {
            method: "POST",
            body: formData,
            scheama: getChatMessagesResponseSchema,
            signal,
        });

		return data;
	},

	async Put(body: regenerateBodyType, signal?: AbortSignal) {
		const data = await requestJson("/api/chat", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            scheama: getChatMessagesResponseSchema,
            signal,
        });
        
		return data;
	},
};
