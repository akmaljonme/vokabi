import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import type { SchoolClass, SchoolStudent, Assignment } from "@/types/school";
import { Flame, Star, Target, ClipboardList, Trophy, Users, ArrowRight, CheckCircle2, Clock, Zap } from "lucide-react";

export default function StudentPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<SchoolStudent | null>(null);
  const [cls, setCls] = useState<SchoolClass | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classmates, setClassmates] = useState<SchoolStudent[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState(localStorage.getItem("student_goal") || "");
  const [goalEdit, setGoalEdit] = useState(false);

  useEffect(() => { if (user) fetchStudent(); }, [user]);

  const fetchStudent = async () => {
    setLoading(true);
    const { data } = await (supabase.from("school_students") as any)
      .select("*").eq("user_id", user?.id).single();
    if (data) {
      setStudent(data);
      const { data: classData } = await (supabase.from("school_classes") as any).select("*").eq("id", data.class_id).single();
      if (classData) setCls(classData);
      const { data: asgn } = await (supabase.from("school_assignments") as any).select("*").eq("class_id", data.class_id).order("created_at", { ascending: false });
      if (asgn) setAssignments(asgn);
      const { data: cm } = await (supabase.from("school_students") as any).select("*").eq("class_id", data.class_id).order("xp", { ascending: false });
      if (cm) setClassmates(cm);
    }
    setLoading(false);
  };

  const joinClass = async () => {
    if (!joinCode.trim()) return;
    setJoining(true); setJoinError("");
    const { data: classData } = await (supabase.from("school_classes") as any).select("*").eq("invite_code", joinCode.trim().toUpperCase()).single();
    if (!classData) { setJoinError("Noto'g'ri kod. Qayta tekshiring."); setJoining(false); return; }
    const { data: profile } = await (supabase.from("profiles") as any).select("full_name").eq("user_id", user?.id).single();
    const { data, error } = await (supabase.from("school_students") as any)
      .insert({ class_id: classData.id, user_id: user?.id, full_name: profile?.full_name || user?.email?.split("@")[0] })
      .select().single();
    if (error) { setJoinError("Sinf topilmadi yoki allaqachon a'zosiz."); }
    else { setStudent(data); fetchStudent(); }
    setJoining(false);
  };

  const myRank = classmates.findIndex(s => s.user_id === user?.id) + 1;

  const typeColors: Record<string, string> = {
    test: "text-blue-500", essay: "text-purple-500", game: "text-green-500", vocabulary: "text-yellow-500",
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;

  // Not joined
  if (!student) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-6xl mb-5">👨‍🎓</div>
          <h1 className="text-3xl font-display font-bold mb-3">Sinfga qo'shiling</h1>
          <p className="text-muted-foreground mb-8">O'qituvchingizdan taklif kodini oling va sinfga qo'shiling</p>
          <div className="flex gap-3 mb-3">
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && joinClass()}
              placeholder="Taklif kodi (masalan: A1B2C3D4)"
              maxLength={8}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {joinError && <p className="text-red-500 text-sm mb-3">{joinError}</p>}
          <button onClick={joinClass} disabled={joining || !joinCode.trim()} className="w-full btn-primary py-3 font-semibold">
            {joining ? "Qo'shilmoqda..." : "Sinfga qo'shilish →"}
          </button>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Student header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="card-elevated rounded-2xl p-6 mb-6 border border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-2xl font-bold text-primary">
                {(student.full_name || "?")[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold">{student.full_name}</h1>
                <p className="text-sm text-muted-foreground">{cls?.name} · {cls?.level}</p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="text-center">
                <div className="flex items-center gap-1 text-orange-500 font-bold text-xl"><Flame className="w-5 h-5" />{student.streak}</div>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-primary font-bold text-xl"><Zap className="w-5 h-5" />{student.xp}</div>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-yellow-500 font-bold text-xl"><Trophy className="w-5 h-5" />#{myRank}</div>
                <p className="text-xs text-muted-foreground">Reyting</p>
              </div>
            </div>
          </div>

          {/* XP Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Daraja {Math.floor(student.xp / 1000) + 1}</span>
              <span>{student.xp % 1000} / 1000 XP</span>
            </div>
            <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(student.xp % 1000) / 10}%` }} transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
              />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: Assignments */}
          <div className="lg:col-span-2 space-y-4">
            {/* Goal */}
            <div className="card-elevated rounded-xl p-4 border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Maqsadim</h3>
                <button onClick={() => setGoalEdit(g => !g)} className="text-xs text-primary hover:opacity-70">{goalEdit ? "Saqlash" : "Tahrirlash"}</button>
              </div>
              {goalEdit ? (
                <input value={goal} onChange={e => { setGoal(e.target.value); localStorage.setItem("student_goal", e.target.value); }}
                  placeholder="Masalan: IELTS 7.0 olish"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{goal || "Maqsad qo'yilmagan..."}</p>
              )}
            </div>

            {/* Assignments */}
            <div>
              <h2 className="font-bold mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-primary" /> Vazifalar ({assignments.length})</h2>
              {assignments.length === 0 ? (
                <div className="card-elevated rounded-xl p-8 text-center text-muted-foreground border border-border/40">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Hali vazifa berilmagan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((a, i) => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="card-elevated rounded-xl p-4 border border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => a.type === "essay" ? navigate("/essay") : navigate("/games")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold ${typeColors[a.type]}`}>{a.type.toUpperCase()}</span>
                            {a.due_date && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(a.due_date).toLocaleDateString("uz-UZ")}</span>}
                          </div>
                          <p className="font-semibold text-sm">{a.title}</p>
                          {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Leaderboard */}
          <div>
            <h2 className="font-bold mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> Sinf reytingi</h2>
            <div className="space-y-2">
              {classmates.slice(0, 10).map((s, i) => {
                const isMe = s.user_id === user?.id;
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${isMe ? "border-primary/30 bg-primary/5" : "border-border/30"}`}
                  >
                    <span className="text-sm font-bold w-5 text-center text-muted-foreground">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                      {(s.full_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isMe ? "text-primary" : ""}`}>{s.full_name || "Nomsiz"}{isMe ? " (Siz)" : ""}</p>
                      <p className="text-[10px] text-muted-foreground">🔥{s.streak}</p>
                    </div>
                    <span className="text-xs font-bold text-primary">{s.xp}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
