import {z} from "zod";

export class Apierror extends Error {
    status: number;
    paylod:unknown;
    constructor(status:number,paylod:unknown,message:string){
        super(message);
        this.status=status;
        this.paylod=paylod;
    }
}

type RequestJsonOptions<T extends z.ZodTypeAny>={
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: BodyInit | null;
    scheama: T;
    signal?:AbortSignal;
}

export async function requestJson<T extends z.ZodTypeAny>(url: string, options: RequestJsonOptions<T>): Promise<z.infer<T>> {
    const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: options.headers,
        body: options.body,
        signal: options.signal
    });

    let json: unknown;
    try{
        json = await response.json();
    }catch{
        json = null;
    }
    //response status检验
    if (!response.ok) {
        const message=typeof (json as any)?.message === 'string' ? (json as any).message : `Request failed`;
        throw new Apierror(response.status,json,message);
    }
    //schema检验
    const parsed=options.scheama.safeParse(json);
    if(!parsed.success){
        throw new Apierror(response.status,json,`Response validation failed: ${parsed.error.message}`);
    }

    return parsed.data;
}