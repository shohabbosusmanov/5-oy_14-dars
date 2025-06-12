import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import bcrypt from 'bcrypt';
import { OtpService } from './otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private db: PrismaService,
    private otpService: OtpService,
  ) {}
  async sendOtpUser(createAuthDto: CreateAuthDto) {
    const findUser = await this.db.prisma.user.findUnique({
      where: { phone_number: createAuthDto.phone_number },
    });

    if (findUser) throw new ConflictException('phone_number already exists');

    const res = await this.otpService.sendOtp(createAuthDto.phone_number);

    if (!res) throw new InternalServerErrorException('Server error');

    return { message: 'code sended' };
  }

  async verifyOtp(data: VerifyOtpDto) {
    const key = `user:${data.phone_number}`;

    const session_token = await this.otpService.verifyOtpSendedUser(
      key,
      data.code,
      data.phone_number,
    );

    return { message: 'success', statusCode: 200, session_token };
  }

  async register(createAuthDto: CreateAuthDto) {
    const findUser = await this.db.prisma.user.findUnique({
      where: { phone_number: createAuthDto.phone_number },
    });

    if (findUser) throw new ConflictException('phone_number already exists');

    const key = `session_token:${createAuthDto.session_token}`;

    await this.otpService.cheskSessionTokenUser(
      key,
      createAuthDto.session_token,
    );

    const hashedPassword = await bcrypt.hash(createAuthDto.password, 12);

    const user = await this.db.prisma.user.create({
      data: {
        phone_number: createAuthDto.phone_number,
        password: hashedPassword,
      },
    });

    const token = this.jwtService.sign({ user_id: user.id });

    await this.otpService.delSessionTokenUser(key);

    return token;
  }

  async login(loginAuthDto: Partial<CreateAuthDto>) {
    const findUser = await this.db.prisma.user.findUnique({
      where: { phone_number: loginAuthDto.phone_number },
    });

    if (!findUser) throw new NotFoundException('user not found');

    const key = `session_token:${loginAuthDto.session_token}`;

    await this.otpService.cheskSessionTokenUser(
      key,
      loginAuthDto.session_token as string,
    );

    const comparePassword = await bcrypt.compare(
      loginAuthDto.password as string,
      findUser.password,
    );

    if (!comparePassword)
      throw new BadRequestException('phone_number or password incorrect');

    const token = this.jwtService.sign({ user_id: findUser.id });

    await this.otpService.delSessionTokenUser(key);

    return token;
  }
}
