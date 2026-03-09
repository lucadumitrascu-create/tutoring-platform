export type UserRole = 'admin' | 'student';
export type AccessStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type SubmissionStatus = 'submitted' | 'approved' | 'rejected';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  access_status: AccessStatus;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
};

export type Post = {
  id: string;
  group_id: string;
  title: string;
  description: string;
  created_at: string;
};

export type PostFile = {
  id: string;
  post_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  sort_order: number;
  created_at: string;
};

export type Assignment = {
  id: string;
  group_id: string;
  title: string;
  description: string;
  deadline: string | null;
  created_at: string;
};

export type AssignmentFile = {
  id: string;
  assignment_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  sort_order: number;
  created_at: string;
};

export type AssignmentSubmission = {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string | null;
  file_name: string | null;
  text_answer: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  feedback_file_url: string | null;
  feedback_file_name: string | null;
  created_at: string;
};

export type Meeting = {
  id: string;
  group_id: string;
  title: string;
  meet_link: string;
  scheduled_at: string;
  created_at: string;
};

export type MaterialCategory = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type MaterialItem = {
  id: string;
  category_id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  sort_order: number;
  created_at: string;
};

export type PostRead = {
  id: string;
  user_id: string;
  post_id: string;
  read_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          full_name?: string;
          access_status?: AccessStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          full_name?: string;
          access_status?: AccessStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: Group;
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: GroupMember;
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: {
          id?: string;
          group_id: string;
          title: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          title?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      post_files: {
        Row: PostFile;
        Insert: {
          id?: string;
          post_id: string;
          file_url: string;
          file_type: string;
          file_name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          file_url?: string;
          file_type?: string;
          file_name?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      assignments: {
        Row: Assignment;
        Insert: {
          id?: string;
          group_id: string;
          title: string;
          description?: string;
          deadline?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          title?: string;
          description?: string;
          deadline?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      assignment_files: {
        Row: AssignmentFile;
        Insert: {
          id?: string;
          assignment_id: string;
          file_url: string;
          file_type: string;
          file_name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          file_url?: string;
          file_type?: string;
          file_name?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      assignment_submissions: {
        Row: AssignmentSubmission;
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          file_url?: string | null;
          file_name?: string | null;
          text_answer?: string | null;
          status?: SubmissionStatus;
          feedback?: string | null;
          feedback_file_url?: string | null;
          feedback_file_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          file_url?: string | null;
          file_name?: string | null;
          text_answer?: string | null;
          status?: SubmissionStatus;
          feedback?: string | null;
          feedback_file_url?: string | null;
          feedback_file_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      meetings: {
        Row: Meeting;
        Insert: {
          id?: string;
          group_id: string;
          title: string;
          meet_link: string;
          scheduled_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          title?: string;
          meet_link?: string;
          scheduled_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      material_categories: {
        Row: MaterialCategory;
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      material_items: {
        Row: MaterialItem;
        Insert: {
          id?: string;
          category_id: string;
          file_url: string;
          file_type: string;
          file_name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          file_url?: string;
          file_type?: string;
          file_name?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      post_reads: {
        Row: PostRead;
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          read_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          read_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
