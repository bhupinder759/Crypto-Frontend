import { backendFetch } from "@/lib/api/backend";
import type {
  AccountDto,
  SessionPayload,
  TradingModeContextDto,
  UserDto,
} from "@/modules/auth/types";

function normalizeRealAccount(account: AccountDto | null): AccountDto | null {
  if (!account) {
    return null;
  }

  return {
    ...account,
    currency: account.currency ?? "USD",
    mode: "REAL",
  };
}

export async function loadSessionPayload(
  token?: string,
): Promise<SessionPayload> {
  const [user, account, tradingMode] = await Promise.all([
    backendFetch<UserDto>("/api/v1/auth/me", { token }),
    backendFetch<AccountDto>("/api/v1/accounts", {
      token,
    }).catch(() => null),
    backendFetch<TradingModeContextDto>("/api/v1/trading-mode", {
      token,
    }),
  ]);

  const realAccount = tradingMode.realAccount ?? normalizeRealAccount(account);

  return {
    user,
    account: tradingMode.account ?? realAccount,
    realAccount,
    demoAccount: tradingMode.demoAccount,
    tradingMode: tradingMode.activeMode,
  };
}
