import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public prisma: PrismaClient;
  private logger: Logger;

  constructor() {
    this.prisma = new PrismaClient();
    this.logger = new Logger(PrismaService.name, { timestamp: true });
  }

  async onModuleInit() {
    try {
      await this.prisma.$connect();
      this.logger.log('prisma connected');
    } catch (error) {
      this.logger.error(error);
    }
  }
  async onModuleDestroy() {
    await this.prisma.$disconnect();
    process.exit(1);
  }
}
