import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { AppLayout } from "@/components/AppLayout";
import type { School, SchoolTeacher, SchoolClass } from "@/types/school";
import {
  School as SchoolIcon, Users, BookOpen, BarChart3,
  Plus, Copy, Check, CreditCard, ChevronRight,
  GraduationCap, AlertCircle, Loader2, RefreshCw
} from "lucide-react";

type Tab = "overview" | "teachers" | "classes" | "payments";

export default function SchoolAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [teachers, setTeachers] = useState<SchoolTeacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassLevel, setNewClassLevel] = useState("B1");
  const [showNewClass, setShowNewClass] = useState(false);

  useEffect(() => { if (user) fetchSchool(); }, [user]);

  const fetchSchool = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await (supabase.from("schools") as any)
        .select("*").eq("owner_id", user?.id).maybeSingle();
      if (error) throw error;
      if (data) {
        setSchool(data);
        await Promise.all([fetchTeachers(data.id), fetchClasses(data.id)]);
      }
    } catch (e: any) {
      setError("Ma'lumotlarni yuklashda xato. Supabase da jadvallar yaratilganligini tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async (schoolId: string) => {
    const { data } = await (supabase.from("school_teachers") as any)
      .select("*").eq("school_id", schoolId);
    if (data) setTeachers(data);
  };

  const fetchClasses = async (schoolId: string) => {
    const { data } = await (supabase.from("school_classes") as any)
      .select("*").eq("school_id", schoolId).order("created_at", { ascending: false });
    if (data) {
      setClasses(data);
      // Har bir sinf uchun o'quvchilar sonini olish
      const counts: Record<string, number> = {};
      await Promise.all(data.map(async (cls: SchoolClass) => {
        const { count } = await (supabase.from("school_students") as any)
          .select("*", { count: "exact", head: true }).eq("class_id", cls.id);
        counts[cls.id] = count || 0;
      }));
      setStudentCounts(counts);
    }
  };

  const createSchool = async () => {
    if (!schoolName.trim()) return;
    setCreating(true);
    try {
      const slug = schoolName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
      const { data, error } = await (supabase.from("schools") as any)
        .insert({ name: schoolName, slug, owner_id: user?.id }).select().single();
      if (error) throw error;
      setSchool(data);
      setSchoolName("");
    } catch (e: any) {
      setError("Maktab yaratishda xato: " + e.message);
    } finally {
      setCreating(false);
    }
  };

  const createClass = async () => {
    if (!newClassName.trim() || !school) return;
    try {
      const { data, error } = await (supabase.from("school_classes") as any)
        .insert({ name: newClassName, level: newClassLevel, school_id: school.id }).select().single();
      if (error) throw error;
      setClasses(p => [data, ...p]);
      setStudentCounts(p => ({ ...p, [data.id]: 0 }));
      setNewClassName("");
      setShowNewClass(false);
    } catch (e: any) {
      setError("Sinf yaratishda xato: " + e.message);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalStudents = Object.values(studentCounts).reduce((a, b) => a + b, 0);

  const tabs = [
    { id: "overview", label: "Umumiy", icon: BarChart3 },
    { id: "classes", label: "Sinflar", icon: BookOpen },
    { id: "teachers", label: "O'qituvchilar", icon: GraduationCap },
    { id: "payments", label: "To'lovlar", icon: CreditCard },
  ] as const;

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="font-bold text-lg mb-2">Xato yuz berdi</h2>
        <p className="text-muted-foreground text-sm mb-6">{error}</p>
        <div className="card-elevated rounded-xl p-4 text-left text-sm mb-6 border border-border/40">
          <p className="font-semibold mb-2">Supabase SQL Editor ga kiring va quyidagini ishga tushiring:</p>
          <a href="https://supabase.com/dashboard" target="_blank" className="text-primary underline text-xs">supabase.com/dashboard</a>
          <p className="text-muted-foreground text-xs mt-1">→ SQL Editor → New query → migration faylini joylashtiring</p>
        </div>
        <button onClick={fetchSchool} className="btn-primary flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Qayta urinish
        </button>
      </div>
    </AppLayout>
  );

  if (!school) return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 text-4xl">🏫</div>
          <h1 className="text-3xl font-display font-bold mb-3">Maktab/Kurs yarating</h1>
          <p className="text-muted-foreground mb-8">O'quvchilaringizni boshqaring, natijalarni kuzating</p>
          <div className="flex gap-3">
            <input value={schoolName} onChange={e => setSchoolName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createSchool()}
              placeholder="Kurs nomi (masalan: Smart English)"
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={createSchool} disabled={creating || !schoolName.trim()} className="btn-primary px-5 py-3 whitespace-nowrap flex items-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Yaratish
            </button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 flex-wrap gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">🏫</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold">{school.name}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${school.plan === "pro" ? "bg-yellow-500/10 text-yellow-500" : "bg-muted/50 text-muted-foreground"}`}>
                  {school.plan?.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{teachers.length} o'qituvchi · {classes.length} sinf · {totalStudents} o'quvchi</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/school/teacher")} className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> O'qituvchi paneli
            </button>
            <button onClick={() => navigate("/school/student")} className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> O'quvchi paneli
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted/30 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <motion.div key="ov" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Jami o'quvchilar", value: totalStudents, icon: "👨‍🎓", color: "text-blue-500" },
                  { label: "Faol sinflar", value: classes.length, icon: "📚", color: "text-green-500" },
                  { label: "O'qituvchilar", value: teachers.length, icon: "👨‍🏫", color: "text-purple-500" },
                  { label: "Bu oy to'lov", value: "0 UZS", icon: "💳", color: "text-yellow-500" },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="card-elevated rounded-2xl p-5 border border-border/40"
                  >
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Sinf yaratish", icon: Plus, action: () => { setTab("classes"); setShowNewClass(true); }, color: "bg-blue-500/10 text-blue-500" },
                  { label: "O'qituvchi qo'shish", icon: GraduationCap, action: () => navigate("/school/teacher"), color: "bg-purple-500/10 text-purple-500" },
                  { label: "O'quvchilar paneli", icon: Users, action: () => navigate("/school/student"), color: "bg-green-500/10 text-green-500" },
                ].map((a, i) => (
                  <button key={i} onClick={a.action}
                    className="card-elevated rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 border border-border/40 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                      <a.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">{a.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* CLASSES */}
          {tab === "classes" && (
            <motion.div key="cl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">Sinflar ({classes.length})</h2>
                <button onClick={() => setShowNewClass(s => !s)} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Sinf yaratish
                </button>
              </div>

              <AnimatePresence>
                {showNewClass && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="card-elevated rounded-xl p-4 border border-primary/20 flex gap-3 flex-wrap"
                  >
                    <input value={newClassName} onChange={e => setNewClassName(e.target.value)}
                      placeholder="Sinf nomi"
                      className="flex-1 min-w-40 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <select value={newClassLevel} onChange={e => setNewClassLevel(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {["A1","A2","B1","B2","C1","C2"].map(l => <option key={l}>{l}</option>)}
                    </select>
                    <button onClick={createClass} className="btn-primary px-5 py-2.5 text-sm">Yaratish</button>
                    <button onClick={() => setShowNewClass(false)} className="btn-outline px-5 py-2.5 text-sm">Bekor</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {classes.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Hali sinf yaratilmagan</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((cls, i) => (
                    <motion.div key={cls.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="card-elevated rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/school/class/${cls.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold">{cls.name}</h3>
                          <span className="text-xs text-muted-foreground">{cls.level} daraja</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-mono">{cls.invite_code}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {studentCounts[cls.id] || 0} o'quvchi
                        </span>
                        <button onClick={e => { e.stopPropagation(); copyCode(cls.invite_code); }}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          {copied === cls.invite_code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          Nusxa
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TEACHERS */}
          {tab === "teachers" && (
            <motion.div key="te" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="font-bold text-lg">O'qituvchilar ({teachers.length}/{school.max_teachers})</h2>
              {teachers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Hali o'qituvchi qo'shilmagan</p>
                  <p className="text-xs mt-1">O'qituvchilar sinfga qo'shilganda bu yerda ko'rinadi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teachers.map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="card-elevated rounded-xl p-4 flex items-center gap-4 border border-border/40"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary">{t.name[0]}</div>
                      <div className="flex-1">
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.subject}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* PAYMENTS */}
          {tab === "payments" && (
            <motion.div key="pa" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="font-bold text-lg">To'lovlar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Payme", icon: "💳", color: "bg-blue-500/10 text-blue-500" },
                  { label: "Click", icon: "⚡", color: "bg-green-500/10 text-green-500" },
                  { label: "Naqd", icon: "💵", color: "bg-yellow-500/10 text-yellow-500" },
                ].map((p, i) => (
                  <div key={i} className="card-elevated rounded-xl p-5 border border-border/40 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${p.color}`}>{p.icon}</div>
                    <p className="font-semibold">{p.label}</p>
                  </div>
                ))}
              </div>
              <div className="card-elevated rounded-xl p-8 text-center text-muted-foreground border border-border/40">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Hali to'lovlar yo'q</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
