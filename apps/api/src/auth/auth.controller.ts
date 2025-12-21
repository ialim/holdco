import { BadRequestException, Body, Controller, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { sign } from "jsonwebtoken";
import { randomUUID } from "crypto";

@Controller("v1/auth")
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  @Post("login")
  login(@Body() body: any) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new BadRequestException("JWT_SECRET is not configured");
    }

    const userId = randomUUID();
    const payload = {
      sub: userId,
      email: body?.email,
      roles: [],
      permissions: [],
    };

    const accessToken = sign(payload, secret, { expiresIn: "1h" });

    return {
      access_token: accessToken,
      expires_in: 3600,
      user: {
        id: userId,
        email: body?.email,
        name: "",
        roles: [],
        permissions: [],
      },
    };
  }
}
