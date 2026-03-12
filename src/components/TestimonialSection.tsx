import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Capt. Khalid Al-Suwaidi',
    role: 'Master Mariner, UAE',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Khalid&backgroundColor=1a3a5c',
    text: 'BahriaAcad transformed how I prepare my crew. The STCW courses are perfectly aligned with IMO standards. Highly recommended for any maritime professional.',
    rating: 5,
    course: 'STCW Basic Safety',
  },
  {
    name: 'Eng. Fatima Al-Balushi',
    role: 'Chief Engineer, Oman',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Fatima&backgroundColor=1a3a5c',
    text: 'The marine engineering courses are exceptional. Real-world scenarios, HD video quality, and the quiz system keeps me sharp. Worth every dirham.',
    rating: 5,
    course: 'Ship Engineering Fundamentals',
  },
  {
    name: 'Lt. Ahmed Al-Dosari',
    role: 'Naval Officer, Qatar',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ahmed2&backgroundColor=1a3a5c',
    text: 'Finally a maritime education platform built for the Gulf region! Arabic content, responsive instructors, and certificates recognized by port authorities.',
    rating: 5,
    course: 'Bridge Resource Management',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

export default function TestimonialSection() {
  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              What Our <span className="gradient-gold-text">Students</span> Say
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Trusted by maritime professionals across the Gulf region
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="relative bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
              >
                <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full ring-2 ring-primary/20" />
                  <div>
                    <p className="font-display font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-primary/70 bg-primary/5 px-2 py-0.5 rounded">
                    📖 {t.course}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
