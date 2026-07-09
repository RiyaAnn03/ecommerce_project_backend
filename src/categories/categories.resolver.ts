import { UseGuards } from '@nestjs/common';

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { GqlAdminGuard } from '../common/guards/gql-admin.guard';

import { CategoriesService } from './categories.service';

import { CreateCategoryInput } from './dto/create-category.input';

import { UpdateCategoryInput } from './dto/update-category.input';

import { CategoryListModel } from './models/category-list.model';

import { CategoryModel } from './models/category.model';



@Resolver(() => CategoryModel)

export class CategoriesResolver {

  constructor(private readonly categories: CategoriesService) {}



  @Query(() => CategoryListModel, { name: 'categories' })

  getCategories(): Promise<CategoryListModel> {

    return this.categories.findAll();

  }



  @UseGuards(GqlAdminGuard)

  @Query(() => CategoryListModel, { name: 'deletedCategories' })

  getDeletedCategories(): Promise<CategoryListModel> {

    return this.categories.findDeletedAll();

  }



  @Query(() => CategoryModel, { nullable: true })

  categoryBySlug(@Args('slug') slug: string): Promise<CategoryModel | null> {

    return this.categories.findBySlug(slug);

  }



  @Query(() => CategoryModel, { nullable: true })

  category(@Args('id') id: string): Promise<CategoryModel | null> {

    return this.categories.findById(id);

  }



  @UseGuards(GqlAdminGuard)

  @Query(() => CategoryModel, { nullable: true })

  adminCategory(@Args('id') id: string): Promise<CategoryModel | null> {

    return this.categories.findByIdAdmin(id);

  }



  @UseGuards(GqlAdminGuard)

  @Mutation(() => CategoryModel)

  createCategory(@Args('input') input: CreateCategoryInput): Promise<CategoryModel> {

    return this.categories.create(input);

  }



  @UseGuards(GqlAdminGuard)

  @Mutation(() => CategoryModel)

  updateCategory(

    @Args('id') id: string,

    @Args('input') input: UpdateCategoryInput,

  ): Promise<CategoryModel> {

    return this.categories.update(id, input);

  }



  @UseGuards(GqlAdminGuard)

  @Mutation(() => Boolean)

  deleteCategory(@Args('id') id: string): Promise<boolean> {

    return this.categories.delete(id);

  }



  @UseGuards(GqlAdminGuard)

  @Mutation(() => CategoryModel)

  restoreCategory(@Args('id') id: string): Promise<CategoryModel> {

    return this.categories.restore(id);

  }

}


