import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccessGate } from "@/components/AccessGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { listAlbums, createAlbum, renameAlbum, deleteAlbum, listAllMedia, type Album } from "@/lib/data";
import { Plus, Folder, Sun, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: () => <AccessGate><AlbumsPage /></AccessGate>,
});

function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setLoading(true);
    const [as, all] = await Promise.all([listAlbums(), listAllMedia()]);
    setAlbums(as);
    const c: Record<string, number> = {};
    all.forEach((m) => { c[m.album_id] = (c[m.album_id] ?? 0) + 1; });
    setCounts(c);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      await createAlbum(newName.trim());
      setNewName("");
      setCreating(false);
      toast.success("Pasta criada");
      refresh();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">As tuas pastas</h1>
          <p className="text-sm text-muted-foreground">Organiza fotos e vídeos por categoria</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Nova pasta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova pasta</DialogTitle></DialogHeader>
            <Input placeholder="Ex: Promoções" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <DialogFooter>
              <Button onClick={handleCreate}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">A carregar…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} count={counts[a.id] ?? 0} onChange={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlbumCard({ album, count, onChange }: { album: Album; count: number; onChange: () => void }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(album.name);

  return (
    <div className="group relative rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-[var(--shadow-brand)]">
      <Link to="/album/$id" params={{ id: album.id }} className="block">
        <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-[var(--gradient-soft)]">
          {album.is_greeting ? (
            <Sun className="h-10 w-10 text-primary" />
          ) : (
            <Folder className="h-10 w-10 text-primary" />
          )}
        </div>
        <h3 className="font-semibold">{album.name}</h3>
        <p className="text-xs text-muted-foreground">
          {count} {count === 1 ? "ficheiro" : "ficheiros"}
          {album.is_greeting && " · saudação"}
        </p>
      </Link>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Dialog open={renaming} onOpenChange={setRenaming}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Renomear pasta</DialogTitle></DialogHeader>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <DialogFooter>
              <Button onClick={async () => {
                await renameAlbum(album.id, name.trim());
                toast.success("Renomeado");
                setRenaming(false);
                onChange();
              }}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar "{album.name}"?</AlertDialogTitle>
              <AlertDialogDescription>Todas as fotos/vídeos desta pasta serão apagados.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                await deleteAlbum(album.id);
                toast.success("Apagado");
                onChange();
              }}>Apagar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
