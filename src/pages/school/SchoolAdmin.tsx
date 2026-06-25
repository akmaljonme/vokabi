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
  GraduationCap, Loader2, RefreshCw, TrendingUp,
  Trophy, Zap, Send, Link2, ExternalLink, ArrowUpRight
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

type Tab = "overview" | "teachers" | "classes" | "analytics" | "payments";

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
  const [inviteSent, setInviteSent] = useState<string | null>(null);

  const totalStudents = Object.values(studentCounts).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (user) {
      fetchSchool();
    } else if (!user) {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (tab === "analytics" && school) {
      fetchAnalytics(school.id);
    }
  }, [tab, school]);

  const fetchSchool = async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("owner_id", user?.id)
        .limit(1);

      if (error) {
        console.error("Schools fetch error:", error);
        setError("Jadval topilmadi. SQL da jadvallarni yarating.");
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setSchool(data[0]);
        await Promise.all([fetchTeachers(data[0].id), fetchClasses(data[0].id)]);
      }
    } catch (e: any) {
      console.error("fetchSchool error:", e);
      setError("Xatolik: " + (e?.message || "Noma'lum xato"));
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async (schoolId: string) => {
    const { data } = await supabase.from("school_teachers").select("*").eq("school_id", schoolId);
    setTeachers(data || []);
  };

  const fetchClasses = async (schoolId: string) => {
    const { data } = await supabase.from("school_classes").select("*").eq("school_id", schoolId);
    if (data) {
      setClasses(data);
      const counts: Record<string, number> = {};
      await Promise.all(data.map(async (cls: SchoolClass) => {
        const { count } = await supabase.from("school_students").select("*", { count: "exact", head: true }).eq("class_id", cls.id);
        counts[cls.id] = count || 0;
      }));
      setStudentCounts(counts);
    }
  };

  const createSchool = async () => {
    if (!schoolName.trim() || !user) return;
    setCreating(true);
    try {
      const slug = schoolName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36);
      const { data, error } = await supabase.from("schools").insert({
        name: schoolName, slug, owner_id: user.id,
        plan: "free", max_teachers: 3, max_students: 30,
      }).select().single();
      if (error) throw error;
      setSchool(data);
    } catch (e: any) {
      setError("Maktab yaratishda xato: " + e.message);
    } finally { setCreating(false); }
  };

  const createClass = async () => {
    if (!newClassName.trim() || !school) return;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase.from("school_classes").insert({
      school_id: school.id, name: newClassName, level: newClassLevel, invite_code: inviteCode,
    }).select().single();
    if (!error && data) {
      setClasses(prev => [...prev, { ...data, student_count: 0 }]);
      setStudentCounts(prev => ({ ...prev, [data.id]: 0 }));
      setNewClassName(""); setShowNewClass(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/register?class=${code}`;
    navigator.clipboard.writeText(link);
    setInviteSent(code);
    setTimeout(() => setInviteSent(null), 2000);
  };

  const shareViaTelegram = (cls: SchoolClass) => {
    const link = `${window.location.origin}/register?class=${cls.invite_code}`;
    const text = `📚 ${school?.name} — ${cls.name} sinfiga qo'shiling!\n\n🔗 ${link}\n\nVokabi platformasida ingliz tilini o'rganing!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [skillData, setSkillData] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchAnalytics = async (schoolId: string) => {
    setAnalyticsLoading(true);
    try {
      // Get all student user_ids in this school
      const { data: classIds } = await supabase
        .from("school_classes")
        .select("id")
        .eq("school_id", schoolId);

      if (!classIds?.length) { setAnalyticsLoading(false); return; }

      const { data: studentIds } = await supabase
        .from("school_students")
        .select("user_id")
        .in("class_id", classIds.map((c: any) => c.id));

      if (!studentIds?.length) { setAnalyticsLoading(false); return; }

      const userIds = studentIds.map((s: any) => s.user_id);

      // Weekly test data (last 7 days)
      const days = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0,0,0,0)).toISOString();
        const dayEnd = new Date(date.setHours(23,59,59,999)).toISOString();
        const { count } = await supabase
          .from("test_results")
          .select("*", { count: "exact", head: true })
          .in("user_id", userIds)
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd);
        weekData.push({ day: days[new Date(dayStart).getDay()], tests: count || 0, xp: (count || 0) * 38 });
      }
      setWeeklyData(weekData);

      // Skill breakdown from test_results
      const skills = ["reading", "grammar", "vocabulary", "speaking", "writing"];
      const colors = ["#6c47ff", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];
      const skillLabels: Record<string, string> = { reading: "Reading", grammar: "Grammar", vocabulary: "Vocabulary", speaking: "Speaking", writing: "Writing" };
      const skillStats = await Promise.all(skills.map(async (skill, i) => {
        const { data: results } = await supabase
          .from("test_results")
          .select("percentage")
          .in("user_id", userIds)
          .eq("skill", skill)
          .limit(50);
        const avg = results?.length
          ? Math.round(results.reduce((s: number, r: any) => s + (r.percentage || 0), 0) / results.length)
          : 0;
        return { name: skillLabels[skill], value: avg || 0, color: colors[i] };
      }));
      setSkillData(skillStats);

      // Top students by XP
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, xp, streak")
        .in("user_id", userIds)
        .order("xp", { ascending: false })
        .limit(5);

      // Match with class name
      const studentsWithClass = await Promise.all((profiles || []).map(async (p: any) => {
        const { data: sc } = await supabase
          .from("school_students")
          .select("class_id, school_classes(name)")
          .eq("user_id", p.user_id)
          .single();
        return {
          name: p.full_name || p.username || "Foydalanuvchi",
          xp: p.xp || 0,
          streak: p.streak || 0,
          class: (sc as any)?.school_classes?.name || "—",
        };
      }));
      setTopStudents(studentsWithClass);
    } catch (e) {
      console.error("Analytics error:", e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Umumiy", icon: BarChart3 },
    { id: "classes", label: "Sinflar", icon: BookOpen },
    { id: "teachers", label: "O'qituvchilar", icon: GraduationCap },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "payments", label: "To'lovlar", icon: CreditCard },
  ];

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  if (!user) {
    navigate("/login");
    return null;
  }

  if (!school) return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <SchoolIcon className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-3">Maktab/Kurs yarating</h1>
          <p className="text-muted-foreground mb-8">O'quvchilaringizni boshqarish uchun avval tashkilotingizni ro'yxatdan o'tkazing.</p>
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm mb-5 border border-destructive/20">{error}</div>}
          <div className="flex gap-3">
            <input value={schoolName} onChange={e => setSchoolName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createSchool()}
              placeholder="Maktab / O'quv markaz nomi"
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={createSchool} disabled={creating || !schoolName.trim()} className="btn-primary px-5 py-3 text-sm disabled:opacity-50 flex items-center gap-2">
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <SchoolIcon className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold">{school.name}</h1>
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 font-bold capitalize">{school.plan}</span>
            </div>
            <p className="text-sm text-muted-foreground ml-13">
              {teachers.length} o'qituvchi · {classes.length} sinf · {totalStudents} o'quvchi
            </p>
          </div>
          <button onClick={fetchSchool} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-2xl mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* OVERVIEW */}
          {tab === "overview" && (
            <motion.div key="ov" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Jami o'quvchilar", value: totalStudents, icon: "👨‍🎓", color: "text-blue-500", bg: "bg-blue-500/10", trend: "+12%" },
                  { label: "Faol sinflar", value: classes.length, icon: "📚", color: "text-green-500", bg: "bg-green-500/10", trend: "+2" },
                  { label: "O'qituvchilar", value: teachers.length, icon: "👨‍🏫", color: "text-purple-500", bg: "bg-purple-500/10", trend: null },
                  { label: "Bu hafta testlar", value: "118", icon: "✅", color: "text-amber-500", bg: "bg-amber-500/10", trend: "+23%" },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="rounded-2xl p-5 border border-border bg-card hover:border-primary/20 transition-all">
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center text-lg mb-3`}>{s.icon}</div>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    {s.trend && <p className="text-xs text-green-500 font-semibold mt-1 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{s.trend}</p>}
                  </motion.div>
                ))}
              </div>

              {/* Weekly chart */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Haftalik faollik
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                    <Bar dataKey="tests" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="Testlar" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Sinf yaratish", icon: Plus, action: () => { setTab("classes"); setShowNewClass(true); }, color: "bg-blue-500/10 text-blue-500" },
                  { label: "O'qituvchi invite", icon: Send, action: () => setTab("teachers"), color: "bg-purple-500/10 text-purple-500" },
                  { label: "Analytics ko'rish", icon: BarChart3, action: () => setTab("analytics"), color: "bg-green-500/10 text-green-500" },
                ].map((a, i) => (
                  <button key={i} onClick={a.action}
                    className="rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 border border-border bg-card transition-all text-left">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                      <a.icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-sm">{a.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>

              {/* Recent classes */}
              {classes.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Sinflar holati</h3>
                    <button onClick={() => setTab("classes")} className="text-xs text-primary hover:underline">Barchasi →</button>
                  </div>
                  <div className="space-y-3">
                    {classes.slice(0, 4).map((cls) => (
                      <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{cls.level}</div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{cls.name}</p>
                          <p className="text-xs text-muted-foreground">{studentCounts[cls.id] || 0} o'quvchi</p>
                        </div>
                        <button onClick={() => copyInviteLink(cls.invite_code)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                          {inviteSent === cls.invite_code ? <><Check className="w-3 h-3 text-green-500" /> Nusxa!</> : <><Link2 className="w-3 h-3" /> Invite</>}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* CLASSES */}
          {tab === "classes" && (
            <motion.div key="cl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">Sinflar ({classes.length}/{school.max_students > 999 ? "∞" : school.max_students})</h2>
                <button onClick={() => setShowNewClass(s => !s)} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Sinf yaratish
                </button>
              </div>

              <AnimatePresence>
                {showNewClass && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="rounded-2xl p-4 border-2 border-primary/20 bg-primary/5 flex gap-3 flex-wrap">
                    <input value={newClassName} onChange={e => setNewClassName(e.target.value)}
                      placeholder="Sinf nomi (masalan: 9-A ingliz tili)"
                      className="flex-1 min-w-40 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <select value={newClassLevel} onChange={e => setNewClassLevel(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none">
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
                  <p className="font-medium mb-1">Hali sinf yaratilmagan</p>
                  <p className="text-xs">Yuqoridagi tugmani bosing</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((cls, i) => (
                    <motion.div key={cls.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="rounded-2xl p-5 border border-border bg-card hover:border-primary/30 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold">{cls.name}</h3>
                          <span className="text-xs text-muted-foreground">{cls.level} daraja</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-lg bg-muted font-mono font-bold">{cls.invite_code}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{studentCounts[cls.id] || 0} o'quvchi</span>
                      </div>
                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => copyInviteLink(cls.invite_code)}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/50 text-xs font-semibold transition-all">
                          {inviteSent === cls.invite_code ? <><Check className="w-3 h-3 text-green-500" /> Nusxa!</> : <><Link2 className="w-3 h-3" /> Invite link</>}
                        </button>
                        <button onClick={() => shareViaTelegram(cls)}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                          style={{ background: "linear-gradient(135deg,#2AABEE,#229ED9)" }}>
                          <Send className="w-3 h-3" /> Telegram
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
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">O'qituvchilar ({teachers.length}/{school.max_teachers})</h2>
                <button onClick={() => {
                  const link = `${window.location.origin}/register?school=${school.id}&role=teacher`;
                  navigator.clipboard.writeText(link);
                  alert("O'qituvchi invite havolasi nusxa olindi!");
                }} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Invite link
                </button>
              </div>

              {/* Invite card */}
              <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center bg-muted/20">
                <GraduationCap className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="font-semibold mb-1">O'qituvchi qo'shish</p>
                <p className="text-sm text-muted-foreground mb-4">Invite havolasini yuboring — o'qituvchi ro'yxatdan o'tib avtomatik qo'shiladi</p>
                <div className="flex gap-2 max-w-sm mx-auto">
                  <input readOnly value={`${window.location.origin}/register?school=${school.id}&role=teacher`}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-border bg-background font-mono truncate" />
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/register?school=${school.id}&role=teacher`);
                    setCopied("teacher");
                    setTimeout(() => setCopied(null), 2000);
                  }} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                    {copied === "teacher" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {teachers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Hali o'qituvchi qo'shilmagan</div>
              ) : (
                <div className="space-y-3">
                  {teachers.map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="rounded-xl p-4 flex items-center gap-4 border border-border bg-card">
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-sm">{t.name?.[0] || "?"}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.subject}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 font-semibold">Faol</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ANALYTICS */}
          {tab === "analytics" && (
            <motion.div key="an" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {analyticsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
                </div>
              ) : (
              <>
              {/* XP trend */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold mb-1">Haftalik test faolligi</h3>
                <p className="text-xs text-muted-foreground mb-4">O'quvchilar topshirgan testlar soni</p>
                {weeklyData.length === 0 || weeklyData.every(d => d.tests === 0) ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Hali test natijalari yo'q</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                      <Line type="monotone" dataKey="tests" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} name="Testlar" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Skill breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-bold mb-4">Ko'nikmalar bo'yicha o'rtacha ball</h3>
                  {skillData.every(s => s.value === 0) ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Hali test natijalari yo'q</div>
                  ) : (
                    <div className="space-y-3">
                      {skillData.map((s) => (
                        <div key={s.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{s.name}</span>
                            <span className="font-bold" style={{ color: s.color }}>{s.value}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${s.value}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                              className="h-full rounded-full" style={{ background: s.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-bold mb-4">Ko'nikmalar taqsimoti</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={skillData.filter(s => s.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                        {skillData.filter(s => s.value > 0).map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skillData.map(s => (
                      <div key={s.name} className="flex items-center gap-1 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                        {s.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top students */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Top o'quvchilar</h3>
                {analyticsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : topStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Hali ma'lumot yo'q</div>
                ) : (
                  <div className="space-y-2">
                    {topStudents.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground"}`}>{i+1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.class}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{s.xp.toLocaleString()} XP</p>
                          <p className="text-xs text-amber-500">🔥 {s.streak} kun</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </>)}
            </motion.div>
          )}

          {/* PAYMENTS */}
          {tab === "payments" && (
            <motion.div key="pa" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <h2 className="font-bold text-lg">To'lovlar va obuna</h2>

              {/* Current plan */}
              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Joriy reja</p>
                    <p className="text-2xl font-black capitalize">{school.plan}</p>
                    <p className="text-sm text-muted-foreground mt-1">{school.max_students} o'quvchi · {school.max_teachers} o'qituvchi</p>
                  </div>
                  <button className="btn-primary text-sm px-4 py-2">Rejani yangilash</button>
                </div>
              </div>

              {/* Plans */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: "Starter", price: "199,000", students: 30, teachers: 3, color: "border-border" },
                  { name: "Pro", price: "499,000", students: 100, teachers: 10, color: "border-primary", badge: true },
                  { name: "Academy", price: "999,000", students: 999, teachers: 999, color: "border-border" },
                ].map((p, i) => (
                  <div key={i} className={`rounded-2xl border-2 ${p.color} bg-card p-5 relative`}>
                    {p.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">Eng yaxshi</span>}
                    <p className="font-black text-base mb-1">{p.name}</p>
                    <p className="text-xl font-black mb-3">{p.price} <span className="text-xs font-normal text-muted-foreground">so'm/oy</span></p>
                    <p className="text-xs text-muted-foreground mb-3">{p.students < 999 ? `${p.students} o'quvchi` : "Cheksiz"} · {p.teachers < 999 ? `${p.teachers} o'qituvchi` : "Cheksiz"}</p>
                    <button className={`w-full py-2.5 rounded-xl text-sm font-bold ${p.badge ? "btn-primary" : "border border-border hover:border-primary/40 transition-all"}`}>
                      {school.plan === p.name.toLowerCase() ? "Joriy reja" : "Tanlash"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Payment methods */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-bold mb-4">To'lov usullari</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: "Payme", icon: "💳", color: "bg-blue-500/10 text-blue-600" },
                    { name: "Click", icon: "⚡", color: "bg-green-500/10 text-green-600" },
                    { name: "Bank o'tkazmasi", icon: "🏦", color: "bg-amber-500/10 text-amber-600" },
                  ].map((pm, i) => (
                    <div key={i} className="rounded-xl border border-border p-4 flex flex-col items-center gap-2 text-center">
                      <div className={`w-10 h-10 rounded-xl ${pm.color} flex items-center justify-center text-xl`}>{pm.icon}</div>
                      <p className="text-xs font-semibold">{pm.name}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">To'lov haqida: <a href="mailto:support@vokabi.uz" className="text-primary hover:underline">support@vokabi.uz</a></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
