import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryInput,
  GqlCategory,
  UpdateCategoryInput,
} from '../graphql/types/category.type';

function getUserIdFromCtx(
  ctx: any,
  jwt: JwtService,
  cfg: ConfigService,
): string {
  const auth = ctx.req?.headers?.authorization as string | undefined;
  if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const token = auth.slice('Bearer '.length);
  const payload: any = jwt.verify(token, {
    secret: cfg.get<string>('JWT_ACCESS_SECRET')!,
  });
  return payload.sub as string;
}

@Resolver(() => GqlCategory)
export class CategoriesResolver {
  constructor(
    private readonly cats: CategoriesService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  @Query(() => [GqlCategory])
  async myCategories(@Context() ctx: any): Promise<GqlCategory[]> {
    const userId = getUserIdFromCtx(ctx, this.jwt, this.cfg);
    const items = await this.cats.findMine(userId);
    return items.map((c) => ({
      id: c.id,
      name: c.name,
      imagePath: c.imagePath ?? null,
      isDefault: c.isDefault,
    }));
  }

  @Mutation(() => GqlCategory)
  async createCategory(
    @Args('input') input: CreateCategoryInput,
    @Context() ctx: any,
  ): Promise<GqlCategory> {
    const userId = getUserIdFromCtx(ctx, this.jwt, this.cfg);
    const c = await this.cats.create(userId, input.name);
    return {
      id: c.id,
      name: c.name,
      imagePath: c.imagePath ?? null,
      isDefault: c.isDefault,
    };
    // Картинку прикрепляем отдельным REST-запросом после создания
  }

  @Mutation(() => GqlCategory)
  async updateCategory(
    @Args('input') input: UpdateCategoryInput,
    @Context() ctx: any,
  ): Promise<GqlCategory> {
    const userId = getUserIdFromCtx(ctx, this.jwt, this.cfg);
    const c = await this.cats.update(userId, input.id, { name: input.name });
    return {
      id: c.id,
      name: c.name,
      imagePath: c.imagePath ?? null,
      isDefault: c.isDefault,
    };
  }

  @Mutation(() => Boolean)
  async deleteCategory(
    @Args('id', { type: () => ID }) id: string,
    @Context() ctx: any,
  ): Promise<boolean> {
    const userId = getUserIdFromCtx(ctx, this.jwt, this.cfg);
    return this.cats.delete(userId, id);
  }
}
