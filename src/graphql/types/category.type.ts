import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GqlCategory {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  imagePath!: string | null;

  @Field(() => Boolean)
  isDefault!: boolean;
}

@InputType()
export class CreateCategoryInput {
  @Field(() => String)
  name!: string;
}

@InputType()
export class UpdateCategoryInput {
  @Field(() => ID)
  id!: string;

  @Field(() => String, { nullable: true })
  name?: string;
}
