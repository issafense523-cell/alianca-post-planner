import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AccessGate } from "@/components/AccessGate";
import { Button } from "@/components/ui/button";
import { listAlbums, listMedia, uploadMedia, deleteMedia, publicUrl, type Album, type Media } from "@/lib/data";
import { ArrowLeft, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/album/$id")({
  component: () => <AccessGate><AlbumPage /></AccessGate>,
});

function AlbumPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const [albums, m] = await Promise.all([listAlbums(), listMedia(id)]);
    const a = albums.find((x) => x.id === id);
    if (!a) { navigate({ to: "/" }); return; }
    setAlbum(a);
    setMedia(m);
  }
  useEffect(() => { refresh(); }, [id]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(files.length);
    let done = 0;
    for (const f of Array.from(files)) {
      try { await uploadMedia(id, f); }
      catch (e: any) { toast.error(`Falhou ${f.name}: ${e.message}`); }
      done++;
      setUploading(files.length - done);
    }
    setUploading(0);
    toast.success("Carregado");
    refresh();
  }

  if (!album) return <p className="text-muted-foreground">A carregar…</p>;

  return (
    <div>
      <Link to="/" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
      </Link>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{album.name}</h1>
          <p className="text-sm text-muted-foreground">{media.length} {media.length === 1 ? "ficheiro" : "ficheiros"}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={uploading > 0}>
          {uploading > 0 ? (
            <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> {uploading} restantes</>
          ) : (
            <><Upload className="mr-1 h-4 w-4" /> Adicionar fotos/vídeos</>
          )}
        </Button>
      </div>

      {media.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-card p-12 text-center">
          <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Ainda nada nesta pasta. Carrega fotos ou vídeos da galeria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {media.map((m) => (
            <MediaTile key={m.id} m={m} onDelete={async () => { await deleteMedia(m); refresh(); }} />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaTile({ m, onDelete }: { m: Media; onDelete: () => void }) {
  const url = publicUrl(m.storage_path);
  const isVideo = m.mime_type.startsWith("video/");
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
      {isVideo ? (
        <video src={url} className="h-full w-full object-cover" muted playsInline />
      ) : (
        <img src={url} alt={m.original_name ?? ""} className="h-full w-full object-cover" loading="lazy" />
      )}
      <button
        onClick={() => { if (confirm("Apagar?")) onDelete(); }}
        className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </button>
    </div>
  );
}
