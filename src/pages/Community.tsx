import { ArrowLeft, MessageCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatRooms } from '@/components/community/ChatRooms';
import { DirectMessages } from '@/components/community/DirectMessages';

export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) { navigate('/auth'); return null; }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Users className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-lg">Hamjamiyat</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs defaultValue="rooms">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="rooms" className="flex-1 gap-2">
              <MessageCircle className="w-4 h-4" /> Chat xonalari
            </TabsTrigger>
            <TabsTrigger value="dm" className="flex-1 gap-2">
              <Users className="w-4 h-4" /> Shaxsiy xabarlar
            </TabsTrigger>
          </TabsList>
          <TabsContent value="rooms"><ChatRooms /></TabsContent>
          <TabsContent value="dm"><DirectMessages /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
