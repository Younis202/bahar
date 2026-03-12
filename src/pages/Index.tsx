import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Users, BookOpen, Award, Play, ChevronRight, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CourseCard from '@/components/CourseCard';
import { courses, categories, instructors } from '@/data/mockData';
import heroBg from '@/assets/hero-bg.jpg';
import TestimonialSection from '@/components/TestimonialSection';

const stats = [
  { value: '12,000+', label: 'Students Enrolled', icon: Users },
  { value: '85+', label: 'Expert Courses', icon: BookOpen },
  { value: '18+', label: 'Certified Instructors', icon: Award },
  { value: '4.9/5', label: 'Average Rating', icon: Star },
];

const features = [
  { icon: Shield, title: 'DRM Protected Videos', desc: 'Enterprise-grade video protection. No downloads, no screen recording.' },
  { icon: Zap, title: 'HD Streaming Worldwide', desc: 'Powered by Bunny.net CDN for lightning-fast playback across the Gulf.' },
  { icon: Globe, title: 'Arabic-First Content', desc: 'All courses in Arabic by certified maritime professionals.' },
  { icon: Award, title: 'STCW Aligned', desc: 'Content aligned with international maritime safety standards.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={heroBg} alt="Maritime Academy" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Animated orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              #1 Maritime Education Platform in the Gulf
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Master the{' '}
              <span className="gradient-text">Sea</span>
              {' '}with World-Class{' '}
              <span className="gradient-gold-text">Maritime</span>
              {' '}Education
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              Learn navigation, engineering, safety, and port operations from certified maritime professionals. Courses built for the Gulf region.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow group"
                onClick={() => navigate('/courses')}
              >
                Explore Courses
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border/60 hover:border-primary/50 group"
                onClick={() => navigate('/register')}
              >
                <Play className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {instructors.map(i => (
                  <img key={i.id} src={i.avatar} alt={i.name} className="w-8 h-8 rounded-full border-2 border-background" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />)}
                </div>
                <p className="text-xs text-muted-foreground">Trusted by <strong className="text-foreground">12,000+</strong> maritime professionals</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border/50 bg-navy-mid/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map(({ value, label, icon: Icon }) => (
              <motion.div key={label} variants={fadeUp} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="font-display text-3xl font-bold text-foreground">{value}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Browse by Category</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Specialized courses across all maritime disciplines</p>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map(cat => (
                <motion.div key={cat.id} variants={fadeUp}>
                  <Link to={`/courses?category=${cat.slug}`}
                    className="group flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-glow transition-all duration-300"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</div>
                    <p className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{cat.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{cat.coursesCount} courses</p>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="section-padding bg-navy-mid/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Featured Courses</h2>
                <p className="text-muted-foreground">Hand-picked by our expert maritime educators</p>
              </div>
              <Link to="/courses" className="hidden md:flex items-center gap-1 text-primary text-sm font-medium hover:underline">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 6).map(course => (
                <motion.div key={course.id} variants={fadeUp}>
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="text-center mt-10">
              <Button variant="outline" size="lg" onClick={() => navigate('/courses')}>
                Browse All Courses <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Why Choose BahriaAcad?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Built specifically for the Gulf maritime industry</p>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map(({ icon: Icon, title, desc }) => (
                <motion.div key={title} variants={fadeUp}
                  className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-glow transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Instructors */}
      <section className="section-padding bg-navy-mid/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Expert Instructors</h2>
              <p className="text-muted-foreground">Learn from certified captains and marine engineers with decades of experience</p>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {instructors.map(inst => (
                <motion.div key={inst.id} variants={fadeUp}
                  className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 text-center"
                >
                  <img src={inst.avatar} alt={inst.name} className="w-20 h-20 rounded-full mx-auto mb-4 ring-2 ring-primary/20" />
                  <h3 className="font-display font-semibold text-foreground">{inst.name}</h3>
                  <p className="text-xs text-primary mt-1 mb-3">{inst.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{inst.bio}</p>
                  <div className="flex justify-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-foreground">{inst.coursesCount}</div>
                      <div className="text-xs text-muted-foreground">Courses</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{(inst.studentsCount / 1000).toFixed(1)}k</div>
                      <div className="text-xs text-muted-foreground">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gold flex items-center gap-1 justify-center">{inst.rating} <Star className="w-3 h-3 fill-gold" /></div>
                      <div className="text-xs text-muted-foreground">Rating</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialSection />

      {/* CTA */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 p-12 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
                Ready to Advance Your Maritime Career?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join 12,000+ maritime professionals who are already learning with BahriaAcad.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow" onClick={() => navigate('/register')}>
                  Start Learning Free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/courses')}>
                  Browse Courses
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
