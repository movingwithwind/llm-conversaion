import { Injectable } from '@nestjs/common';

type GraphInput={
    title: string;
    description: string;
    children: {
        condition: string;
        node: GraphInput;
    }[];
}
type Node={
    id:number;
    title: string;
    description: string;
}
type Edge={
    from:number;
    to:number;
    condition: string;
}
type GraphOutput={
    nodes: Node[];
    edges: Edge[];
}
type GraphLayout= "Radial layout"| "Hierarchical layout"


@Injectable()
export class GenerateGraphService {
    generateGraph(input: GraphInput, layout: GraphLayout): {nodes: Node[]; edges: Edge[]; layout: GraphLayout} {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const output = this.buildGraph(input, nodes, edges, this.generateUniqueId());
        return {...output , layout};
        
    }

    private buildGraph(input: GraphInput,nodes: Node[], edges: Edge[],currentId: number): GraphOutput {
        nodes.push({ id: currentId, title: input.title, description: input.description });
        for (const child of input.children) {
            const childId = this.generateUniqueId();
            edges.push({ from: currentId, to: childId, condition: child.condition });
            this.buildGraph(child.node, nodes, edges, childId);
        }
        return { nodes, edges };
    }
    private generateUniqueId(): number {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

}
