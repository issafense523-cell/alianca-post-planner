import { supabase } from "@/integrations/supabase/client";

export type Album = {
  id: string;
  name: string;
  is_greeting: boolean;
  sort_order: number;
};

export type Media = {
  id: string;
  album_id: string;
  storage_path: string;
  mime_type: string;
  original_name: string | null;
  caption: string | null;
};

const BUCKET = "aliancamedia";

export function publicUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function listAlbums(): Promise<Album[]> {
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .order("is_greeting", { ascending: false })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Album[];
}

export async function createAlbum(name: string): Promise<Album> {
  const { data, error } = await supabase
    .from("albums")
    .insert({ name, sort_order: 99 })
    .select()
    .single();
  if (error) throw error;
  return data as Album;
}

export async function renameAlbum(id: string, name: string) {
  const { error } = await supabase.from("albums").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteAlbum(id: string) {
  // get all media to delete from storage
  const { data: items } = await supabase.from("media").select("storage_path").eq("album_id", id);
  if (items?.length) {
    await supabase.storage.from(BUCKET).remove(items.map((i) => i.storage_path));
  }
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) throw error;
}

export async function listMedia(albumId: string): Promise<Media[]> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("album_id", albumId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Media[];
}

export async function listAllMedia(): Promise<Media[]> {
  const { data, error } = await supabase.from("media").select("*").limit(2000);
  if (error) throw error;
  return data as Media[];
}

export async function uploadMedia(albumId: string, file: File): Promise<Media> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${albumId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;
  const { data, error } = await supabase
    .from("media")
    .insert({
      album_id: albumId,
      storage_path: path,
      mime_type: file.type || "application/octet-stream",
      original_name: file.name,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Media;
}

export async function deleteMedia(m: Media) {
  await supabase.storage.from(BUCKET).remove([m.storage_path]);
  const { error } = await supabase.from("media").delete().eq("id", m.id);
  if (error) throw error;
}

export async function updateCaption(id: string, caption: string) {
  const { error } = await supabase.from("media").update({ caption }).eq("id", id);
  if (error) throw error;
}
