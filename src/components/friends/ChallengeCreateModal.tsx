import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CHALLENGE_SKILLS, generateChallengeQuestions } from "@/lib/friendChallenge";

interface Props {
  friendId: string;
  friendName: string;
  onClose: () => void;
  onCreated?: () => void;
}

export const ChallengeCreateModal = ({ friendId, friendName, onClose, onCreated }: Props) => {
  const { user } = useAuth();
  const [skill, setSkill] = useState(CHALLENGE_SKILLS[0].key);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const questions = await generateChallengeQuestions(skill);
      if (questions.length === 0) {
        toast.error("Savollarni tuzib bo'lmadi, birozdan so'ng qayta urinib ko'ring");
        setCreating(false);
        return;
      }
      const { error } = await supabase.from("friend_challenges").insert({
        challenger_id: user.id,
        opponent_id: friendId,
        skill,
        status: "pending",
        questions,
      });
      if (error) throw error;
      toast.success(`⚔️ ${friendName}ga challenge yuborildi!`);
      onCreated?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Challenge yuborilmadi, qayta urinib ko'ring");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/70 z-[70] backdrop-blur-md"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-3 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="w-full max-w-sm pointer-events-auto"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Swords className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-display font-bold mb-1">{friendName}ga challenge!</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Mavzuni tanlang — 8 ta savoldan iborat tezkor test bo'ladi. G'olib +50 XP oladi!
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {CHALLENGE_SKILLS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSkill(s.key)}
                  className={`p-3 rounded-xl border text-sm font-medium flex flex-col items-center gap-1 transition-colors ${
                    skill === s.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 hover:bg-muted/60"
                  }`}
                >
                  <span className="text-xl">{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>

            <Button className="w-full" onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Savollar tayyorlanmoqda...
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4 mr-2" /> Challenge yuborish
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
