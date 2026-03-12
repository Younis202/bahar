import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownLeft,
  Plus, RefreshCw, TrendingUp, History, Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabaseAny';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

export default function Wallet() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    setLoading(true);
    const { data } = await db
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setTransactions((data as unknown as Transaction[]) || []);
    setLoading(false);
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) return;

    const { error } = await db.from('wallet_transactions').insert({
      user_id: user!.id,
      type: 'credit',
      amount,
      description: `Wallet top-up via Credit Card`,
      status: 'completed',
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await db.from('profiles').update({
        wallet_balance: (profile?.wallet_balance || 0) + amount
      }).eq('id', user!.id);
      toast({ title: 'Success', description: `$${amount.toFixed(2)} added to your wallet` });
      setTopUpAmount('');
      loadTransactions();
      refreshProfile();
    }
  };

  const totalCredits = transactions.filter(t => t.type === 'credit' && t.status === 'completed').reduce((s, t) => s + Number(t.amount), 0);
  const totalDebits = transactions.filter(t => t.type === 'debit' && t.status === 'completed').reduce((s, t) => s + Number(t.amount), 0);
  const pendingAmount = transactions.filter(t => t.status === 'pending').reduce((s, t) => s + Number(t.amount), 0);

  const stats = [
    { label: 'Total Balance', value: `$${(profile?.wallet_balance || 0).toFixed(2)}`, icon: WalletIcon, color: 'text-primary' },
    { label: 'Total Earned', value: `$${totalCredits.toFixed(2)}`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Total Spent', value: `$${totalDebits.toFixed(2)}`, icon: ArrowUpRight, color: 'text-orange-400' },
    { label: 'Pending', value: `$${pendingAmount.toFixed(2)}`, icon: Clock, color: 'text-yellow-400' },
  ];

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <WalletIcon className="w-7 h-7 text-primary" /> My Wallet
              </h1>
              <p className="text-muted-foreground mt-1">Manage your balance, earnings, and transactions</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" /> Top Up
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Top Up Wallet</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map(amount => (
                      <button key={amount} onClick={() => setTopUpAmount(amount.toString())}
                        className={`p-3 rounded-lg border text-center font-semibold transition-colors ${
                          topUpAmount === amount.toString() ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >${amount}</button>
                    ))}
                  </div>
                  <Input type="number" placeholder="Or enter custom amount..." value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} />
                  <Button className="w-full bg-gradient-primary text-primary-foreground" disabled={!topUpAmount} onClick={handleTopUp}>
                    Top Up ${topUpAmount || '0'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-5">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="font-display text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Transaction History
              </h2>
              <div className="flex gap-1">
                {(['all', 'credit', 'debit'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                      filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >{f === 'all' ? 'All' : f === 'credit' ? 'Income' : 'Spent'}</button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No transactions yet</div>
            ) : (
              <div className="divide-y divide-border/50">
                {filtered.map(tx => (
                  <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-secondary/20 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                      {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5 text-green-400" /> : <ArrowUpRight className="w-5 h-5 text-orange-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-400' : 'text-foreground'}`}>
                        {tx.type === 'credit' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </p>
                      <Badge variant="outline" className={`text-xs ${tx.status === 'pending' ? 'text-yellow-400 border-yellow-500/20' : 'text-muted-foreground'}`}>
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
