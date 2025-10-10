import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID) id: string;
  @Field(() => String) email: string;
  @Field(() => String, { nullable: true }) name?: string | null;
  @Field(() => String, { nullable: true }) picture?: string | null;
  @Field(() => String, { nullable: true }) provider?: string | null;
  @Field(() => String, { nullable: true }) providerId?: string | null;
}
