import {z} from "zod";
//优化存储后
export const nodeschema = z.array(z.object({
            id: z.string(),
            type: z.string(),
            data: z.object({
                label: z.string(),
                description: z.string(),
            }),
            position: z.object({
                x: z.number(),
                y: z.number(),
            }),
            map_id: z.number(),
            _count: z.object({
                message_links: z.number()
            })
})) 
export const edgeschema = z.array(z.object({
            id: z.string(),
            source: z.string(),
            target: z.string(),
            label: z.string(),
            type: z.string(),
            map_id: z.number(),
            created_at: z.string(),
}))
export type nodeschemaType = z.infer<typeof nodeschema>;
export type edgeschemaType = z.infer<typeof edgeschema>;

//Map schema
export const getMapResponseSchema = z.object({
    message: z.string(),
    maps:z.array(z.object({
        id: z.number(),
        question: z.string(),
    }))
})
export const postMapResponseSchema = z.object({
    message: z.string(),
    mapId: z.number(),
})
export const deleteMapResponseSchema = z.object({
    message: z.string()
});

//ai直接生成
const graphnodeschema = z.array(z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
}));

const graphedgeschema = z.array(z.object({
    from: z.number(),
    to: z.number(),
    condition: z.string(),
}));

const graphlayoutschema = z.enum(["Radial layout", "Hierarchical layout"]);

export type graphnodeschemaType = z.infer<typeof graphnodeschema>;
export type graphedgeschemaType = z.infer<typeof graphedgeschema>;

export const postGraphResponseSchema = z.object({
    user_message: z.string(),
    tool_results: z.array(z.object({
        output: z.object({
            nodes: graphnodeschema,
            edges: graphedgeschema,
            layout: graphlayoutschema,
        }),
    })),
});

export const putGraphResponseSchema = z.object({
    message: z.string()
});    

export const getGraphResponseSchema = z.object({
    message: z.string(),
    map: z.object({
        id: z.number().optional(),
        question: z.string().optional(),
        layout: graphlayoutschema,
        nodes: nodeschema,
        edges: edgeschema,
    }),
});

//Chat schema
const chatmessagenodelinkschema = z.array(z.object({
    node: z.object({
        data: z.object({
            label: z.string().optional(),
        }).optional(),
    }).optional(),
}));

const chatmessageschema = z.array(z.object({
    id: z.number(),
    parent_id: z.number().nullable(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    node_links: chatmessagenodelinkschema.optional(),
}));

export type chatmessageschemaType = z.infer<typeof chatmessageschema>;

export const getChatMessagesResponseSchema = z.object({
    message: z.string(),
    messages: chatmessageschema,
});

export const regenerateBodySchema = z.object({
    node_id: z.number(),
    message_id: z.number(),
    role: z.enum(["user", "assistant"]),
    message: z.string().optional(),
});

export type regenerateBodyType = z.infer<typeof regenerateBodySchema>;

export const models = [
    { value: "qwen3.5-flash", label: "" },
    { value: "qwen3.5-plus", label: "" },
    { value: "qwen3.6-plus", label: "" },
    { value: "qwen3.6-flash", label: "" },
    { value: "qwen3.5-plus", label: "" },
    { value: "qwen3.5-plus", label: "" },
    { value: "gpt-3-max", label: "" },
]