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
}

export interface SessionPayload {
  user: UserDto;
  account: AccountDto | null;
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
