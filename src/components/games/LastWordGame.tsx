import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Users, Send, Clock, Trophy, Loader2, Wifi, Bot, Copy, Check } from 'lucide-react';

interface Props { onBack: () => void; }

interface GameMessage {
  player: string;
  playerId: string;
  word: string;
  timestamp: number;
}

const TURN_TIME = 15;

// AI word bank
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
  U: ['umbrella', 'universe', 'unlikely', 'ultimate'],
  V: ['vacation', 'valuable', 'vegetable', 'violence', 'visiting'],
  W: ['wonderful', 'whenever', 'watching', 'workshop', 'wildlife'],
  X: ['xylophone'],
  Y: ['yesterday', 'yourself', 'yearbook'],
  Z: ['zebra', 'zero', 'zigzag'],
};

export const LastWordGame = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'select' | 'ai' | 'online'>('select');
  const [gameState, setGameState] = useState<'lobby' | 'waiting' | 'playing' | 'finished'>('lobby');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [inputWord, setInputWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const [currentTurn, setCurrentTurn] = useState('');
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentName, setOpponentName] = useState('');
  const [round, setRound] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load player name
  useEffect(() => {
    if (!user) return;
    (supabase.from('profiles') as any).select('full_name, username').eq('user_id', user.id).maybeSingle()
      .then(({ data }: any) => {
        setPlayerName(data?.username ? `@${data.username}` : data?.full_name || 'Foydalanuvchi');
      });
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // === AI MODE ===
  const getAIWord = (lastLetter: string): string | null => {
    const letter = lastLetter.toUpperCase();
    const available = (aiWords[letter] || []).filter(w => !usedWords.has(w.toLowerCase()));
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
  };

  const startAI = () => {
    setMode('ai');
    setGameState('playing');
    setMessages([]);
    setUsedWords(new Set());
    setMyScore(0);
    setRound(0);
    setCurrentTurn(user?.id || 'player');
    setCurrentWord('');
    setTimeLeft(TURN_TIME);
    setError('');
    setOpponentName('🤖 AI');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // AI timer
  useEffect(() => {
    if (mode !== 'ai' || gameState !== 'playing') return;
    if (currentTurn !== (user?.id || 'player')) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameState('finished');
          toast({ title: "⏰ Vaqt tugadi!", variant: 'destructive' });
          if (user) supabase.from('game_scores').insert({ user_id: user.id, game_type: 'last_word', score: myScore, level: 'A1' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, gameState, currentTurn, round]);

  const submitAIWord = () => {
    const word = inputWord.trim().toLowerCase();
    if (!word) return;
    if (word.length < 2) { setError("Kamida 2 harf bo'lishi kerak"); return; }
    if (usedWords.has(word)) { setError("Bu so'z allaqachon ishlatilgan!"); return; }
    if (currentWord && word[0] !== currentWord[currentWord.length - 1]) {
      setError(`So'z "${currentWord[currentWord.length - 1].toUpperCase()}" harfi bilan boshlanishi kerak!`);
      return;
    }
    setError('');
    const newUsed = new Set(usedWords); newUsed.add(word); setUsedWords(newUsed);
    setMessages(prev => [...prev, { player: 'Siz', playerId: user?.id || 'player', word, timestamp: Date.now() }]);
    setCurrentWord(word); setMyScore(s => s + 10); setInputWord(''); setRound(r => r + 1);
    setCurrentTurn('ai');

    setTimeout(() => {
      const aiWord = getAIWord(word[word.length - 1]);
      if (!aiWord) {
        setGameState('finished');
        setMyScore(s => { const f = s + 50; if (user) supabase.from('game_scores').insert({ user_id: user.id, game_type: 'last_word', score: f, level: 'A1' }); return f; });
        toast({ title: "🎉 AI so'z topa olmadi!" });
        return;
      }
      const nu = new Set(newUsed); nu.add(aiWord.toLowerCase()); setUsedWords(nu);
      setMessages(prev => [...prev, { player: '🤖 AI', playerId: 'ai', word: aiWord, timestamp: Date.now() }]);
      setCurrentWord(aiWord); setCurrentTurn(user?.id || 'player'); setTimeLeft(TURN_TIME); setRound(r => r + 1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }, 1000 + Math.random() * 1500);
  };

  // === ONLINE MODE ===
  const createRoom = async () => {
    if (!user) return;
    // Clean up old waiting rooms
    await (supabase.from('game_rooms') as any).delete().eq('player1_id', user.id).eq('status', 'waiting');

    const { data, error: err } = await (supabase.from('game_rooms') as any).insert({
      player1_id: user.id,
      player1_name: playerName,
      status: 'waiting',
      current_turn: user.id,
    }).select().single();

    if (err || !data) { toast({ title: "Xona yaratishda xato", variant: 'destructive' }); return; }
    setRoomId(data.id);
    setGameState('waiting');
    subscribeToRoom(data.id);
  };

  const joinRoom = async (id: string) => {
    if (!user) return;
    const { data: room, error: fetchErr } = await (supabase.from('game_rooms') as any)
      .select('*').eq('id', id).eq('status', 'waiting').single();

    if (fetchErr || !room) { toast({ title: "Xona topilmadi yoki band", variant: 'destructive' }); return; }
    if (room.player1_id === user.id) { toast({ title: "O'zingizning xonangizga kira olmaysiz" }); return; }

    const { error: updateErr } = await (supabase.from('game_rooms') as any).update({
      player2_id: user.id,
      player2_name: playerName,
      status: 'playing',
      current_turn: room.player1_id,
      last_move_at: new Date().toISOString(),
    }).eq('id', id);

    if (updateErr) { toast({ title: "Qo'shilishda xato", variant: 'destructive' }); return; }
    setRoomId(id);
    setOpponentName(room.player1_name);
    setCurrentTurn(room.player1_id);
    setGameState('playing');
    subscribeToRoom(id);
  };

  const findRoom = async () => {
    if (!user) return;
    // Find a waiting room that isn't mine
    const { data: rooms } = await (supabase.from('game_rooms') as any)
      .select('*').eq('status', 'waiting').neq('player1_id', user.id).order('created_at', { ascending: true }).limit(1);

    if (rooms && rooms.length > 0) {
      await joinRoom(rooms[0].id);
    } else {
      await createRoom();
    }
  };

  const subscribeToRoom = (id: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase.channel(`game-room-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${id}`,
      }, (payload: any) => {
        const room = payload.new;
        handleRoomUpdate(room);
      })
      .subscribe();

    channelRef.current = channel;
  };

  const handleRoomUpdate = useCallback((room: any) => {
    if (!user) return;

    // Someone joined
    if (room.status === 'playing' && gameState === 'waiting') {
      setGameState('playing');
      const isP1 = room.player1_id === user.id;
      setOpponentName(isP1 ? room.player2_name : room.player1_name);
      toast({ title: `${isP1 ? room.player2_name : room.player1_name} qo'shildi!` });
    }

    // Update game state from room
    setCurrentTurn(room.current_turn || '');
    setCurrentWord(room.current_word || '');
    const words: string[] = room.used_words || [];
    setUsedWords(new Set(words));
    setRound(room.round || 0);

    const isP1 = room.player1_id === user.id;
    setMyScore(isP1 ? room.player1_score : room.player2_score);
    setOpponentScore(isP1 ? room.player2_score : room.player1_score);

    // Rebuild messages from used_words
    if (words.length > 0) {
      const msgs: GameMessage[] = words.map((w, i) => {
        // Alternate turns: p1 starts (round 0), then p2 (round 1), etc.
        const isP1Turn = i % 2 === 0;
        const pid = isP1Turn ? room.player1_id : room.player2_id;
        const pname = isP1Turn ? room.player1_name : room.player2_name;
        return { player: pid === user.id ? 'Siz' : pname, playerId: pid, word: w, timestamp: i };
      });
      setMessages(msgs);
    }

    // Game finished
    if (room.status === 'finished') {
      setGameState('finished');
      if (room.winner_id === user.id) {
        toast({ title: "🎉 Siz yutdingiz!" });
      } else if (room.winner_id) {
        toast({ title: "😔 Siz yutqazdingiz", variant: 'destructive' });
      }
    }

    // Reset timer when it becomes my turn
    if (room.current_turn === user.id) {
      setTimeLeft(TURN_TIME);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [user, gameState]);

  // Online timer
  useEffect(() => {
    if (mode !== 'online' || gameState !== 'playing') return;
    if (currentTurn !== user?.id) return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time up — opponent wins
          handleOnlineTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, gameState, currentTurn, round]);

  const handleOnlineTimeout = async () => {
    if (!roomId || !user) return;
    const { data: room } = await (supabase.from('game_rooms') as any).select('*').eq('id', roomId).single();
    if (!room || room.status === 'finished') return;
    const isP1 = room.player1_id === user.id;
    const winnerId = isP1 ? room.player2_id : room.player1_id;
    await (supabase.from('game_rooms') as any).update({ status: 'finished', winner_id: winnerId }).eq('id', roomId);
    supabase.from('game_scores').insert({ user_id: user.id, game_type: 'last_word', score: myScore, level: 'A1' });
  };

  const submitOnlineWord = async () => {
    if (!roomId || !user) return;
    const word = inputWord.trim().toLowerCase();
    if (!word) return;
    if (word.length < 2) { setError("Kamida 2 harf bo'lishi kerak"); return; }
    if (usedWords.has(word)) { setError("Bu so'z allaqachon ishlatilgan!"); return; }
    if (currentWord && word[0] !== currentWord[currentWord.length - 1]) {
      setError(`So'z "${currentWord[currentWord.length - 1].toUpperCase()}" harfi bilan boshlanishi kerak!`);
      return;
    }
    setError('');
    setInputWord('');

    const { data: room } = await (supabase.from('game_rooms') as any).select('*').eq('id', roomId).single();
    if (!room || room.status === 'finished') return;

    const isP1 = room.player1_id === user.id;
    const nextTurn = isP1 ? room.player2_id : room.player1_id;
    const newWords = [...(room.used_words || []), word];

    await (supabase.from('game_rooms') as any).update({
      current_word: word,
      current_turn: nextTurn,
      used_words: newWords,
      round: room.round + 1,
      last_move_at: new Date().toISOString(),
      ...(isP1 ? { player1_score: room.player1_score + 10 } : { player2_score: room.player2_score + 10 }),
    }).eq('id', roomId);
  };

  const leaveRoom = async () => {
    if (roomId && user) {
      const { data: room } = await (supabase.from('game_rooms') as any).select('*').eq('id', roomId).single();
      if (room && room.status !== 'finished') {
        const isP1 = room.player1_id === user.id;
        const winnerId = isP1 ? room.player2_id : room.player1_id;
        if (room.status === 'playing' && winnerId) {
          await (supabase.from('game_rooms') as any).update({ status: 'finished', winner_id: winnerId }).eq('id', roomId);
        } else {
          await (supabase.from('game_rooms') as any).delete().eq('id', roomId);
        }
      }
    }
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    setRoomId(null);
    setGameState('lobby');
    setMode('select');
    setMessages([]);
    setUsedWords(new Set());
    setMyScore(0);
    setOpponentScore(0);
    setRound(0);
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // === MODE SELECT ===
  if (mode === 'select') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
              <li>• Raqib so'z topa olmasa — siz yutasiz! 🎉</li>
            </ul>
          </div>

          <Button className="w-full h-14 text-lg" variant="outline" onClick={startAI}>
            <Bot className="w-5 h-5 mr-2" /> AI bilan o'ynash
          </Button>

          <Button className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary/80" onClick={() => { setMode('online'); setGameState('lobby'); }}>
            <Wifi className="w-5 h-5 mr-2" /> 🌐 Online o'ynash
          </Button>
        </div>
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={onBack}>← Orqaga</Button>
        </div>
      </motion.div>
    );
  }

  // === ONLINE LOBBY ===
  if (mode === 'online' && gameState === 'lobby') {
    const [joinId, setJoinId] = useState('');
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-6">
          <Wifi className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-display font-bold">Online o'yin</h2>
          <p className="text-sm text-muted-foreground">Boshqa talaba bilan o'ynang!</p>
        </div>
        <div className="max-w-md mx-auto space-y-4">
          <Button className="w-full h-12" onClick={findRoom}>
            <Users className="w-4 h-4 mr-2" /> Raqib topish (avtomatik)
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">yoki</span></div>
          </div>

          <div className="flex gap-2">
            <Input
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              placeholder="Xona ID kiriting..."
              className="flex-1"
            />
            <Button onClick={() => joinId.trim() && joinRoom(joinId.trim())} disabled={!joinId.trim()}>
              Qo'shilish
            </Button>
          </div>
        </div>
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => setMode('select')}>← Orqaga</Button>
        </div>
      </motion.div>
    );
  }

  // === WAITING ROOM ===
  if (gameState === 'waiting') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center py-10">
        <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-display font-bold mb-2">Raqib kutilmoqda...</h2>
        <p className="text-sm text-muted-foreground mb-6">Do'stingizga xona ID ni yuboring:</p>

        <div className="card-elevated p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-2">Xona ID:</p>
          <div className="flex items-center gap-2 justify-center">
            <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded-lg break-all">{roomId}</code>
            <Button size="icon" variant="ghost" onClick={copyRoomId}>
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <Button variant="outline" onClick={leaveRoom}>Bekor qilish</Button>
      </motion.div>
    );
  }

  // === FINISHED ===
  if (gameState === 'finished') {
    const iWon = mode === 'online' ? myScore > opponentScore : true;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto text-center py-10">
        <Trophy className={`w-16 h-16 mx-auto mb-4 ${iWon ? 'text-amber-500' : 'text-muted-foreground'}`} />
        <h2 className="text-3xl font-display font-bold mb-2">O'yin Tugadi!</h2>

        {mode === 'online' ? (
          <div className="flex justify-center gap-8 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Siz</p>
              <p className="text-3xl font-bold text-primary">{myScore}</p>
            </div>
            <div className="text-2xl font-bold text-muted-foreground self-center">vs</div>
            <div>
              <p className="text-sm text-muted-foreground">{opponentName}</p>
              <p className="text-3xl font-bold text-foreground">{opponentScore}</p>
            </div>
          </div>
        ) : (
          <p className="text-4xl font-bold text-primary mb-2">{myScore} ball</p>
        )}

        <p className="text-muted-foreground mb-6">Jami {messages.length} ta so'z ishlatildi</p>

        {messages.length > 0 && (
          <div className="card-elevated p-4 mb-6 max-h-40 overflow-y-auto text-left">
            <p className="text-xs text-muted-foreground mb-2">So'zlar zanjiri:</p>
            <p className="text-sm flex flex-wrap gap-1">
              {messages.map((m, i) => (
                <span key={i} className={`px-2 py-0.5 rounded text-xs ${m.playerId === user?.id || m.playerId === 'player' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                  {m.word}
                </span>
              ))}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {mode === 'ai' && <Button onClick={startAI}>Qayta o'ynash</Button>}
          <Button variant="outline" onClick={() => { leaveRoom(); }}>Orqaga</Button>
        </div>
      </motion.div>
    );
  }

  // === PLAYING ===
  const isMyTurn = currentTurn === (user?.id || 'player');
  const isAIThinking = mode === 'ai' && currentTurn === 'ai';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={leaveRoom}>← Chiqish</Button>
        <div className="flex gap-4 text-sm">
          {mode === 'online' && (
            <span className="text-muted-foreground">{opponentName}: <strong>{opponentScore}</strong></span>
          )}
          <span className="text-muted-foreground">Siz: <strong className="text-foreground">{myScore}</strong></span>
          <span className={`flex items-center gap-1 ${isMyTurn && timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
            <Clock className="w-3.5 h-3.5" /> <strong>{isMyTurn ? `${timeLeft}s` : '--'}</strong>
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
            <p className="text-center text-muted-foreground text-sm py-8">
              {isMyTurn ? "Birinchi so'zni yozing!" : "Raqib boshlamoqda..."}
            </p>
          )}
          <AnimatePresence>
            {messages.map((m, i) => {
              const isMe = m.playerId === user?.id || m.playerId === 'player';
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`px-3 py-1.5 rounded-xl text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <span className="text-xs opacity-70">{m.player}: </span>
                    <span className="font-bold">{m.word}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {(isAIThinking || (mode === 'online' && !isMyTurn)) && (
            <div className="flex justify-start">
              <div className="px-3 py-1.5 rounded-xl text-sm bg-muted flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">{mode === 'ai' ? "AI o'ylayapti..." : `${opponentName} o'ylayapti...`}</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        {isMyTurn && gameState === 'playing' && (
          <div>
            {error && <p className="text-xs text-destructive mb-2">{error}</p>}
            <form onSubmit={(e) => { e.preventDefault(); mode === 'ai' ? submitAIWord() : submitOnlineWord(); }} className="flex gap-2">
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
