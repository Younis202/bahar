import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tag, Gift, Calendar, Copy, Check, ShoppingCart, Users
} from 'lucide-react';
import { db } from '@/lib/supabaseAny';

interface Coupon {
  id: string;
  code: string;
  discount_value: number;
  discount_type: string;
  description: string | null;
  usage_limit: number;
  used_count: number;
  expires_at: string | null;
  applicable_to: string | null;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number;
  image_url: string | null;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: couponData }, { data: bundleData }] = await Promise.all([
      db.from('coupons').select('*').eq('active', true),
      db.from('course_bundles').select('*').eq('active', true),
    ]);
    setCoupons((couponData as unknown as Coupon[]) || []);
    setBundles((bundleData as unknown as Bundle[]) || []);
    setLoading(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
              <span className="gradient-gold-text">Deals</span> & Promotions
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Save on maritime education with exclusive discounts, bundles, and coupon codes.
            </p>
          </div>

          {bundles.length > 0 && (
            <>
              <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
                <Gift className="w-6 h-6 text-accent" /> Course Bundles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {bundles.map(bundle => {
                  const savings = Number(bundle.original_price) - Number(bundle.price);
                  return (
                    <div key={bundle.id} className="bg-card border border-accent/20 rounded-xl p-6 hover:border-accent/40 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-4 py-1.5 rounded-bl-xl text-sm font-bold">
                        Save ${savings.toFixed(0)}
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2 mt-4">{bundle.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{bundle.description}</p>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="font-display text-3xl font-bold">${Number(bundle.price).toFixed(0)}</span>
                        <span className="text-lg text-muted-foreground line-through">${Number(bundle.original_price).toFixed(0)}</span>
                      </div>
                      <Button className="w-full bg-gradient-primary text-primary-foreground">
                        <ShoppingCart className="w-4 h-4 mr-2" /> Get Bundle
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {coupons.length > 0 && (
            <>
              <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
                <Tag className="w-6 h-6 text-primary" /> Available Coupons
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map(coupon => (
                  <div key={coupon.id} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:border-primary/30 transition-all">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-display text-xl font-bold text-primary">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{coupon.description || `${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : '$'} off`}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {coupon.applicable_to || 'All courses'}</span>
                        {coupon.expires_at && (
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Expires {new Date(coupon.expires_at).toLocaleDateString()}</span>
                        )}
                        {coupon.usage_limit > 0 && (
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {coupon.usage_limit - coupon.used_count} left</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-1 rounded-lg bg-secondary border border-border text-sm font-mono font-bold tracking-wider">{coupon.code}</code>
                        <Button variant="ghost" size="sm" onClick={() => copyCode(coupon.code)} className="h-7">
                          {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {coupons.length === 0 && bundles.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No deals available at the moment. Check back soon!</p>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
