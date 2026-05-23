import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { AppLayout } from "@/components/AppLayout";
import type { SchoolClass, SchoolStudent, Assignment } from "@/types/school";
import {
  Plus, Users, ClipboardList, BarChart3, Copy, Check,
  Send, Calendar, FileText, Trash2, ChevronRight,
  Star, TrendingUp, Award, Download, Loader2
} from "lucide-react";

type Tab = "classes" | "assignments" | "results";

export default function TeacherPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tab, setTab] = useState<Tab>("classes");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", level: "B1" });
  const [newAssignment, setNewAssignment] = useState({ title: "", description: "", type: "test" as Assignment["type"], due_date: "" });
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);

  useEffect(() => { if (user) fetchClasses(); }, [user]);
  useEffect(() => { if (selectedClass) { fetchStudents(selectedClass.id); fetchAssignments(selectedClass.id); } }, [selectedClass]);

  const fetchClasses = async () => {
    setLoading(true);
    // Get teacher record
    const { data: teacher } = await (supabase.from("school_teachers") as any).select("*").eq("user_id", user?.id).single();
    if (teacher) {
      const { data } = await (supabase.from("school_classes") as any).select("*").eq("teacher_id", teacher.id);
      if (data) { setClasses(data); if (data.length > 0) setSelectedClass(data[0]); }
    } else {
      // Check if user is school owner
      const { data: school } = await (supabase.from("schools") as any).select("*").eq("owner_id", user?.id).single();
      if (school) {
        const { data } = await (supabase.from("school_classes") as any).select("*").eq("school_id", school.id);
        if (data) { setClasses(data); if (data.length > 0) setSelectedClass(data[0]); }
      }
    }
    setLoading(false);
  };

  const fetchStudents = async (classId: string) => {
    const { data } = await (supabase.from("school_students") as any).select("*").eq("class_id", classId).order("xp", { ascending: false });
    if (data) setStudents(data);
  };

  const fetchAssignments = async (classId: string) => {
    const { data } = await (supabase.from("school_assignments") as any).select("*").eq("class_id", classId).order("created_at", { ascending: false });
    if (data) setAssignments(data);
  };

  const createClass = async () => {
    if (!newClass.name.trim()) return;
    const { data: school } = await (supabase.from("schools") as any).select("*").eq("owner_id", user?.id).single();
    const { data: teacher } = await (supabase.from("school_teachers") as any).select("*").eq("user_id", user?.id).single();
    const teacherId = teacher?.id;
    const schoolId = school?.id || teacher?.school_id;
    if (!schoolId) return;
    const { data } = await (supabase.from("school_classes") as any)
      .insert({ ...newClass, school_id: schoolId, ...(teacherId ? { teacher_id: teacherId } : {}) }).select().single();
    if (data) { setClasses(p => [data, ...p]); setSelectedClass(data); setShowCreateClass(false); setNewClass({ name: "", level: "B1" }); }
  };

  const createAssignment = async () => {
    if (!newAssignment.title.trim() || !selectedClass) return;
    const { data: teacher } = await (supabase.from("school_teachers") as any).select("*").eq("user_id", user?.id).single();
    const { data } = await (supabase.from("school_assignments") as any)
      .insert({ ...newAssignment, class_id: selectedClass.id, ...(teacher ? { teacher_id: teacher.id } : {}) }).select().single();
    if (data) { setAssignments(p => [data, ...p]); setShowCreateAssignment(false); setNewAssignment({ title: "", description: "", type: "test", due_date: "" }); }
  };

  const tabs = [
    { id: "classes", label: "Sinflar", icon: Users },
    { id: "assignments", label: "Vazifalar", icon: ClipboardList },
    { id: "results", label: "Natijalar", icon: BarChart3 },
  ] as const;

  const typeColors: Record<string, string> = {
    test: "bg-blue-500/10 text-blue-500",
    essay: "bg-purple-500/10 text-purple-500",
    game: "bg-green-500/10 text-green-500",
    vocabulary: "bg-yellow-500/10 text-yellow-500",
  };

  return (
    <AppLayout>
            <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">👨‍🏫 O'qituvchi Paneli</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{classes.length} ta sinf</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/school")} className="btn-outline px-4 py-2 text-sm">🏫 Admin Panel</button>
            <button onClick={() => setShowCreateClass(true)} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Sinf yaratish
            </button>
          </div>
        </div>

        {/* Create class modal */}
        <AnimatePresence>
          {showCreateClass && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="card-elevated rounded-2xl p-5 mb-5 border border-primary/20"
            >
              <h3 className="font-bold mb-4">Yangi sinf yaratish</h3>
              <div className="flex gap-3 flex-wrap">
                <input value={newClass.name} onChange={e => setNewClass(p => ({ ...p, name: e.target.value }))}
                  placeholder="Sinf nomi (masalan: 9A, Intermediate)"
                  className="flex-1 min-w-48 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select value={newClass.level} onChange={e => setNewClass(p => ({ ...p, level: e.target.value }))}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {["A1","A2","B1","B2","C1","C2"].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button onClick={createClass} className="btn-primary px-5 py-2.5 text-sm">Yaratish</button>
                <button onClick={() => setShowCreateClass(false)} className="btn-outline px-5 py-2.5 text-sm">Bekor</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Sidebar: class list */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sinflar</p>
            {classes.map(cls => (
              <button key={cls.id} onClick={() => setSelectedClass(cls)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedClass?.id === cls.id ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:border-primary/30 text-foreground"}`}
              >
                <p className="font-medium text-sm">{cls.name}</p>
                <p className="text-xs text-muted-foreground">{cls.level} · {cls.invite_code}</p>
              </button>
            ))}
            {classes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Sinf yo'q
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {!selectedClass ? (
              <div className="card-elevated rounded-2xl p-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Sinf tanlang yoki yangi sinf yarating</p>
              </div>
            ) : (
              <>
                {/* Class header */}
                <div className="card-elevated rounded-2xl p-5 mb-4 flex items-center justify-between flex-wrap gap-3 border border-border/40">
                  <div>
                    <h2 className="font-bold text-lg">{selectedClass.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedClass.level} daraja · {students.length} o'quvchi</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-sm font-mono">
                      {selectedClass.invite_code}
                      <button onClick={() => { navigator.clipboard.writeText(selectedClass.invite_code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">Taklif kodi</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-muted/30 p-1 rounded-xl w-fit">
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <t.icon className="w-3.5 h-3.5" /> {t.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">

                  {/* Students list */}
                  {tab === "classes" && (
                    <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                      {students.length === 0 ? (
                        <div className="card-elevated rounded-xl p-10 text-center text-muted-foreground border border-border/40">
                          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p>O'quvchilar hali qo'shilmagan</p>
                          <p className="text-xs mt-1">Taklif kodini o'quvchilarga yuboring: <strong>{selectedClass.invite_code}</strong></p>
                        </div>
                      ) : (
                        students.map((s, i) => (
                          <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="card-elevated rounded-xl p-4 flex items-center gap-4 border border-border/40"
                          >
                            <span className="text-lg font-bold text-muted-foreground w-6 text-center">#{i + 1}</span>
                            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary">
                              {(s.full_name || "?")[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{s.full_name || "Nomsiz"}</p>
                              <p className="text-xs text-muted-foreground">{s.xp} XP · 🔥 {s.streak} kun streak</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {i === 0 && <span className="text-yellow-500 text-lg">🥇</span>}
                              {i === 1 && <span className="text-gray-400 text-lg">🥈</span>}
                              {i === 2 && <span className="text-orange-500 text-lg">🥉</span>}
                              <span className="text-xs font-bold text-primary">{s.xp} XP</span>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  )}

                  {/* Assignments */}
                  {tab === "assignments" && (
                    <motion.div key="as" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="flex justify-end">
                        <button onClick={() => setShowCreateAssignment(s => !s)} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Vazifa berish
                        </button>
                      </div>

                      <AnimatePresence>
                        {showCreateAssignment && (
                          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="card-elevated rounded-xl p-5 border border-primary/20 space-y-3"
                          >
                            <h3 className="font-bold">Yangi vazifa</h3>
                            <input value={newAssignment.title} onChange={e => setNewAssignment(p => ({ ...p, title: e.target.value }))}
                              placeholder="Vazifa nomi"
                              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <textarea value={newAssignment.description} onChange={e => setNewAssignment(p => ({ ...p, description: e.target.value }))}
                              placeholder="Vazifa tavsifi (ixtiyoriy)"
                              rows={2}
                              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                            />
                            <div className="flex gap-3 flex-wrap">
                              <select value={newAssignment.type} onChange={e => setNewAssignment(p => ({ ...p, type: e.target.value as Assignment["type"] }))}
                                className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              >
                                <option value="test">Test</option>
                                <option value="essay">Essay</option>
                                <option value="game">O'yin</option>
                                <option value="vocabulary">So'z</option>
                              </select>
                              <input type="date" value={newAssignment.due_date} onChange={e => setNewAssignment(p => ({ ...p, due_date: e.target.value }))}
                                className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                              <button onClick={createAssignment} className="btn-primary px-5 py-2.5 text-sm">Yuborish</button>
                              <button onClick={() => setShowCreateAssignment(false)} className="btn-outline px-5 py-2.5 text-sm">Bekor</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {assignments.length === 0 ? (
                        <div className="card-elevated rounded-xl p-10 text-center text-muted-foreground border border-border/40">
                          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p>Hali vazifa berilmagan</p>
                        </div>
                      ) : (
                        assignments.map((a, i) => (
                          <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className="card-elevated rounded-xl p-4 border border-border/40 flex items-center gap-4"
                          >
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${typeColors[a.type]}`}>{a.type}</span>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{a.title}</p>
                              {a.due_date && <p className="text-xs text-muted-foreground">📅 {new Date(a.due_date).toLocaleDateString("uz-UZ")}</p>}
                            </div>
                            <span className="text-xs text-muted-foreground">0/{students.length} topshirdi</span>
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  )}

                  {/* Results */}
                  {tab === "results" && (
                    <motion.div key="re" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="card-elevated rounded-xl p-6 border border-border/40">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="font-bold">Sinf statistikasi</h3>
                          <button className="btn-outline px-4 py-2 text-xs flex items-center gap-1.5">
                            <Download className="w-3.5 h-3.5" /> PDF hisobot
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-5">
                          {[
                            { label: "O'rtacha ball", value: "—", icon: "📊" },
                            { label: "Faol o'quvchilar", value: students.length, icon: "✅" },
                            { label: "Topshirilgan", value: "0", icon: "📝" },
                          ].map((s, i) => (
                            <div key={i} className="text-center p-3 rounded-xl bg-muted/20">
                              <p className="text-xl">{s.icon}</p>
                              <p className="text-xl font-bold">{s.value}</p>
                              <p className="text-xs text-muted-foreground">{s.label}</p>
                            </div>
                          ))}
                        </div>
                        {students.length === 0 ? (
                          <p className="text-center text-muted-foreground text-sm py-4">O'quvchilar qo'shilgach statistika ko'rinadi</p>
                        ) : (
                          <div className="space-y-2">
                            {students.map((s, i) => (
                              <div key={s.id} className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                                <div className="flex-1 flex items-center gap-2">
                                  <span className="text-sm font-medium w-28 truncate">{s.full_name || "Nomsiz"}</span>
                                  <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min((s.xp / 1000) * 100, 100)}%` }} />
                                  </div>
                                  <span className="text-xs text-primary font-semibold w-14 text-right">{s.xp} XP</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
