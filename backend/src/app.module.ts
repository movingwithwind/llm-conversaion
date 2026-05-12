import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatController } from './chat/chat.controller';
import { FileService } from './chat/file/file.service';
import { AiService } from './chat/ai/ai.service';
import { GraphController } from './graph/graph.controller';
import { GenerateGraphService } from './graph/generate_graph/generate_graph.service';
import { GraphSkillService } from './graph/graph-skill.service';
import { MapController } from './map/map.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [AppController, ChatController, GraphController, MapController],
  providers: [AppService, FileService, AiService, GenerateGraphService, GraphSkillService],
})
export class AppModule {}
