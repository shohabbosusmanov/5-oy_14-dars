import { Global, Module } from '@nestjs/common';
import { RedisServcie } from './redis.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [RedisServcie, PrismaService],
  exports: [RedisServcie, PrismaService],
})
export class DatabaseModule {}
