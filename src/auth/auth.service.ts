import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from 'db/client';
import { Request } from 'express';
import { PrismaService } from 'src/db/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { EmailService } from '../email/email.service';
import { RegisterUserDto } from './dto/register-user.dto';
export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private auditLogService: AuditLogService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>(
          'jwt.accessTokenExpirationTime',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>(
          'jwt.refreshTokenExpirationTime',
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(pass, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: User, req: Request) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };
    const tokens = await this.generateTokens(payload);

    // await this.auditLogService.log({
    //   userId: user.id,
    //   action: 'USER_LOGIN',
    //   resource: 'Auth',
    //   status: 'SUCCESS',
    // });

    return tokens;
  }

  async register(dto: RegisterUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use.');
    }

    // Hash password

    const hashedPassword = await this.hashPassword(dto.password);
    let newUser: User;
    try {
      newUser = await this.prisma.user.create({
        data: {
          ...dto,
          password: hashedPassword,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('A user with this email already exists.');
      }
      this.logger.error(`Failed to create user: ${e.message}`, e.stack);
      throw new InternalServerErrorException('Could not create user.');
    }

    // await this.auditLogService.log({
    //   userId: newUser.id,
    //   action: 'USER_REGISTRATION_SUCCESS',
    //   resource: 'User',
    //   resourceId: newUser.id,
    //   status: 'SUCCESS',
    //   details: {
    //     email: newUser.email,
    //     user_type: newUser.user_type,
    //     roleId: newUser.roleId,
    //   },
    // });

    const { password, ...result } = newUser;
    return result as User;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('jwt.secret'), // Use same secret or dedicated refresh token secret
        },
      );

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
        },
      });
      if (!user) {
        throw new UnauthorizedException(
          'Invalid refresh token: user not found.',
        );
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
      };
      const tokens = await this.generateTokens(newPayload);

      return tokens;
    } catch (error) {
      this.logger.warn(`Refresh token validation failed: ${error.message}`);
      throw error;
    }
  }
}
