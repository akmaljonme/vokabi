import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Loader2,
  User,
  Bell,
  Mail,
  TrendingUp,
  Save,
  BookOpen,
  Headphones,
  Award,
  Download,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { CertificateDownload } from "@/components/CertificateDownload";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useUILanguage } from "@/hooks/useUILanguage";
import { SUPPORTED_UI_LANGUAGES, UI_LANGUAGE_LABELS, UI_LANGUAGE_FLAGS } from "@/i18n";
import { Languages as LanguagesIcon } from "lucide-react";

interface ProfileData {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  email_notifications: boolean;
  test_reminders: boolean;
  progress_updates: boolean;
}

export default function ProfileSettings() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { currentLanguage, setUILanguage } = useUILanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    username: null,
    avatar_url: null,
    bio: "",
    email_notifications: true,
    test_reminders: true,
    progress_updates: true,
  });
  const [usernameError, setUsernameError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTestResults();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await (supabase.from("profiles") as any)
        .select(
          "full_name, username, avatar_url, bio, email_notifications, test_reminders, progress_updates",
        )
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      if (data)
        setProfile({
          full_name: data.full_name || "",
          username: (data as any).username || "",
          avatar_url: data.avatar_url,
          bio: (data as any).bio || "",
          email_notifications: data.email_notifications ?? true,
          test_reminders: data.test_reminders ?? true,
          progress_updates: data.progress_updates ?? true,
        });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Profil yuklanmadi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTestResults = async () => {
    try {
      const { data, error } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTestResults(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm yuklang");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm 5MB dan kichik bo'lishi kerak");
      return;
    }
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (updateError) throw updateError;
      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar yangilandi");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Avatar yuklanmadi");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Validate username
      const uname = profile.username?.trim().toLowerCase() || null;
      if (uname) {
        if (uname.length < 3) {
          setUsernameError("Username kamida 3 ta belgi bo'lishi kerak");
          setIsSaving(false);
          return;
        }
        if (uname.length > 30) {
          setUsernameError("Username 30 ta belgidan oshmasligi kerak");
          setIsSaving(false);
          return;
        }
        if (!/^[a-z0-9_]+$/.test(uname)) {
          setUsernameError("Faqat kichik harflar, raqamlar va _ ishlatiladi");
          setIsSaving(false);
          return;
        }
        // Check uniqueness
        const { data: existing } = await (
          supabase.from("profiles").select("user_id") as any
        )
          .eq("username", uname)
          .neq("user_id", user.id)
          .maybeSingle();
        if (existing) {
          setUsernameError("Bu username allaqachon band");
          setIsSaving(false);
          return;
        }
      }
      setUsernameError("");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          username: uname,
          bio: profile.bio?.trim() || null,
          email_notifications: profile.email_notifications,
          test_reminders: profile.test_reminders,
          progress_updates: profile.progress_updates,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profil saqlandi");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Saqlashda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return user?.email?.[0]?.toUpperCase() || "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AppLayout>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">
              Profil
            </h1>
            <p className="text-sm text-muted-foreground">
              Shaxsiy ma'lumotlar va natijalar
            </p>
          </div>
        </motion.div>

        <Tabs defaultValue="settings" className="space-y-5">
          <TabsList>
            <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
            <TabsTrigger value="results">Natijalar</TabsTrigger>
            <TabsTrigger value="certificates">Sertifikatlar</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-5">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <LanguagesIcon className="h-4 w-4" /> {t("settings.interfaceLanguage")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{t("settings.interfaceLanguageDesc")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUPPORTED_UI_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setUILanguage(lang)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left text-sm font-medium
                        ${currentLanguage === lang
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/50"}`}
                    >
                      <span>{UI_LANGUAGE_FLAGS[lang]}</span>
                      <span>{UI_LANGUAGE_LABELS[lang]}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" /> Profil rasmi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={profile.avatar_url || undefined}
                        alt="Profile"
                      />
                      <AvatarFallback className="text-xl bg-primary/10 text-primary font-display font-bold">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Rasmni o'zgartirish uchun bosing
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Max 5MB, kvadrat rasm tavsiya etiladi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Shaxsiy ma'lumotlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs">
                    To'liq ism
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Ismingizni kiriting"
                    value={profile.full_name || ""}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs">
                    Username
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      @
                    </span>
                    <Input
                      id="username"
                      type="text"
                      placeholder="username_123"
                      value={profile.username || ""}
                      onChange={(e) => {
                        setProfile((prev) => ({
                          ...prev,
                          username: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, ""),
                        }));
                        setUsernameError("");
                      }}
                      className="text-sm pl-8"
                      maxLength={30}
                    />
                  </div>
                  {usernameError && (
                    <p className="text-xs text-destructive">{usernameError}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Hamjamiyatda siz shu nom bilan ko'rinasiz. Faqat kichik
                    harflar, raqamlar va _
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xs">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="O'zingiz haqingizda qisqacha yozing..."
                    value={profile.bio || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value.slice(0, 150) }))}
                    className="text-sm resize-none"
                    rows={3}
                  />
                  <p className="text-[10px] text-muted-foreground text-right">
                    {(profile.bio || "").length} / 150
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Bildirishnomalar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  {
                    icon: Mail,
                    label: "Email",
                    desc: "Muhim yangilanishlar",
                    key: "email_notifications" as const,
                  },
                  {
                    icon: Bell,
                    label: "Eslatmalar",
                    desc: "Mashq qilish eslatmalari",
                    key: "test_reminders" as const,
                  },
                  {
                    icon: TrendingUp,
                    label: "Progress",
                    desc: "Haftalik hisobot",
                    key: "progress_updates" as const,
                  },
                ].map((item, i) => (
                  <div key={item.key}>
                    {i > 0 && <Separator className="mb-5" />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={profile[item.key]}
                        onCheckedChange={(c) =>
                          setProfile((p) => ({ ...p, [item.key]: c }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Saqlash
                  </>
                )}
              </Button>
            </motion.div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" /> Test Natijalari
                </CardTitle>
                <CardDescription className="text-xs">
                  Barcha ishlangan testlar tarixi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    Hali test ishlanmagan
                  </p>
                ) : (
                  <div className="space-y-2">
                    {testResults.map((r: any) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl ${r.skill === "reading" ? "bg-primary/10" : r.skill === "listening" ? "bg-blue-500/10" : "bg-violet-500/10"}`}
                          >
                            {r.skill === "reading" ? (
                              <BookOpen className="h-4 w-4 text-primary" />
                            ) : (
                              <Headphones className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm capitalize">
                              {r.skill} - {r.level}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleDateString("uz")}{" "}
                              • {formatTime(r.time_taken)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-base font-bold ${r.percentage >= 60 ? "text-emerald-500" : "text-destructive"}`}
                          >
                            {r.percentage}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.correct_answers}/{r.total_questions}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4" /> Sertifikatlar
                </CardTitle>
                <CardDescription className="text-xs">
                  O'tgan testlar uchun sertifikat yuklab olish
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.filter((r: any) => r.percentage >= 60).length ===
                0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    60% dan yuqori natija olgan testlaringiz uchun sertifikat
                    yuklab olishingiz mumkin
                  </p>
                ) : (
                  <div className="space-y-3">
                    {testResults
                      .filter((r: any) => r.percentage >= 60)
                      .map((r: any) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-border/50"
                        >
                          <div>
                            <p className="font-medium text-sm capitalize">
                              {r.skill} - {r.level}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.percentage}% •{" "}
                              {new Date(r.created_at).toLocaleDateString("uz")}
                            </p>
                          </div>
                          <CertificateDownload
                            result={{
                              mockId: r.mock_id,
                              level: r.level,
                              skill: r.skill,
                              totalQuestions: r.total_questions,
                              correctAnswers: r.correct_answers,
                              percentage: r.percentage,
                              passed: r.passed,
                              answers: [],
                              timeTaken: r.time_taken,
                            }}
                          />
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </AppLayout>
  );
}
