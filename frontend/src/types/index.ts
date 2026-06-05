export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
  errors?: Array<{ field: string; message: string }>;
}

export interface UserPublic {
  id: number;
  username: string;
  created_at: string;
}

export interface LoginResult {
  token: string;
  user: UserPublic;
}
