import { Field, ID, ObjectType, InputType } from '@nestjs/graphql';

@ObjectType()
export class GqlCategory {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field({ nullable: true }) color?: string | null;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@InputType()
export class CreateCategoryInput {
  @Field() name!: string;
  @Field({ nullable: true }) color?: string;
}

@InputType()
export class UpdateCategoryInput {
  @Field(() => ID) id!: string;
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) color?: string;
}
