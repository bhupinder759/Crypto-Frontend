export type TradingMode = "DEMO" | "REAL";

export interface UserDto {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface AccountDto {
  id: string;
  status: string;
  kyc: string;
  country: string;
  currency: string;
  mode: TradingMode;
}

export interface TradingModeContextDto {
  activeMode: TradingMode;
  account: AccountDto | null;
  realAccount: AccountDto | null;
  demoAccount: AccountDto | null;
}

export interface SessionPayload {
  user: UserDto;
  account: AccountDto | null;
  realAccount: AccountDto | null;
  demoAccount: AccountDto | null;
  tradingMode: TradingMode;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  country: string;
}
