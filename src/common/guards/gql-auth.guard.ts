import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { GqlExecutionContext } from '@nestjs/graphql';

import { AuthService } from '../../auth/auth.service';

import { AppException } from '../errors/app.exception';

import { ErrorCode } from '../errors/error-codes';

import { getAuthHeader } from '../types/gql-context';



@Injectable()

export class GqlAuthGuard implements CanActivate {

  constructor(private readonly auth: AuthService) {}



  canActivate(context: ExecutionContext): boolean {

    const gqlCtx = GqlExecutionContext.create(context).getContext();

    const userId = this.auth.getUserIdFromAuthHeader(getAuthHeader(gqlCtx));

    if (!userId) {

      throw new AppException(401, ErrorCode.UNAUTHENTICATED, 'Authentication required');

    }

    gqlCtx.userId = userId;

    return true;

  }

}


