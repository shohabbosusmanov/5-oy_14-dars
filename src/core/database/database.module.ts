import { Global, Module } from '@nestjs/common';
import { ResdisServcie } from './redis.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [ResdisServcie, PrismaService],
  exports: [ResdisServcie, PrismaService],
})
export class DatabaseModule {}
