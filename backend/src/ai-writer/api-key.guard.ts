import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Static API-key auth for external automation tools (Zapier/n8n/etc.) that can't
 * maintain an admin login session. Checked via the `X-API-Key` header against
 * the AI_WRITER_API_KEY env var — unrelated to the JWT/AdminGuard used by the
 * admin dashboard's own trigger endpoints.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expectedKey = this.config.get<string>('AI_WRITER_API_KEY');
    if (!expectedKey) {
      throw new UnauthorizedException('AI_WRITER_API_KEY가 서버에 설정되어 있지 않습니다.');
    }
    const providedKey = request.headers['x-api-key'];
    if (!providedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
