import { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/lib/notifications";

interface Props {
  targetUserId: string;
  targetName?: string;
  size?: "sm" | "default";
}

export const FollowButton = ({ targetUserId, targetName, size = "sm" }: Props) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetUserId) {
      setLoading(false);
      return;
    }
    supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .maybeSingle()
      .then(({ data }: any) => {
        setFollowing(!!data);
        setLoading(false);
      });
  }, [user, targetUserId]);

  if (!user || user.id === targetUserId) return null;

  const toggleFollow = async () => {
    setBusy(true);
    try {
      if (following) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        setFollowing(false);
      } else {
        await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: targetUserId,
        });
        setFollowing(true);
        await createNotification({
          userId: targetUserId,
          actorId: user.id,
          type: "follow",
          title: "Yangi follower!",
          body: `Sizni kuzata boshladi`,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size}
      variant={following ? "outline" : "default"}
      className="text-xs shrink-0"
      disabled={loading || busy}
      onClick={toggleFollow}
    >
      {following ? (
        <>
          <UserCheck className="w-3.5 h-3.5 mr-1" /> Kuzatilmoqda
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Kuzatish
        </>
      )}
    </Button>
  );
};
