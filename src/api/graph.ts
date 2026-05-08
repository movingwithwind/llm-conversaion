import { requestJson } from "./client";
import { getGraphResponseSchema, postGraphResponseSchema,putGraphResponseSchema } from "./schema";

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

    async  Put(NodeId: string, label: string, description: string ) {
        const url = "/api/graph";
        const response = await requestJson(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: NodeId, data: { label, description } }),
            scheama: putGraphResponseSchema,
        });
        return response;
    }
};
