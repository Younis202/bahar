import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Star, Zap, Gift, Award, Target, Flame,
  Crown, Medal, Shield, Sparkles, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabaseAny';
import { supabase } from '@/integrations/supabase/client';

interface BadgeItem {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  earned: boolean;
  earned_at?: string;
}

interface PointActivity {
  id: string;
  points: number;
  action: string;
  detail: string | null;
  created_at: string;
}

const iconMap: Record<string, typeof Award> = {
  award: Award, target: Target, zap: Zap, star: Star,
  crown: Crown, flame: Flame, shield: Shield, medal: Medal,
};

export default function Gamification() {
  const { user, profile } = useAuth();
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [activities, setActivities] = useState<PointActivity[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ full_name: string; total_points: number; avatar_url: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: allBadges } = await db.from('badges').select('*');
    const { data: userBadges } = await db.from('user_badges').select('badge_id, earned_at').eq('user_id', user!.id);
    const earnedIds = new Set((userBadges as any[] || []).map((b: any) => b.badge_id));
    const merged = (allBadges as any[] || []).map((b: any) => ({
      ...b,
      earned: earnedIds.has(b.id),
      earned_at: (userBadges as any[] || []).find((ub: any) => ub.badge_id === b.id)?.earned_at,
    }));
    setBadges(merged);

    const { data: pointsData } = await db
      .from('user_points')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setActivities((pointsData as unknown as PointActivity[]) || []);

    const { data: topUsers } = await db
      .from('profiles')
      .select('full_name, total_points, avatar_url')
      .order('total_points', { ascending: false })
      .limit(10);
    setLeaderboard((topUsers as any[]) || []);
    setLoading(false);
  };

  const totalPoints = profile?.total_points || 0;
  const level = Math.floor(totalPoints / 500) + 1;
  const levelProgress = ((totalPoints % 500) / 500) * 100;
  const userRank = leaderboard.findIndex(u => u.full_name === profile?.full_name) + 1;

  const rewards = [
    { name: '10% Course Discount', cost: 500, icon: Gift },
    { name: '$5 Wallet Credit', cost: 1000, icon: Sparkles },
    { name: 'Free Live Session', cost: 2000, icon: Star },
    { name: 'Premium Certificate Design', cost: 3000, icon: Award },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-gold-text">Rewards</span> & Achievements
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">Earn points, unlock badges, and redeem rewards as you learn.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-accent/20 rounded-xl p-5 relative overflow-hidden">
              <Trophy className="w-8 h-8 text-accent mb-2" />
              <p className="font-display text-3xl font-bold">{totalPoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </div>
            <div className="bg-card border border-primary/20 rounded-xl p-5">
              <Medal className="w-8 h-8 text-primary mb-2" />
              <p className="font-display text-3xl font-bold">Level {level}</p>
              <Progress value={levelProgress} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{500 - (totalPoints % 500)} pts to next</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <Award className="w-8 h-8 text-green-400 mb-2" />
              <p className="font-display text-3xl font-bold">{badges.filter(b => b.earned).length}</p>
              <p className="text-xs text-muted-foreground">Badges Earned</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <TrendingUp className="w-8 h-8 text-primary mb-2" />
              <p className="font-display text-3xl font-bold">#{userRank || '-'}</p>
              <p className="text-xs text-muted-foreground">Leaderboard Rank</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {badges.length > 0 && (
                <>
                  <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" /> Badges & Achievements
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {badges.map(badge => {
                      const Icon = iconMap[badge.icon || 'award'] || Award;
                      return (
                        <div key={badge.id} className={`bg-card border rounded-xl p-4 text-center transition-all ${
                          badge.earned ? 'border-accent/30 hover:border-accent/60' : 'border-border opacity-60'
                        }`}>
                          <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${badge.earned ? 'bg-accent/10' : 'bg-secondary'}`}>
                            <Icon className={`w-6 h-6 ${badge.earned ? 'text-accent' : 'text-muted-foreground'}`} />
                          </div>
                          <h4 className="text-sm font-semibold mb-1">{badge.name}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                          {badge.earned ? <Badge className="bg-accent/10 text-accent text-xs">✓ Earned</Badge> : null}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> Recent Points Activity
              </h2>
              {activities.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No activity yet. Start learning to earn points!</div>
              ) : (
                <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-center gap-3 p-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.detail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-green-400">+{activity.points}</p>
                        <p className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-accent" /> Leaderboard
                </h2>
                <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
                  {leaderboard.map((entry, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 ${entry.full_name === profile?.full_name ? 'bg-primary/5' : ''}`}>
                      <span className={`w-6 text-center font-bold text-sm ${
                        i === 0 ? 'text-accent' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-muted-foreground'
                      }`}>
                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {entry.full_name?.charAt(0) || '?'}
                      </div>
                      <span className={`text-sm font-medium flex-1 ${entry.full_name === profile?.full_name ? 'text-primary' : ''}`}>
                        {entry.full_name === profile?.full_name ? 'You' : entry.full_name}
                      </span>
                      <span className="text-sm text-muted-foreground">{entry.total_points?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-400" /> Redeem Rewards
                </h2>
                <div className="space-y-3">
                  {rewards.map(reward => {
                    const Icon = reward.icon;
                    const canAfford = totalPoints >= reward.cost;
                    return (
                      <div key={reward.name} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${canAfford ? 'text-green-400' : 'text-muted-foreground'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{reward.name}</p>
                          <p className="text-xs text-muted-foreground">{reward.cost} points</p>
                        </div>
                        <Button size="sm" variant={canAfford ? 'default' : 'outline'} disabled={!canAfford}
                          className={canAfford ? 'bg-gradient-primary text-primary-foreground' : ''}
                        >Redeem</Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
