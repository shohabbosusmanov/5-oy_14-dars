import { BadRequestException, Injectable } from '@nestjs/common';
import { ResdisServcie } from 'src/core/database/redis.service';
import { generate } from 'otp-generator';
import { SmsService } from './sms.service';

@Injectable()
export class OtpService {
  constructor(
    private redisService: ResdisServcie,
    private smsService: SmsService,
  ) {}

  private generateOtp() {
    const otp = generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      specialChars: false,
      upperCaseAlphabets: false,
    });
    return otp;
  }

  private getSessionToken() {
    const token = crypto.randomUUID();

    return token;
  }

  async sendOtp(phone_number: string) {
    await this.checkExistedOtp(`user:${phone_number}`);
    const temOtp = this.generateOtp();
    const responseRedis = await this.redisService.setOtp(phone_number, temOtp);

    if (responseRedis == 'OK') {
      await this.smsService.sendSms(phone_number, temOtp);
      return true;
    }
  }

  async checkExistedOtp(key: string) {
    const check = await this.redisService.getOtp(key);
    if (check) {
      const ttl = await this.redisService.getTtlKey(key);
      throw new BadRequestException(`Please try againn after ${ttl} second`);
    }
  }

  async verifyOtpSendedUser(key: string, code: string, phone_number: string) {
    const otp = await this.redisService.getOtp(key);

    if (!otp || otp != code) throw new BadRequestException('invalid code');

    await this.redisService.delKey(key);

    const sessionToken = this.getSessionToken();
    await this.redisService.setSessionTokenUser(phone_number, sessionToken);
    return sessionToken;
  }

  async cheskSessionTokenUser(key: string, token: string) {
    const sessionToken: string = (await this.redisService.getKey(
      key,
    )) as string;

    if (!sessionToken || sessionToken != token)
      throw new BadRequestException('session token expired');
  }

  async delSessionTokenUser(key: string) {
    await this.redisService.delKey(key);
  }
}
