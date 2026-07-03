import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { AppLayout } from "@/components/AppLayout";
import {
  Flame, Star, Target, ClipboardList, Trophy, Users,
  ArrowRight, CheckCircle2, Clock, Loader2, BookOpen,
  TrendingUp, Zap, GraduationCap, LogOut
} from "lucide-react";
import { toast } from "sonner";

export default function StudentPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [student, setStudent] = useState<any>(null);
  const [cls, setCls] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classmates, setClassmates] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [joinCode, setJoinCode] = useState(searchParams.get("class") || "");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "assignments" | "classmates">("overview");
  const [autoJoinTried, setAutoJoinTried] = useState(false);

  useEffect(() => {
    if (user) fetchStudent();
    else setLoading(false);
  }, [user]);

  // Auto-join if class param in URL — real qo'shilish, faqat pre-fill emas
  useEffect(() => {
    const classCode = searchParams.get("class");
    if (classCode && user && !student && !loading && !autoJoinTried && !joining) {
      setJoinCode(classCode.toUpperCase());
      setAutoJoinTried(true);
      // kichik tayimer — state yangilanishi uchun
      setTimeout(() => joinClassWithCode(classCode.toUpperCase()), 50);
    }
  }, [searchParams, user, student, loading, autoJoinTried, joining]);

  // Login qilmagan bo'lsa — invite kodni saqlab, login sahifaga yo'naltiramiz
  useEffect(() => {
    const classCode = searchParams.get("class");
    if (!loading && !user && classCode) {
      sessionStorage.setItem("pending_class_code", classCode.toUpperCase());
      navigate(`/register?class=${classCode.toUpperCase()}`, { replace: true });
    }
  }, [user, loading, searchParams, navigate]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      // Check if already in a class
      const { data: studentData } = await supabase
        .from("school_students")
        .select("*")
        .eq("user_id", user?.id)
        .limit(1);

      if (studentData && studentData.length > 0) {
        const s = studentData[0];
        setStudent(s);

        // Fetch class
        const { data: classData } = await supabase
          .from("school_classes")
          .select("*")
          .eq("id", s.class_id)
          .single();
        if (classData) {
          setCls(classData);

          // Fetch school
          const { data: schoolData } = await supabase
            .from("schools")
            .select("name, plan")
            .eq("id", classData.school_id)
            .single();
          if (schoolData) setSchool(schoolData);

          // Fetch assignments
          const { data: asgn } = await supabase
            .from("school_assignments")
            .select("*")
            .eq("class_id", s.class_id)
            .order("created_at", { ascending: false });
          setAssignments(asgn || []);

          // Fetch classmates with profiles
          const { data: cm } = await supabase
            .from("school_students")
            .select("user_id, joined_at")
            .eq("class_id", s.class_id);

          if (cm?.length) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id, full_name, username, xp, streak")
              .in("user_id", cm.map((c: any) => c.user_id));
            setClassmates((profiles || []).sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0)));
          }
        }

        // Fetch own profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, username, xp, streak, current_level")
          .eq("user_id", user?.id)
          .single();
        setMyProfile(profile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const joinClassWithCode = async (rawCode: string) => {
    if (!rawCode.trim() || !user) return;
    setJoining(true); setJoinError("");
    try {
      const code = rawCode.trim().toUpperCase();
      const { data, error } = await supabase.rpc("join_school_class_by_code", {
        p_invite_code: code,
      });
      if (error) throw error;
      if (!data?.success) {
        setJoinError(data?.error || "Xatolik yuz berdi.");
        return;
      }
      sessionStorage.removeItem("pending_class_code");
      toast.success("Sinfga muvaffaqiyatli qo'shildingiz! 🎉");
      await fetchStudent();
    } catch (e: any) {
      setJoinError(e.message || "Xatolik yuz berdi.");
    } finally {
      setJoining(false);
    }
  };

  const joinClass = () => joinClassWithCode(joinCode);

  const leaveClass = async () => {
    if (!student || !confirm("Sinfdan chiqmoqchimisiz?")) return;
    await supabase.from("school_students").delete().eq("id", student.id);
    setStudent(null); setCls(null); setSchool(null);
    toast.info("Sinfdan chiqdingiz.");
  };

  const myRank = classmates.findIndex((c: any) => c.user_id === user?.id) + 1;

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );

  if (!user) { navigate("/login"); return null; }

  // NOT IN CLASS YET
  if (!student) return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Sinfga qo'shiling</h1>
          <p className="text-muted-foreground mb-8 text-sm">O'qituvchingiz bergan invite kodni kiriting</p>

          <div className="space-y-3">
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && joinClass()}
              placeholder="Invite kod (masalan: ABC123)"
              className="w-full px-4 py-4 rounded-2xl border-2 border-border bg-background text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase"
            />

            {joinError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-sm text-destructive font-medium">{joinError}</motion.p>
            )}

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={joinClass} disabled={joining || !joinCode.trim()}
              className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Sinfga qo'shilish</>}
            </motion.button>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-muted/50 text-left">
            <p className="text-sm font-semibold mb-2">📌 Qanday qo'shilish mumkin?</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>O'qituvchingizdan invite kod oling</li>
              <li>Kodni yuqoriga kiriting</li>
              <li>Sinfga avtomatik qo'shilasiz</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );

  // IN CLASS
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{school?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{cls?.level}</span>
            </div>
            <h1 className="text-2xl font-display font-bold">{cls?.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {classmates.length} o'quvchi · Siz #{myRank} o'rinda
            </p>
          </div>
          <button onClick={leaveClass}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Chiqish
          </button>
        </div>

        {/* My stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "XP", value: (myProfile?.xp || 0).toLocaleString(), icon: "⚡", color: "text-primary" },
            { label: "Daraja", value: myProfile?.current_level || "A1", icon: "📊", color: "text-blue-500" },
            { label: "Streak", value: `${myProfile?.streak || 0} kun`, icon: "🔥", color: "text-amber-500" },
            { label: "Reyting", value: myRank ? `#${myRank}` : "—", icon: "🏆", color: "text-green-500" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4 border border-border bg-card text-center">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-2xl mb-6">
          {[
            { id: "overview", label: "Umumiy", icon: Target },
            { id: "assignments", label: "Vazifalar", icon: ClipboardList },
            { id: "classmates", label: "Sinfdoshlar", icon: Users },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <motion.div key="ov" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => navigate("/practice")}
                  className="rounded-2xl p-5 border-2 border-primary/20 bg-primary/5 hover:border-primary/40 transition-all text-left group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-xl">📝</div>
                    <div>
                      <p className="font-bold text-sm">Test topshirish</p>
                      <p className="text-xs text-muted-foreground">XP va daraja oshiring</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
                <button onClick={() => navigate("/games")}
                  className="rounded-2xl p-5 border-2 border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-all text-left group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-xl">🎮</div>
                    <div>
                      <p className="font-bold text-sm">O'yin o'ynash</p>
                      <p className="text-xs text-muted-foreground">21+ interaktiv o'yin</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
                <button onClick={() => navigate("/articles")}
                  className="rounded-2xl p-5 border-2 border-green-500/20 bg-green-500/5 hover:border-green-500/40 transition-all text-left group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-xl">📖</div>
                    <div>
                      <p className="font-bold text-sm">Maqola o'qish</p>
                      <p className="text-xs text-muted-foreground">Reading ko'nikmasini oshiring</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-green-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
                <button onClick={() => setTab("assignments")}
                  className="rounded-2xl p-5 border-2 border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 transition-all text-left group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-xl">📋</div>
                    <div>
                      <p className="font-bold text-sm">Vazifalar</p>
                      <p className="text-xs text-muted-foreground">{assignments.filter(a => !a.completed).length} ta kutilmoqda</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              </div>

              {/* Class invite code */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm font-semibold mb-2 text-muted-foreground">Sinf invite kodi</p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 text-2xl font-black tracking-widest text-primary">{cls?.invite_code}</code>
                  <button onClick={() => {
                    navigator.clipboard.writeText(cls?.invite_code);
                    toast.success("Kod nusxa olindi!");
                  }} className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 font-semibold transition-colors">
                    Nusxa
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Do'stlaringizga bu kodni yuboring</p>
              </div>
            </motion.div>
          )}

          {/* ASSIGNMENTS */}
          {tab === "assignments" && (
            <motion.div key="as" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {assignments.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium mb-1">Hali vazifa yo'q</p>
                  <p className="text-xs">O'qituvchingiz vazifa berganda bu yerda ko'rinadi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((a, i) => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className={`rounded-2xl p-5 border transition-all ${a.completed ? "border-green-500/30 bg-green-500/5" : "border-border bg-card hover:border-primary/30"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${a.completed ? "bg-green-500/15" : "bg-primary/10"}`}>
                          {a.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <ClipboardList className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{a.title}</h3>
                          {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {a.due_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(a.due_date).toLocaleDateString("uz")}</span>}
                            {a.skill && <span className="px-2 py-0.5 rounded-full bg-muted font-medium">{a.skill}</span>}
                          </div>
                        </div>
                        {!a.completed && (
                          <button onClick={() => navigate("/practice")} className="btn-primary text-xs px-3 py-1.5 shrink-0">
                            Boshlash
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* CLASSMATES */}
          {tab === "classmates" && (
            <motion.div key="cm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="space-y-2">
                {classmates.map((c, i) => {
                  const isMe = c.user_id === user?.id;
                  return (
                    <motion.div key={c.user_id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isMe ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground"
                      }`}>{i + 1}</span>
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                        {(c.full_name || c.username || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {c.full_name || c.username || "Foydalanuvchi"}
                          {isMe && <span className="ml-2 text-xs text-primary font-bold">(Siz)</span>}
                        </p>
                        <p className="text-xs text-amber-500">🔥 {c.streak || 0} kun streak</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-primary text-sm">{(c.xp || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
