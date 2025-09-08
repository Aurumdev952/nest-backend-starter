import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User as UserModel } from 'db/client';

export interface AuthenticatedUser extends Omit<UserModel, 'password'> {
  id: string;
}

export const GetUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ): AuthenticatedUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    return data ? user?.[data] : user;
  },
);
