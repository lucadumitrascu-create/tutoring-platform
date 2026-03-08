export type UserRole = 'admin' | 'student';
export type AccessStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type SubmissionStatus = 'submitted' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  access_status: AccessStatus;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export interface Post {
  id: string;
  group_id: string;
  title: string;
  description: string;
  created_at: string;
}

export interface PostFile {
  id: string;
  post_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  sort_order: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  group_id: string;
  title: string;
  description: string;
  deadline: string | null;
  created_at: string;
}

export interface AssignmentFile {
  id: string;
  assignment_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  sort_order: number;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  file_name: string;
  status: SubmissionStatus;
  feedback: string | null;
  feedback_file_url: string | null;
  feedback_file_name: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  group_id: string;
  title: string;
  meet_link: string;
  scheduled_at: string;
  created_at: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface MaterialItem {
  id: string;
  category_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  sort_order: number;
  created_at: string;
}

export interface PostRead {
  id: string;
  user_id: string;
  post_id: string;
  read_at: string;
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
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at'>;
        Update: Partial<Omit<Group, 'id' | 'created_at'>>;
        Relationships: [];
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, 'id' | 'created_at'>;
        Update: Partial<Omit<GroupMember, 'id' | 'created_at'>>;
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at'>;
        Update: Partial<Omit<Post, 'id' | 'created_at'>>;
        Relationships: [];
      };
      post_files: {
        Row: PostFile;
        Insert: Omit<PostFile, 'id' | 'created_at'>;
        Update: Partial<Omit<PostFile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      assignments: {
        Row: Assignment;
        Insert: Omit<Assignment, 'id' | 'created_at'>;
        Update: Partial<Omit<Assignment, 'id' | 'created_at'>>;
        Relationships: [];
      };
      assignment_files: {
        Row: AssignmentFile;
        Insert: Omit<AssignmentFile, 'id' | 'created_at'>;
        Update: Partial<Omit<AssignmentFile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      assignment_submissions: {
        Row: AssignmentSubmission;
        Insert: Omit<AssignmentSubmission, 'id' | 'created_at'>;
        Update: Partial<Omit<AssignmentSubmission, 'id' | 'created_at'>>;
        Relationships: [];
      };
      meetings: {
        Row: Meeting;
        Insert: Omit<Meeting, 'id' | 'created_at'>;
        Update: Partial<Omit<Meeting, 'id' | 'created_at'>>;
        Relationships: [];
      };
      material_categories: {
        Row: MaterialCategory;
        Insert: Omit<MaterialCategory, 'id' | 'created_at'>;
        Update: Partial<Omit<MaterialCategory, 'id' | 'created_at'>>;
        Relationships: [];
      };
      material_items: {
        Row: MaterialItem;
        Insert: Omit<MaterialItem, 'id' | 'created_at'>;
        Update: Partial<Omit<MaterialItem, 'id' | 'created_at'>>;
        Relationships: [];
      };
      post_reads: {
        Row: PostRead;
        Insert: Omit<PostRead, 'id' | 'read_at'>;
        Update: Partial<Omit<PostRead, 'id' | 'read_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
