import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { GqlUser } from '../graphql/models/user.model';

@Resolver(() => GqlUser)
export class UserResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [GqlUser])
  async users() {
    const all = await this.usersService.findAll();
    return all.map((u) => ({ id: u.id, username: u.username }));
  }

  @Query(() => GqlUser, { nullable: true })
  async user(@Args('id', { type: () => ID }) id: string) {
    const u = await this.usersService.findById(id);
    return u ? { id: u.id, username: u.username } : null;
  }
}
