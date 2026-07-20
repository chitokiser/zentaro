import { SetMetadata } from '@nestjs/common';

export const ADMIN_LEVEL_KEY = 'requiredAdminLevel';

/**
 * 1 = 최고관리자 (super admin), 2 = 운영관리자 (manager), 3 = 스탭 (staff).
 * A lower number is more privileged; requiring level N allows any admin
 * whose stored adminLevel is <= N. Routes without this decorator default
 * to 3 (any admin tier) via AdminGuard.
 */
export const RequireAdminLevel = (level: 1 | 2 | 3) => SetMetadata(ADMIN_LEVEL_KEY, level);
