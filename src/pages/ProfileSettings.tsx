import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Loader2, User, Bell, Mail, TrendingUp, Save, BookOpen, Headphones, Award, Download } from 'lucide-react';
import { Header } from '@/components/Header';
import { CertificateDownload } from '@/components/CertificateDownload';

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  email_notifications: boolean;
  test_reminders: boolean;
  progress_updates: boolean;
}

export default function ProfileSettings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    avatar_url: null,
    email_notifications: true,
    test_reminders: true,
    progress_updates: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTestResults();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, email_notifications, test_reminders, progress_updates')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          avatar_url: data.avatar_url,
          email_notifications: data.email_notifications ?? true,
          test_reminders: data.test_reminders ?? true,
          progress_updates: data.progress_updates ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTestResults = async () => {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTestResults(data || []);
    } catch (error) {
      console.error('Error fetching test results:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          email_notifications: profile.email_notifications,
          test_reminders: profile.test_reminders,
          progress_updates: profile.progress_updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return user?.email?.[0]?.toUpperCase() || 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={() => navigate('/')} />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Profil</h1>
            <p className="text-muted-foreground">Shaxsiy ma'lumotlar va natijalar</p>
          </div>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
            <TabsTrigger value="results">Natijalar</TabsTrigger>
            <TabsTrigger value="certificates">Sertifikatlar</TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profil rasmi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatar_url || undefined} alt="Profile" />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {isUploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Rasmni o'zgartirish uchun bosing</p>
                    <p className="text-xs text-muted-foreground">Max 5MB, kvadrat rasm tavsiya etiladi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Shaxsiy ma'lumotlar</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">To'liq ism</Label>
                  <Input id="fullName" type="text" placeholder="Ismingizni kiriting" value={profile.full_name || ''} onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Bildirishnomalar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Mail className="h-4 w-4 text-primary" /></div>
                    <div><p className="font-medium">Email</p><p className="text-sm text-muted-foreground">Muhim yangilanishlar</p></div>
                  </div>
                  <Switch checked={profile.email_notifications} onCheckedChange={(c) => setProfile(p => ({ ...p, email_notifications: c }))} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Bell className="h-4 w-4 text-primary" /></div>
                    <div><p className="font-medium">Eslatmalar</p><p className="text-sm text-muted-foreground">Mashq qilish eslatmalari</p></div>
                  </div>
                  <Switch checked={profile.test_reminders} onCheckedChange={(c) => setProfile(p => ({ ...p, test_reminders: c }))} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><TrendingUp className="h-4 w-4 text-primary" /></div>
                    <div><p className="font-medium">Progress</p><p className="text-sm text-muted-foreground">Haftalik hisobot</p></div>
                  </div>
                  <Switch checked={profile.progress_updates} onCheckedChange={(c) => setProfile(p => ({ ...p, progress_updates: c }))} />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full" size="lg">
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saqlanmoqda...</> : <><Save className="h-4 w-4 mr-2" />Saqlash</>}
            </Button>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Test Natijalari</CardTitle>
                <CardDescription>Barcha ishlangan testlar tarixi</CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Hali test ishlanmagan</p>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${r.skill === 'reading' ? 'bg-primary/10' : r.skill === 'listening' ? 'bg-cyan-500/10' : 'bg-purple-500/10'}`}>
                            {r.skill === 'reading' ? <BookOpen className="h-5 w-5 text-primary" /> : <Headphones className="h-5 w-5 text-cyan-500" />}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{r.skill} - {r.level}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(r.created_at).toLocaleDateString('uz')} • {formatTime(r.time_taken)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${r.percentage >= 60 ? 'text-green-500' : 'text-destructive'}`}>
                            {r.percentage}%
                          </p>
                          <p className="text-sm text-muted-foreground">{r.correct_answers}/{r.total_questions}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Sertifikatlar</CardTitle>
                <CardDescription>O'tgan testlar uchun sertifikat yuklab olish</CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.filter((r: any) => r.percentage >= 60).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    60% dan yuqori natija olgan testlaringiz uchun sertifikat yuklab olishingiz mumkin
                  </p>
                ) : (
                  <div className="space-y-4">
                    {testResults.filter((r: any) => r.percentage >= 60).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium capitalize">{r.skill} - {r.level}</p>
                          <p className="text-sm text-muted-foreground">
                            {r.percentage}% • {new Date(r.created_at).toLocaleDateString('uz')}
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
    </div>
  );
}
