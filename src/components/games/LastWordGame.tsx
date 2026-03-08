import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Users, Send, Clock, Trophy, Loader2 } from 'lucide-react';

interface Props { onBack: () => void; }

interface Player {
  id: string;
  name: string;
  score: number;
}

interface GameMessage {
  player: string;
  playerId: string;
  word: string;
  timestamp: number;
}

const TURN_TIME = 15; // seconds per turn

export const LastWordGame = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<'lobby' | 'waiting' | 'playing' | 'finished'>('lobby');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [inputWord, setInputWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const [currentTurn, setCurrentTurn] = useState<string>('');
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [myScore, setMyScore] = useState(0);
  const [round, setRound] = useState(0);
  const [error, setError] = useState('');
  const channelRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [playerName, setPlayerName] = useState('');

  // Single player mode with AI opponent
  const aiWords: Record<string, string[]> = {
    A: ['apple', 'adventure', 'amazing', 'actually', 'arrange'],
    B: ['beautiful', 'birthday', 'believe', 'breakfast', 'brother'],
    C: ['celebrate', 'computer', 'country', 'challenge', 'creative'],
    D: ['different', 'discover', 'dangerous', 'describe', 'develop'],
    E: ['education', 'everyone', 'exercise', 'excellent', 'explain'],
    F: ['fantastic', 'favorite', 'football', 'friendly', 'furniture'],
    G: ['government', 'generous', 'grateful', 'graduate', 'guarantee'],
    H: ['happiness', 'hospital', 'however', 'homework', 'honestly'],
    I: ['important', 'internet', 'interest', 'imagine', 'improve'],
    J: ['journey', 'justice', 'joyful', 'judgment', 'juggle'],
    K: ['kitchen', 'knowledge', 'kingdom', 'keyboard', 'kindness'],
    L: ['language', 'library', 'learning', 'location', 'laughter'],
    M: ['mountain', 'medicine', 'movement', 'midnight', 'material'],
    N: ['neighbor', 'national', 'notebook', 'negative', 'normally'],
    O: ['opposite', 'organize', 'original', 'occasion', 'obstacle'],
    P: ['practice', 'possible', 'personal', 'pleasure', 'peaceful'],
    Q: ['question', 'quantity', 'qualify', 'quickly', 'quietly'],
    R: ['remember', 'research', 'relative', 'romantic', 'recently'],
    S: ['surprise', 'strength', 'schedule', 'shopping', 'standard'],
    T: ['together', 'tomorrow', 'terrible', 'teaching', 'training'],
    U: ['umbrella', 'universe', 'unlikely', 'ultimate', 'universe'],
    V: ['vacation', 'valuable', 'vegetable', 'violence', 'visiting'],
    W: ['wonderful', 'whenever', 'watching', 'workshop', 'wildlife'],
    X: ['xylophone'],
    Y: ['yesterday', 'yourself', 'yearbook'],
    Z: ['zebra', 'zero', 'zigzag'],
  };

  const getAIWord = (lastLetter: string): string | null => {
    const letter = lastLetter.toUpperCase();
    const available = (aiWords[letter] || []).filter(w => !usedWords.has(w.toLowerCase()));
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
  };

  const startSinglePlayer = () => {
    setGameState('playing');
    setMessages([]);
    setUsedWords(new Set());
    setMyScore(0);
    setRound(0);
    setCurrentTurn(user?.id || 'player');
    setCurrentWord('');
    setTimeLeft(TURN_TIME);
    setError('');
    // First word - player starts
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (currentTurn !== (user?.id || 'player')) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Player lost - time up
          setGameState('finished');
          toast({ title: "⏰ Vaqt tugadi! Siz yutqazdingiz.", variant: 'destructive' });
          if (user) {
            supabase.from('game_scores').insert({ user_id: user.id, game_type: 'last_word', score: myScore, level: 'A1' });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, currentTurn, round]);

  const submitWord = () => {
    const word = inputWord.trim().toLowerCase();
    if (!word) return;

    // Validate
    if (word.length < 2) { setError("Kamida 2 harf bo'lishi kerak"); return; }
    if (usedWords.has(word)) { setError("Bu so'z allaqachon ishlatilgan!"); return; }
    if (currentWord && word[0] !== currentWord[currentWord.length - 1]) {
      setError(`So'z "${currentWord[currentWord.length - 1].toUpperCase()}" harfi bilan boshlanishi kerak!`);
      return;
    }

    setError('');
    const newUsed = new Set(usedWords);
    newUsed.add(word);
    setUsedWords(newUsed);

    setMessages(prev => [...prev, { player: 'Siz', playerId: user?.id || 'player', word, timestamp: Date.now() }]);
    setCurrentWord(word);
    setMyScore(s => s + 10);
    setInputWord('');
    setRound(r => r + 1);

    // AI's turn
    setCurrentTurn('ai');
    setTimeout(() => {
      const lastLetter = word[word.length - 1];
      const aiWord = getAIWord(lastLetter);
      
      if (!aiWord) {
        // AI can't find a word - player wins!
        setGameState('finished');
        setMyScore(s => {
          const finalScore = s + 50;
          if (user) {
            supabase.from('game_scores').insert({ user_id: user.id, game_type: 'last_word', score: finalScore, level: 'A1' });
          }
          return finalScore;
        });
        toast({ title: "🎉 Tabriklaymiz! AI so'z topa olmadi!" });
        return;
      }

      const newUsed2 = new Set(newUsed);
      newUsed2.add(aiWord.toLowerCase());
      setUsedWords(newUsed2);
      setMessages(prev => [...prev, { player: '🤖 AI', playerId: 'ai', word: aiWord, timestamp: Date.now() }]);
      setCurrentWord(aiWord);
      setCurrentTurn(user?.id || 'player');
      setTimeLeft(TURN_TIME);
      setRound(r => r + 1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }, 1000 + Math.random() * 1500);
  };

  if (gameState === 'lobby') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔤</div>
          <h2 className="text-2xl font-display font-bold mb-2">Last Word Game</h2>
          <p className="text-muted-foreground">So'zning oxirgi harfi bilan boshlanadigan yangi so'z toping!</p>
        </div>
        <div className="max-w-md mx-auto space-y-4">
          <div className="card-elevated p-6 text-center">
            <h3 className="font-bold mb-2">📖 Qoidalar</h3>
            <ul className="text-sm text-muted-foreground text-left space-y-1">
              <li>• Har bir so'z oldingi so'zning oxirgi harfi bilan boshlanishi kerak</li>
              <li>• Bir xil so'zni ikki marta ishlatish mumkin emas</li>
              <li>• Har bir so'z uchun {TURN_TIME} soniya vaqt beriladi</li>
              <li>• AI so'z topa olmasa — siz yutasiz! 🎉</li>
            </ul>
          </div>
          <Button className="w-full h-14 text-lg" onClick={startSinglePlayer}>
            <Users className="w-5 h-5 mr-2" /> AI bilan o'ynash
          </Button>
        </div>
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={onBack}>← Orqaga</Button>
        </div>
      </motion.div>
    );
  }

  if (gameState === 'finished') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto text-center py-10">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-3xl font-display font-bold mb-2">O'yin Tugadi!</h2>
        <p className="text-4xl font-bold text-primary mb-2">{myScore} ball</p>
        <p className="text-muted-foreground mb-1">{messages.filter(m => m.playerId !== 'ai').length} ta so'z topildi</p>
        <p className="text-muted-foreground mb-6">Jami {messages.length} ta so'z ishlatildi</p>

        {messages.length > 0 && (
          <div className="card-elevated p-4 mb-6 max-h-40 overflow-y-auto text-left">
            <p className="text-xs text-muted-foreground mb-2">So'zlar zanjiri:</p>
            <p className="text-sm flex flex-wrap gap-1">
              {messages.map((m, i) => (
                <span key={i} className={`px-2 py-0.5 rounded text-xs ${m.playerId === 'ai' ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
                  {m.word}
                </span>
              ))}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={startSinglePlayer}>Qayta o'ynash</Button>
          <Button variant="outline" onClick={onBack}>Orqaga</Button>
        </div>
      </motion.div>
    );
  }

  const isMyTurn = currentTurn === (user?.id || 'player');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => setGameState('lobby')}>← Chiqish</Button>
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">Ball: <strong className="text-foreground">{myScore}</strong></span>
          <span className={`flex items-center gap-1 ${timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
            <Clock className="w-3.5 h-3.5" /> <strong>{timeLeft}s</strong>
          </span>
        </div>
      </div>

      <div className="card-elevated p-4">
        {/* Current word display */}
        {currentWord && (
          <div className="text-center mb-4 p-3 bg-muted rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Oxirgi so'z:</p>
            <p className="text-2xl font-bold">
              {currentWord.slice(0, -1)}
              <span className="text-primary text-3xl">{currentWord[currentWord.length - 1].toUpperCase()}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Keyingi so'z "<strong className="text-primary">{currentWord[currentWord.length - 1].toUpperCase()}</strong>" harfi bilan boshlansin
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="h-48 overflow-y-auto space-y-2 mb-4 p-2">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Birinchi so'zni yozing!</p>
          )}
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: m.playerId === 'ai' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${m.playerId === 'ai' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`px-3 py-1.5 rounded-xl text-sm ${
                  m.playerId === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground'
                }`}>
                  <span className="text-xs opacity-70">{m.player}: </span>
                  <span className="font-bold">{m.word}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!isMyTurn && gameState === 'playing' && (
            <div className="flex justify-start">
              <div className="px-3 py-1.5 rounded-xl text-sm bg-muted flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">AI o'ylayapti...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        {isMyTurn && gameState === 'playing' && (
          <div>
            {error && <p className="text-xs text-destructive mb-2">{error}</p>}
            <form onSubmit={(e) => { e.preventDefault(); submitWord(); }} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                placeholder={currentWord ? `"${currentWord[currentWord.length - 1].toUpperCase()}" bilan boshlanadigan so'z...` : "Birinchi so'zni yozing..."}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="icon"><Send className="w-4 h-4" /></Button>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
};
