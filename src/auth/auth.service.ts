import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { CategoriesService } from '../categories/categories.service';

type JwtPayload = { sub: string; username: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
    private readonly categories: CategoriesService,
  ) {}

  async register(username: string, password: string) {
    const user = await this.users.create(username, password);
    const tokens = await this.issueTokens(user.id, user.username);
    await this.categories.ensureDefaultCategories(user.id);
    return { user, tokens };
  }

  async login(username: string, password: string) {
    const user = await this.users.findByUsername(username);
    if (!user) throw new Error('Invalid credentials');
    const ok = await this.users.validatePassword(user, password);
    if (!ok) throw new Error('Invalid credentials');
    const tokens = await this.issueTokens(user.id, user.username);
    return { user, tokens };
  }

  async refresh(userId: string, username: string) {
    const tokens = await this.issueTokens(userId, username);
    return tokens;
  }

  private async issueTokens(userId: string, username: string) {
    const accessPayload: JwtPayload = { sub: userId, username };
    const refreshPayload: JwtPayload = { sub: userId, username };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.cfg.get<string>('JWT_ACCESS_SECRET')!,
      expiresIn: this.cfg.get<string>('JWT_ACCESS_TTL', '15m'),
    });

    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.cfg.get<string>('JWT_REFRESH_SECRET')!,
      expiresIn: this.cfg.get<string>('JWT_REFRESH_TTL', '7d'),
    });

    return { accessToken, refreshToken };
  }
}
