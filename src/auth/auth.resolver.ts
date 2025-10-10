import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload, Tokens } from './dto/auth.types';
import { LoginInput, RegisterInput } from './dto/auth.inputs';
import { GqlUser } from '../graphql/models/user.model';
import { ConfigService } from '@nestjs/config';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  @Mutation(() => AuthPayload)
  async register(
    @Args('input') input: RegisterInput,
    @Context() ctx: any,
  ): Promise<AuthPayload> {
    const { user, tokens } = await this.auth.register(
      input.username,
      input.password,
    );
    this.setRefreshCookie(ctx.res, tokens.refreshToken);
    return {
      id: user.id,
      username: user.username,
      tokens: { accessToken: tokens.accessToken },
    };
  }

  @Mutation(() => AuthPayload)
  async login(
    @Args('input') input: LoginInput,
    @Context() ctx: any,
  ): Promise<AuthPayload> {
    const { user, tokens } = await this.auth.login(
      input.username,
      input.password,
    );
    this.setRefreshCookie(ctx.res, tokens.refreshToken);
    return {
      id: user.id,
      username: user.username,
      tokens: { accessToken: tokens.accessToken },
    };
  }

  @Mutation(() => Tokens)
  async refreshTokens(@Context() ctx: any): Promise<Tokens> {
    const token = ctx.req.cookies?.['refresh_token'];
    if (!token) throw new Error('No refresh token');
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.cfg.get<string>('JWT_REFRESH_SECRET')!,
      });
    } catch {
      throw new Error('Invalid refresh token');
    }
    const tokens = await this.auth.refresh(payload.sub, payload.username);
    this.setRefreshCookie(ctx.res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Mutation(() => Boolean)
  async logout(@Context() ctx: any): Promise<boolean> {
    ctx.res.clearCookie('refresh_token', this.cookieOptions());
    return true;
  }

  @Query(() => GqlUser, { nullable: true })
  async me(@Context() ctx: any): Promise<GqlUser | null> {
    const auth = ctx.req.headers['authorization'] as string | undefined;
    if (!auth?.startsWith('Bearer ')) return null;
    const token = auth.slice('Bearer '.length);
    try {
      const payload: any = await this.jwt.verifyAsync(token, {
        secret: this.cfg.get<string>('JWT_ACCESS_SECRET')!,
      });
      return { id: payload.sub, username: payload.username };
    } catch {
      return null;
    }
  }

  private setRefreshCookie(res: any, token: string) {
    res.cookie('refresh_token', token, this.cookieOptions());
  }

  private cookieOptions() {
    const isProd = this.cfg.get('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
      maxAge: this.parseDurationMs(this.cfg.get('JWT_REFRESH_TTL', '7d')),
      domain: this.cfg.get('COOKIE_DOMAIN') || undefined,
    };
  }

  private parseDurationMs(s: string) {
    const m = s.match(/^(\d+)([smhd])$/i);
    if (!m) return 7 * 24 * 3600 * 1000;
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    const mult =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60000
          : unit === 'h'
            ? 3600000
            : 86400000;
    return n * mult;
  }
}
