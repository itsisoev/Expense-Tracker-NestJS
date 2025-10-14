import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './entity/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesResolver } from './categories.resolver';
import { CategoriesController } from './categories.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity]), JwtModule.register({})],
  providers: [CategoriesService, CategoriesResolver, ConfigService],
  controllers: [CategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
