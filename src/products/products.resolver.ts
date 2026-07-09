import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAdminGuard } from '../common/guards/gql-admin.guard';
import { CreateProductInput } from './dto/create-product.input';
import {
  ProductOrderByInput,
  ProductWhereInput,
} from './dto/product-where.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductFilterOptionsModel } from './models/product-filter-options.model';
import { ProductListModel } from './models/product-list.model';
import { ProductModel } from './models/product.model';
import { ProductsService } from './products.service';

@Resolver(() => ProductModel)
export class ProductsResolver {
  constructor(private readonly products: ProductsService) {}

  @Query(() => ProductListModel, { name: 'products' })
  getProducts(
    @Args('where', { nullable: true }) where?: ProductWhereInput,
    @Args('search', { nullable: true }) search?: string,
    @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 }) skip?: number,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 10 }) take?: number,
    @Args('orderBy', { type: () => [ProductOrderByInput], nullable: true })
    orderBy?: ProductOrderByInput[],
  ): Promise<ProductListModel> {
    return this.products.findMany({ where, search, skip, take, orderBy });
  }

  @UseGuards(GqlAdminGuard)
  @Query(() => ProductListModel, { name: 'deletedProducts' })
  getDeletedProducts(
    @Args('where', { nullable: true }) where?: ProductWhereInput,
    @Args('search', { nullable: true }) search?: string,
    @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 }) skip?: number,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 10 }) take?: number,
    @Args('orderBy', { type: () => [ProductOrderByInput], nullable: true })
    orderBy?: ProductOrderByInput[],
  ): Promise<ProductListModel> {
    return this.products.findDeletedMany({ where, search, skip, take, orderBy });
  }

  @Query(() => ProductModel, { nullable: true })
  productBySlug(@Args('slug') slug: string): Promise<ProductModel | null> {
    return this.products.findBySlug(slug);
  }

  @Query(() => ProductModel, { nullable: true })
  product(@Args('id') id: string): Promise<ProductModel | null> {
    return this.products.findById(id);
  }

  @Query(() => ProductFilterOptionsModel)
  productFilterOptions(): Promise<ProductFilterOptionsModel> {
    return this.products.getFilterOptions();
  }

  @UseGuards(GqlAdminGuard)
  @Mutation(() => ProductModel)
  createProduct(@Args('input') input: CreateProductInput): Promise<ProductModel> {
    return this.products.create(input);
  }

  @UseGuards(GqlAdminGuard)
  @Mutation(() => ProductModel)
  updateProduct(
    @Args('id') id: string,
    @Args('input') input: UpdateProductInput,
  ): Promise<ProductModel> {
    return this.products.update(id, input);
  }

  @UseGuards(GqlAdminGuard)
  @Mutation(() => Boolean)
  deleteProduct(@Args('id') id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  @UseGuards(GqlAdminGuard)
  @Mutation(() => ProductModel)
  restoreProduct(@Args('id') id: string): Promise<ProductModel> {
    return this.products.restore(id);
  }
}
