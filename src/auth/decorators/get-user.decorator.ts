import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "../../user/entities/user.entity";

/**
 * Decorator
 * Returns the current logged in user data
 */
export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const req = ctx.switchToHttp().getRequest();
  // req.user.password = undefined;
  return req.user;
});
