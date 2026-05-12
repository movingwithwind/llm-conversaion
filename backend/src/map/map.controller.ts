import { BadRequestException, Body, Controller, Post, Res, Get, Delete, Query, ParseIntPipe } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client/index';
import { PrismaPg } from '@prisma/adapter-pg';
const prismaOptions: Prisma.PrismaClientOptions = {
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
};
const prisma = new PrismaClient(prismaOptions);
type NodeData = {
  label: string;
  description: string;
};
type Node={
    id:string;
    type?: 'thoughtNode';
    data: NodeData;
    position: { x: number; y: number };
}
type Edge={
    id:string;
    source:string;
    target:string;
    label: string;
    type: 'smoothstep' | 'straight';
}
type Mapbody = {
    question: string;
    layout: string;
    nodes: Node[];
    edges: Edge[];
}

@Controller('map')
export class MapController {
    @Get()
    async getMaps(@Res() res: Response) {
        try {
            const maps = await prisma.maps.findMany({
                select: {
                    id: true,
                    question: true,
                },
            });
            return res.status(200).json({ message: 'Maps fetched successfully', maps });
        } catch (error) {
            console.error('Error fetching maps:', error);
            return res.status(500).json({ message: 'Failed to fetch maps' });
        }
    }

    @Post()
    async createMap(@Body() body: Mapbody, @Res() res: Response) {
        try {
            const question = body?.question?.trim();
            const layout = body?.layout?.trim();
            const nodes = body?.nodes;
            const edges = body?.edges;
            if (!question || !layout || !nodes || !edges) {
                throw new BadRequestException('Missing required fields: question, layout, nodes, or edges');
            }
            //创建图
            const map = await prisma.maps.create({
                data: {
                    question,
                    layout,
                },
            });
            //存储节点
            for (const node of nodes) {
                await prisma.nodes.create({
                    data: {
                        id: node.id,
                        map_id: map.id,
                        type: node.type,
                        data: node.data,
                        position: node.position,
                    },
                });
            }
            //存储边
            for (const edge of edges) {
                await prisma.edges.create({
                    data: {
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                        label: edge.label,
                        type: edge.type,
                        map_id: map.id,
                    },
                });
            }

            return res.status(201).json({ message: 'Map created successfully', mapId: map.id });
        }catch (error) {
            if (error instanceof BadRequestException) {
                return res.status(400).json({ message: error.message });
            }
            console.error('Error creating map:', error);       
            return res.status(500).json({  message: 'Failed to create map' });
        }
    }

    @Delete()
    async deleteMap(@Query('id',ParseIntPipe) id: number, @Res() res: Response) {
        try {
            if (!id) {
                throw new BadRequestException('Missing required query parameter: id');
            }
            await prisma.maps.delete({
                where: {
                    id,
                },
            });
            return res.status(200).json({ message: 'Map deleted successfully' });
        } catch (error) {
            if (error instanceof BadRequestException) {
                return res.status(400).json({ message: error.message });
            }
            console.error('Error deleting map:', error);
            return res.status(500).json({ message: 'Failed to delete map' });
        }
    }
}
