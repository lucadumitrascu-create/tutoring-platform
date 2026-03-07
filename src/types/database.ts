export type UserRole = 'admin' | 'student';
export type HomeworkStatus = 'submitted' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  meet_link: string | null;
  scheduled_at: string | null;
  created_at: string;
}

export interface Material {
  id: string;
  lesson_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  uploaded_by: string;
  created_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  lesson_id: string;
  stripe_session_id: string;
  created_at: string;
}

export interface Homework {
  id: string;
  lesson_id: string;
  student_id: string;
  file_url: string;
  file_name: string;
  status: HomeworkStatus;
  feedback: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
        Relationships: [];
      };
      lessons: {
        Row: Lesson;
        Insert: Omit<Lesson, 'id' | 'created_at'>;
        Update: Partial<Omit<Lesson, 'id' | 'created_at'>>;
        Relationships: [];
      };
      materials: {
        Row: Material;
        Insert: Omit<Material, 'id' | 'created_at'>;
        Update: Partial<Omit<Material, 'id' | 'created_at'>>;
        Relationships: [];
      };
      purchases: {
        Row: Purchase;
        Insert: Omit<Purchase, 'id' | 'created_at'>;
        Update: Partial<Omit<Purchase, 'id' | 'created_at'>>;
        Relationships: [];
      };
      homework: {
        Row: Homework;
        Insert: Omit<Homework, 'id' | 'created_at'>;
        Update: Partial<Omit<Homework, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
