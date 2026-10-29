import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import type { Request, Response } from 'express';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CartModule } from './cart/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { GqlHttpExceptionFilter } from './common/filters/gql-exception.filter';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { UsersModule } from './users/users.module';
import { UploadModule } from './upload/upload.module';
import { AddressesModule } from './addresses/addresses.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ContactsModule } from './contacts/contacts.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    WishlistModule,
    UsersModule,
    UploadModule,
    AddressesModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    ContactsModule,
    ChatModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      introspection: true,
      playground: false,
      csrfPrevention: false,
      debug: false,
      includeStacktraceInErrorResponses: false,
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
      formatError: (error: GraphQLError): GraphQLFormattedError => {
        const statusCode =
          (error.extensions?.http as { status?: number } | undefined)?.status ??
          (error.extensions?.response as { statusCode?: number } | undefined)?.statusCode;

        const errorCode = error.extensions?.errorCode as number | undefined;

        return {
          message: error.message,
          statusCode: statusCode ?? 500,
          errorCode: errorCode ?? null,
        } as unknown as GraphQLFormattedError;
      },
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GqlHttpExceptionFilter,
    },
  ],
})
export class AppModule {}
