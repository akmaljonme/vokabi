import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { AppLayout } from "@/components/AppLayout";
import {
  Users, ClipboardList, BarChart3, Plus, Loader2,
  Send, Copy, Check, Trash2, Clock, BookOpen,
  Trophy, TrendingUp, CheckCircle2, XCircle, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

type Tab = "classes" | "assignments" | "students" | "stats";

export default function TeacherPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>("classes");
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [teacherJoinCode, setTeacherJoinCode] = useState(searchParams.get("code") || "");
  const [teacherJoining, setTeacherJoining] = useState(false);
  const [teacherJoinError, setTeacherJoinError] = useState("");
  const [autoJoinTried, setAutoJoinTried] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  // New assignment form
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskSkill, setTaskSkill] = useState("grammar");
  const [taskDue, setTaskDue] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) fetchTeacherData();
    else setLoading(false);
  }, [user]);

  // URL da ?code=... bo'lsa avtomatik qo'shilamiz
  useEffect(() => {
    const code = searchParams.get("code");
    if (code && user && !loading && !teacherData && !autoJoinTried && !teacherJoining) {
      setTeacherJoinCode(code.toUpperCase());
      setAutoJoinTried(true);
      setTimeout(() => joinAsTeacherWithCode(code.toUpperCase()), 50);
    }
  }, [searchParams, user, loading, teacherData, autoJoinTried, teacherJoining]);

  // Login qilmagan bo'lsa — kodni saqlab, register'ga yo'naltiramiz
  useEffect(() => {
    const code = searchParams.get("code");
    if (!loading && !user && code) {
      sessionStorage.setItem("pending_teacher_code", code.toUpperCase());
      navigate(`/register?teacher-code=${code.toUpperCase()}`, { replace: true });
    }
  }, [user, loading, searchParams, navigate]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      // Find teacher record
      const { data: teacher } = await supabase
        .from("school_teachers")
        .select("*, schools(name)")
        .eq("user_id", user?.id)
        .limit(1);

      if (teacher?.length) {
        setTeacherData(teacher[0]);
        await fetchClasses(teacher[0].school_id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchClasses = async (schoolId: string) => {
    const { data } = await supabase
      .from("school_classes")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    setClasses(data || []);
    if (data?.length) selectClass(data[0]);
  };

  const selectClass = async (cls: any) => {
    setSelectedClass(cls);
    // Fetch students
    const { data: studs } = await supabase
      .from("school_students")
      .select("user_id, joined_at")
      .eq("class_id", cls.id);

    if (studs?.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, xp, streak, current_level")
        .in("user_id", studs.map((s: any) => s.user_id));

      // Fetch test results for each student
      const withResults = await Promise.all((profiles || []).map(async (p: any) => {
        const { count } = await supabase
          .from("test_results")
          .select("*", { count: "exact", head: true })
          .eq("user_id", p.user_id);
        return { ...p, testCount: count || 0 };
      }));
      setStudents(withResults.sort((a, b) => (b.xp || 0) - (a.xp || 0)));
    } else {
      setStudents([]);
    }

    // Fetch assignments
    const { data: asgn } = await supabase
      .from("school_assignments")
      .select("*")
      .eq("class_id", cls.id)
      .order("created_at", { ascending: false });
    setAssignments(asgn || []);
  };

  const createAssignment = async () => {
    if (!taskTitle.trim() || !selectedClass) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("school_assignments")
        .insert({
          class_id: selectedClass.id,
          title: taskTitle,
          description: taskDesc,
          skill: taskSkill,
          due_date: taskDue || null,
        })
        .select()
        .single();

      if (error) throw error;
      setAssignments(prev => [data, ...prev]);
      setTaskTitle(""); setTaskDesc(""); setTaskDue("");
      setShowNewTask(false);
      toast.success("Vazifa yaratildi! ✅");
    } catch (e: any) {
      toast.error("Xatolik: " + e.message);
    } finally { setCreating(false); }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Vazifani o'chirmoqchimisiz?")) return;
    await supabase.from("school_assignments").delete().eq("id", id);
    setAssignments(prev => prev.filter(a => a.id !== id));
    toast.info("Vazifa o'chirildi");
  };

  const copyInviteLink = (cls: any) => {
    const link = `${window.location.origin}/school/student?class=${cls.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(cls.id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Invite havola nusxa olindi! 🔗");
  };

  const joinAsTeacherWithCode = async (rawCode: string) => {
    if (!rawCode.trim() || !user) return;
    setTeacherJoining(true); setTeacherJoinError("");
    try {
      const { data, error } = await supabase.rpc("join_school_as_teacher", {
        p_invite_code: rawCode.trim().toUpperCase(),
      });

      if (error) throw error;
      if (!data?.success) {
        setTeacherJoinError(data?.error || "Xatolik yuz berdi.");
        return;
      }

      sessionStorage.removeItem("pending_teacher_code");
      toast.success("Maktabga o'qituvchi sifatida qo'shildingiz! 🎉");
      await fetchTeacherData();
    } catch (e: any) {
      setTeacherJoinError(e.message || "Xatolik yuz berdi.");
    } finally {
      setTeacherJoining(false);
    }
  };

  const joinAsTeacher = () => joinAsTeacherWithCode(teacherJoinCode);

  const shareViaTelegram = (cls: any) => {
    const link = `${window.location.origin}/register?class=${cls.invite_code}`;
    const text = `📚 ${teacherData?.schools?.name} — ${cls.name} sinfiga qo'shiling!\n\nVokabi platformasida ingliz tilini o'rganing 🚀\n\n🔗 ${link}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  if (!user) { navigate("/login"); return null; }

  if (!teacherData) return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">👨‍🏫</div>
        <h1 className="text-2xl font-bold mb-2">O'qituvchi hisobi topilmadi</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Maktab admini bergan taklif kodini kiriting, shunda avtomatik
          o'qituvchi sifatida qo'shilasiz.
        </p>

        <div className="space-y-3 mb-8">
          <input
            value={teacherJoinCode}
            onChange={e => setTeacherJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && joinAsTeacher()}
            placeholder="Taklif kod (masalan: ABC123)"
            className="w-full px-4 py-4 rounded-2xl border-2 border-border bg-background text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase"
          />

          {teacherJoinError && (
            <p className="text-sm text-destructive font-medium">{teacherJoinError}</p>
          )}

          <button onClick={joinAsTeacher} disabled={teacherJoining || !teacherJoinCode.trim()}
            className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {teacherJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : "O'qituvchi sifatida qo'shilish"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-3">yoki o'zingiz maktab yaratmoqchimisiz?</p>
        <button onClick={() => navigate("/school/admin")} className="text-sm text-primary font-semibold hover:underline">
          Admin panelga o'tish
        </button>
      </div>
    </AppLayout>
  );

  const tabs = [
    { id: "classes", label: "Sinflar", icon: BookOpen },
    { id: "students", label: "O'quvchilar", icon: Users },
    { id: "assignments", label: "Vazifalar", icon: ClipboardList },
    { id: "stats", label: "Statistika", icon: BarChart3 },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold mb-1">O'qituvchi paneli</h1>
            <p className="text-sm text-muted-foreground">
              {teacherData?.schools?.name} · {teacherData?.subject || "Ingliz tili"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{students.length} o'quvchi</span>
          </div>
        </div>

        {/* Class selector */}
        {classes.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {classes.map(cls => (
              <button key={cls.id} onClick={() => selectClass(cls)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedClass?.id === cls.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}>
                {cls.name}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-2xl mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* CLASSES */}
          {tab === "classes" && (
            <motion.div key="cl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {classes.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Hali sinf yo'q</p>
                </div>
              ) : (
                classes.map((cls, i) => (
                  <motion.div key={cls.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold">{cls.name}</h3>
                        <p className="text-xs text-muted-foreground">{cls.level} daraja</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-lg bg-muted font-mono font-bold">{cls.invite_code}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: "O'quvchi", value: students.length },
                        { label: "Vazifa", value: assignments.length },
                        { label: "Faol bugun", value: "—" },
                      ].map((s, j) => (
                        <div key={j} className="text-center p-2 rounded-xl bg-muted/50">
                          <p className="font-black text-lg text-primary">{s.value}</p>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => copyInviteLink(cls)}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border hover:border-primary/40 text-xs font-semibold transition-all">
                        {copied === cls.id ? <><Check className="w-3 h-3 text-green-500" /> Nusxa!</> : <><Copy className="w-3 h-3" /> Invite link</>}
                      </button>
                      <button onClick={() => shareViaTelegram(cls)}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white"
                        style={{ background: "linear-gradient(135deg,#2AABEE,#229ED9)" }}>
                        <Send className="w-3 h-3" /> Telegram
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* STUDENTS */}
          {tab === "students" && (
            <motion.div key="st" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {students.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium mb-1">Hali o'quvchi yo'q</p>
                  <p className="text-xs">Invite havolani yuboring</p>
                  <button onClick={() => setTab("classes")} className="mt-4 btn-primary text-sm px-4 py-2">
                    Invite link olish
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((s, i) => (
                    <motion.div key={s.user_id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground"
                      }`}>{i + 1}</span>
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                        {(s.full_name || s.username || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{s.full_name || s.username || "Foydalanuvchi"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{s.current_level || "A1"}</span>
                          <span>·</span>
                          <span>🔥 {s.streak || 0} kun</span>
                          <span>·</span>
                          <span>{s.testCount} test</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-primary text-sm">{(s.xp || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ASSIGNMENTS */}
          {tab === "assignments" && (
            <motion.div key="as" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold">Vazifalar ({assignments.length})</h2>
                <button onClick={() => setShowNewTask(s => !s)} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Yangi vazifa
                </button>
              </div>

              <AnimatePresence>
                {showNewTask && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 space-y-3">
                    <h3 className="font-bold text-sm">Yangi vazifa yaratish</h3>
                    <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                      placeholder="Vazifa nomi (masalan: B2 Grammar Test)"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)}
                      placeholder="Qo'shimcha tavsif (ixtiyoriy)"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={taskSkill} onChange={e => setTaskSkill(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none">
                        {["grammar", "reading", "listening", "writing", "speaking", "vocabulary"].map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={createAssignment} disabled={creating || !taskTitle.trim()}
                        className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Yaratish</>}
                      </button>
                      <button onClick={() => setShowNewTask(false)} className="btn-outline flex-1 py-3 text-sm">Bekor</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {assignments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Hali vazifa berilmagan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((a, i) => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{a.title}</p>
                        {a.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.description}</p>}
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          {a.skill && <span className="px-2 py-0.5 rounded-full bg-muted font-medium capitalize">{a.skill}</span>}
                          {a.due_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(a.due_date).toLocaleDateString("uz")}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteAssignment(a.id)}
                        className="p-2 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STATS */}
          {tab === "stats" && (
            <motion.div key="stats" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "O'quvchilar", value: students.length, icon: "👨‍🎓", color: "text-blue-500" },
                  { label: "Vazifalar", value: assignments.length, icon: "📋", color: "text-purple-500" },
                  { label: "O'rt. XP", value: students.length ? Math.round(students.reduce((s, u) => s + (u.xp || 0), 0) / students.length).toLocaleString() : "0", icon: "⚡", color: "text-primary" },
                  { label: "O'rt. Streak", value: students.length ? Math.round(students.reduce((s, u) => s + (u.streak || 0), 0) / students.length) + " kun" : "0", icon: "🔥", color: "text-amber-500" },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-4 text-center">
                    <p className="text-2xl mb-1">{s.icon}</p>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Top students in class */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> Sinf reytingi
                </h3>
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Hali o'quvchi yo'q</p>
                ) : (
                  <div className="space-y-2">
                    {students.slice(0, 10).map((s, i) => (
                      <div key={s.user_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground"
                        }`}>{i + 1}</span>
                        <p className="flex-1 text-sm font-medium truncate">{s.full_name || s.username || "Foydalanuvchi"}</p>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-primary">{(s.xp || 0).toLocaleString()} XP</p>
                          <p className="text-xs text-muted-foreground">{s.testCount} test</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
