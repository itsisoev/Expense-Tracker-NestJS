import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload, Tokens } from './dto/auth.types';
import { LoginInput, RegisterInput } from './dto/auth.inputs';
import { GqlUser } from '../graphql/models/user.model';
import { ConfigService } from '@nestjs/config';

interface JwtBasePayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

interface JwtAccessPayload extends JwtBasePayload {
  type?: 'access';
}

interface JwtRefreshPayload extends JwtBasePayload {
  type?: 'refresh';
}

@Resolver()
export class AuthResolver {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    const { user, tokens } = await this.auth.register(
      input.username,
      input.password,
    );
    return {
      id: user.id,
      username: user.username,
      tokens,
    };
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    const { user, tokens } = await this.auth.login(
      input.username,
      input.password,
    );
    return {
      id: user.id,
      username: user.username,
      tokens,
    };
  }

  @Mutation(() => Tokens)
  async refreshTokens(
    @Args('refreshToken') refreshToken: string,
  ): Promise<Tokens> {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.cfg.get<string>('JWT_REFRESH_SECRET')!,
      });
    } catch {
      throw new Error('Invalid refresh token');
    }
    const tokens = await this.auth.refresh(payload.sub, payload.username);
    return tokens;
  }

  @Mutation(() => Boolean)
  async logout(): Promise<boolean> {
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
}
