/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') || '',
    });
  }

  validate(payload: any) {
    return {
      id: payload.userId,
      roles: payload.role,
    };
    // we can add more data to the payload if needed
    // for example, we can add the user id or any other data
    // that we want to use in the application
    // userId: payload.sub,
    // email: payload.email,
    // role: payload.role,
  }
}
