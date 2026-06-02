import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Edit2, Eye, MousePointer, ToggleLeft,
  ToggleRight, Image, Link, Calendar, Save, X, Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string;
  type: 'banner' | 'popup' | 'sidebar';
  position: string;
  is_active: boolean;
  show_to: string;
  priority: number;
  start_date: string | null;
  end_date: string | null;
  click_count: number;
  view_count: number;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  banner: '📢 Banner',
  popup: '🎯 Pop-up',
  sidebar: '📌 Sidebar',
};

const emptyForm = {
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  link_text: 'Batafsil',
  type: 'banner' as Ad['type'],
  position: 'top',
  show_to: 'free',
  priority: 0,
  start_date: '',
  end_date: '',
};

export const AdsTab = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'banner' | 'popup' | 'sidebar'>('all');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAds(); }, []);

  const fetchAds = async () => {
    try {
      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      setAds((data as Ad[]) || []);
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (ad: Ad) => {
    setEditing(ad);
    setForm({
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      link_text: ad.link_text || 'Batafsil',
      type: ad.type,
      position: ad.position || 'top',
      show_to: ad.show_to,
      priority: ad.priority,
      start_date: ad.start_date ? ad.start_date.slice(0, 16) : '',
      end_date: ad.end_date ? ad.end_date.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user?.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('ad-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('ad-images').getPublicUrl(path);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
      toast.success('Rasm yuklandi!');
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Sarlavha kiritish shart!'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        link_text: form.link_text || 'Batafsil',
        type: form.type,
        position: form.position,
        show_to: form.show_to,
        priority: form.priority,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        created_by: user?.id,
      };

      if (editing) {
        await (supabase as any).from('advertisements').update(payload).eq('id', editing.id);
        toast.success("Reklama yangilandi!");
      } else {
        await (supabase as any).from('advertisements').insert(payload);
        toast.success("Reklama yaratildi!");
      }
      setShowForm(false);
      fetchAds();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (ad: Ad) => {
    await (supabase as any).from('advertisements').update({ is_active: !ad.is_active }).eq('id', ad.id);
    setAds(prev => prev.map(a => a.id === ad.id ? { ...a, is_active: !a.is_active } : a));
    toast.success(ad.is_active ? "Reklama o'chirildi" : "Reklama yoqildi");
  };

  const deleteAd = async (id: string) => {
    if (!confirm("Reklamani o'chirishni tasdiqlaysizmi?")) return;
    await (supabase as any).from('advertisements').delete().eq('id', id);
    setAds(prev => prev.filter(a => a.id !== id));
    toast.success("Reklama o'chirildi");
  };

  const filtered = filter === 'all' ? ads : ads.filter(a => a.type === filter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Reklamalar</h2>
          <p className="text-sm text-muted-foreground">{ads.length} ta reklama · Faqat bepul foydalanuvchilarga</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Yangi reklama
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'banner', 'popup', 'sidebar'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
            {f === 'all' ? '📋 Hammasi' : TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Jami', value: ads.length, icon: '📋' },
          { label: 'Faol', value: ads.filter(a => a.is_active).length, icon: '✅' },
          { label: "Jami ko'rishlar", value: ads.reduce((s, a) => s + a.view_count, 0).toLocaleString(), icon: '👁️' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg">{s.icon}</p>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? 'Reklamani tahrirlash' : 'Yangi reklama'}</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sarlavha */}
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Sarlavha *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Reklama sarlavhasi"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            {/* Tavsif */}
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Tavsif</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Qisqa tavsif..." rows={2}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>

            {/* Tur */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Tur</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Ad['type'] }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="banner">📢 Banner</option>
                <option value="popup">🎯 Pop-up</option>
                <option value="sidebar">📌 Sidebar</option>
              </select>
            </div>

            {/* Pozitsiya */}
            {form.type === 'banner' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">Pozitsiya</label>
                <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="top">Yuqori</option>
                  <option value="bottom">Pastki</option>
                </select>
              </div>
            )}

            {/* Prioritet */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Prioritet (0-10)</label>
              <input type="number" min={0} max={10} value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            {/* Rasm */}
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Rasm</label>
              <div className="flex gap-2">
                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://... yoki yuklang"
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
              {form.image_url && (
                <img src={form.image_url} alt="" className="mt-2 h-20 rounded-lg object-cover" />
              )}
            </div>

            {/* Link */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Link URL</label>
              <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Tugma matni</label>
              <input value={form.link_text} onChange={e => setForm(f => ({ ...f, link_text: e.target.value }))}
                placeholder="Batafsil"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            {/* Sana */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Boshlanish sanasi</label>
              <input type="datetime-local" value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Tugash sanasi</label>
              <input type="datetime-local" value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Bekor</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2 rounded-xl">
              <Save className="w-4 h-4" />
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Ads list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-3xl mb-3">📭</p>
          <p className="font-medium">Hali reklama yo'q</p>
          <p className="text-sm mt-1">Yuqoridagi "Yangi reklama" tugmasini bosing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ad, i) => (
            <motion.div key={ad.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className={`bg-card border rounded-2xl p-4 flex items-center gap-4 transition-opacity ${!ad.is_active ? 'opacity-50' : 'border-border'}`}>

              {/* Image */}
              {ad.image_url ? (
                <img src={ad.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0 text-2xl">
                  {ad.type === 'banner' ? '📢' : ad.type === 'popup' ? '🎯' : '📌'}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="font-medium text-sm">{ad.title}</h3>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{TYPE_LABELS[ad.type]}</span>
                  {!ad.is_active && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">O'chiq</span>}
                </div>
                {ad.description && <p className="text-xs text-muted-foreground truncate">{ad.description}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{ad.view_count}</span>
                  <span className="flex items-center gap-1"><MousePointer className="w-3 h-3" />{ad.click_count}</span>
                  {ad.end_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ad.end_date).toLocaleDateString('uz-UZ')} gacha
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleActive(ad)}
                  className={`p-2 rounded-lg transition-colors ${ad.is_active ? 'text-green-500 hover:bg-green-500/10' : 'text-muted-foreground hover:bg-muted'}`}
                  title={ad.is_active ? "O'chirish" : "Yoqish"}>
                  {ad.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => openEdit(ad)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteAd(ad.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
