export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: 'developer' | 'admin' | 'user';
  phone?: string;
}
