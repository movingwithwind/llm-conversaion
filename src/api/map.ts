import { requestJson } from "./client";
import { getMapResponseSchema, postMapResponseSchema, deleteMapResponseSchema, type nodeschemaType, type edgeschemaType } from "./schema";

export const mapAPi = {
    async Get(){
        const url=`/api/map`;
        const data=await requestJson(url,{
            scheama:getMapResponseSchema,
        });
        return data;
    },

    async Post(nodes: nodeschemaType, edges: edgeschemaType, question:string,layout:string){
        const body=JSON.stringify({
            question,
            nodes,
            edges,
            layout,
        })
        const url=`/api/map`;
        const data=await requestJson(url,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:body,
            scheama:postMapResponseSchema,
        });
        return data;
    },

    async Delete (mapId:number){
        const url=`/api/map?id=${mapId}`;
        const data=await requestJson(url,{
            method:'DELETE',
            scheama:deleteMapResponseSchema,
        });
        return data;
    },
}