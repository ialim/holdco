import { UnauthorizedException } from "@nestjs/common";
import { sign } from "jsonwebtoken";
import { JwtAuthMiddleware } from "./jwt-auth.middleware";

describe("JwtAuthMiddleware", () => {
  const primarySecret = "primary-secret";
  const previousSecret = "previous-secret";

  const middleware = new JwtAuthMiddleware();

  const buildReq = (token: string) => ({
    headers: { authorization: `Bearer ${token}` },
  });

  const next = jest.fn();

  const setSecrets = (primary?: string, previous?: string) => {
    process.env.JWT_SECRET = primary;
    process.env.JWT_SECRET_PREVIOUS = previous;
  };

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SECRET_PREVIOUS;
  });

  it("accepts tokens signed with the primary secret", async () => {
    setSecrets(primarySecret, previousSecret);
    const token = sign({ sub: "user-1" }, primarySecret);
    const req: any = buildReq(token);

    await middleware.use(req, {} as any, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.sub).toBe("user-1");
  });

  it("accepts tokens signed with the previous secret", async () => {
    setSecrets(primarySecret, previousSecret);
    const token = sign({ sub: "user-2" }, previousSecret);
    const req: any = buildReq(token);

    await middleware.use(req, {} as any, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.sub).toBe("user-2");
  });

  it("rejects tokens missing sub/id claims", async () => {
    setSecrets(primarySecret, previousSecret);
    const token = sign({ permissions: ["orders.read"] }, primarySecret);
    const req: any = buildReq(token);

    await expect(middleware.use(req, {} as any, next)).rejects.toThrow(UnauthorizedException);
  });
});
