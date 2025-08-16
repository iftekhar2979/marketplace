import { ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/user/user.service";

@Injectable()
export class RolesGuard extends JwtAuthGuard {
  constructor(
    private readonly reflector: Reflector, 
    jwtService: JwtService, 
    userService: UserService, 
  ) {
    super(jwtService, userService); 
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true; 
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user; 
    const hasRole = roles.some((role) => user.role?.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('You do not have the required role !'); 
    }
    return true; 
  }
}
