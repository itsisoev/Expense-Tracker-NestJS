import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GqlUser {
  @Field(() => ID) id!: string;
  @Field() username!: string;
}
