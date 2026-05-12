import { BadRequestException, Body, Controller, Put, Get, NotFoundException, ParseIntPipe, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client/index';
import { PrismaPg } from '@prisma/adapter-pg';
import { GraphSkillService } from './graph-skill.service';

const prismaOptions: Prisma.PrismaClientOptions = {
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
};
const prisma = new PrismaClient(prismaOptions);

type GraphData = {
    question: string;
    model: string;
};

@Controller('graph')
export class GraphController {
    constructor(
        private readonly graphSkillService: GraphSkillService,
    ) {}

    @Get()
    async getGraphs(
        @Query('id', ParseIntPipe) id: number,
        @Res() res: Response,
    ) {
        try {
            const map = await prisma.maps.findUnique({
                where: {
                    id,
                },
                include: {
                    nodes: {
                        include: {
                            _count: {
                                select: {
                                    message_links: true,
                                },
                            },
                        },
                    },
                    edges: true,
                },
            });
            if (!map) {
                throw new NotFoundException(`id 为 ${id} 的 graph 不存在`);
            }


            return res.status(200).json({ message: 'Graph find successfully', map});
        }catch (error) {
            console.error('Error fetching graphs:', error);
            if (error instanceof NotFoundException) {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Failed to fetch graphs' });
        }
    }

    @Post()
    async createGraph(
        @Body() body: GraphData,
        @Res() res: Response
    ) {
        const question = body?.question?.trim();
        const model = body?.model?.trim();
        if (!question) {
            throw new BadRequestException('question 不能为空');
        }

        try {
            const result = await this.graphSkillService.executeSkill(question, model);
            return res.json(result);
        } catch (error) {
            console.error('Graph skill error:', error);
            if (error instanceof BadRequestException) {
                const response = error.getResponse();
                const message = typeof response === 'string' 
                    ? response 
                    : (response as { message?: string })?.message || error.message;
                return res.status(400).json({ message });
            }
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            return res.status(500).json({ message: `生成图表失败: ${errorMessage}` });
        }
    }

    @Put()
    async updateNode(
        @Body() body: { id: string; data: Prisma.InputJsonValue },
        @Res() res: Response,
    ) {
        try {
            const { id, data } = body;
            await prisma.nodes.update({
                where: {
                    id,
                },
                data: {
                    data,
                },
            });
            return res.status(200).json({ message: 'Node updated successfully' });
        } catch (error) {
            console.error('Error updating node:', error);
            return res.status(500).json({ message: 'Failed to update node' });
        }
    }
}
