import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Tokens {
  @Field() accessToken!: string;
}

@ObjectType()
export class AuthPayload {
  @Field() id!: string;
  @Field() username!: string;
  @Field(() => Tokens) tokens!: Tokens;
}
