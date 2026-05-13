import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccessGate } from "@/components/AccessGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listAlbums, listAllMedia, publicUrl, type Album, type Media } from "@/lib/data";
import { generateWeek, type AlbumCount, type DayPlan } from "@/lib/scheduler";
import { Sparkles, Download, Sun, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

const WHATSAPP = "865996969";

export const Route = createFileRoute("/gerar")({
  component: () => <AccessGate><GeneratePage /></AccessGate>,
});

function GeneratePage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [mediaByAlbum, setMediaByAlbum] = useState<Record<string, Media[]>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [days, setDays] = useState(7);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [plan, setPlan] = useState<DayPlan[] | null>(null);

  useEffect(() => {
    (async () => {
      const [as, all] = await Promise.all([listAlbums(), listAllMedia()]);
      setAlbums(as);
      const byAlbum: Record<string, Media[]> = {};
      all.forEach((m) => { (byAlbum[m.album_id] ??= []).push(m); });
      setMediaByAlbum(byAlbum);
      const c: Record<string, number> = {};
      as.forEach((a) => { if (!a.is_greeting) c[a.id] = 1; });
      setCounts(c);
    })();
  }, []);

  const nonGreeting = albums.filter((a) => !a.is_greeting);
  const greetingAlbums = albums.filter((a) => a.is_greeting);
  const greetingTotal = greetingAlbums.reduce((s, a) => s + (mediaByAlbum[a.id]?.length ?? 0), 0);

  function handleGenerate() {
    const albumCounts: AlbumCount[] = nonGreeting
      .filter((a) => (counts[a.id] ?? 0) > 0)
      .map((a) => ({ albumId: a.id, count: counts[a.id] }));
    const totalNonGreeting = albumCounts.reduce((s, c) => s + c.count, 0);
    if (greetingTotal === 0 && totalNonGreeting === 0) {
      toast.error("Adiciona ficheiros às pastas primeiro");
      return;
    }
    const [y, m, d] = startDate.split("-").map(Number);
    const sd = new Date(y, m - 1, d);
    setPlan(generateWeek(albums, mediaByAlbum, albumCounts, days, sd));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gerar plano da semana</h1>
        <p className="text-sm text-muted-foreground">
          Cada dia começa com 1 vídeo/foto de saudação, seguido pelos posts das outras pastas.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Data de início</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Quantos dias</Label>
            <Input type="number" min={1} max={14} value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-lg bg-[var(--gradient-soft)] p-3 text-sm">
            <Sun className="mr-1 inline h-4 w-4 text-primary" />
            <strong>Saudações:</strong> {greetingTotal} ficheiros disponíveis · 1 por dia automaticamente
          </div>
          <Label>Posts por dia (por pasta)</Label>
          <div className="space-y-2">
            {nonGreeting.map((a) => {
              const total = mediaByAlbum[a.id]?.length ?? 0;
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2">
                  <div className="flex-1">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{total} ficheiros</p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={counts[a.id] ?? 0}
                    onChange={(e) => setCounts({ ...counts, [a.id]: Math.max(0, Number(e.target.value)) })}
                    className="w-20"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <Button className="mt-5 w-full" size="lg" onClick={handleGenerate}>
          <Sparkles className="mr-2 h-4 w-4" /> Gerar plano aleatório
        </Button>
      </div>

      {plan && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Plano gerado</h2>
            <Button variant="outline" onClick={handleGenerate}>
              <Sparkles className="mr-1 h-4 w-4" /> Regerar
            </Button>
          </div>
          {plan.map((day) => (
            <DayCard key={day.date} day={day} albums={albums} />
          ))}
        </div>
      )}
    </div>
  );
}

function DayCard({ day, albums }: { day: DayPlan; albums: Album[] }) {
  const albumName = (id: string) => albums.find((a) => a.id === id)?.name ?? "";

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            {day.weekday} <span className="text-muted-foreground">· {day.date}</span>
          </h3>
          <p className="text-xs text-muted-foreground">{day.items.length} posts</p>
        </div>
      </div>
      <div className="space-y-3">
        {day.items.map((m, i) => (
          <PostRow key={`${day.date}-${i}`} index={i} m={m} albumName={albumName(m.album_id)} dayLabel={`${day.weekday} ${day.date}`} />
        ))}
        {day.items.length === 0 && <p className="text-sm text-muted-foreground">Sem posts (adiciona ficheiros).</p>}
      </div>
    </div>
  );
}

function PostRow({ m, index, albumName, dayLabel }: { m: Media; index: number; albumName: string; dayLabel: string }) {
  const url = publicUrl(m.storage_path);
  const isVideo = m.mime_type.startsWith("video/");
  const [caption, setCaption] = useState(`Aliança Óptical · ${albumName}`);

  async function shareToWhatsApp() {
    // Try native share with file (mobile)
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], m.original_name ?? "post", { type: m.mime_type });
      // @ts-ignore
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
        return;
      }
    } catch { /* fall through */ }
    // Fallback: open WhatsApp with text + link
    const text = `${caption}\n\n${url}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank");
  }

  function downloadFile() {
    const a = document.createElement("a");
    a.href = url;
    a.download = m.original_name ?? "media";
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-3 sm:flex-row">
      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
        {isVideo ? (
          <video src={url} className="h-full w-full object-cover" muted playsInline />
        ) : (
          <img src={url} alt="" className="h-full w-full object-cover" />
        )}
        <span className="absolute left-1 top-1 rounded-md bg-background/90 px-1.5 py-0.5 text-xs font-bold">
          #{index + 1}
        </span>
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-xs text-muted-foreground">{dayLabel} · {albumName}</p>
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={2}
          className="text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={shareToWhatsApp}>
            <MessageCircle className="mr-1 h-4 w-4" /> Enviar WhatsApp
          </Button>
          <Button size="sm" variant="outline" onClick={downloadFile}>
            <Download className="mr-1 h-4 w-4" /> Descarregar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(caption);
              toast.success("Legenda copiada");
            }}
          >
            Copiar legenda
          </Button>
        </div>
      </div>
    </div>
  );
}
