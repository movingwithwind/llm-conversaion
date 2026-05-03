import { requestJson } from "./client";
import { getGraphResponseSchema, postGraphResponseSchema } from "./schema";

export const graphAPi = {
    async Get(graphId: number) {
        const url = `/api/graph/?id=${graphId}`;
        const data = await requestJson(url, {
            scheama: getGraphResponseSchema,
        });
        return data;
    },

    async Post(question: string) {
        const url = "/api/graph";
        const data = await requestJson(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ question }),
            scheama: postGraphResponseSchema,
        });

        return data;
    },
};
