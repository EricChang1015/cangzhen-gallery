export type UserRole = "admin" | "guest";
export type ItemStatus = "draft" | "published" | "reserved" | "sold";
export type CommentStatus = "visible" | "hidden";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Item {
  id: string;
  slug: string;
  title: string;
  category_id: string | null;
  summary: string | null;
  ai_description: string | null;
  ai_generated_at: string | null;
  dimensions: string | null;
  weight: string | null;
  era: string | null;
  material: string | null;
  provenance: string | null;
  price_visible: boolean;
  price: string | null;
  status: ItemStatus;
  cover_image_url: string | null;
  view_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ItemImage {
  id: string;
  item_id: string;
  url: string;
  thumb_url: string | null;
  storage_path: string | null;
  alt_text: string | null;
  sort_order: number;
  width: number | null;
  height: number | null;
  bytes: number | null;
  created_at: string;
}

export interface Comment {
  id: string;
  item_id: string;
  user_id: string;
  content: string;
  status: CommentStatus;
  created_at: string;
}

export interface Conversation {
  id: string;
  guest_id: string;
  subject: string | null;
  last_message_at: string;
  unread_for_admin: number;
  unread_for_guest: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: UserRole;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface SettingRow {
  key: string;
  value: unknown;
  updated_at: string;
  updated_by: string | null;
}

export type ItemWithRelations = Item & {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  images: ItemImage[];
};
