import { ArrowRight, BookOpen, Headphones, Award, Users, Clock, CheckCircle2, Star, ChevronDown, Zap, Globe, TrendingUp, Shield } from 'lucide-react';
import { levels } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onStartTest: () => void;
}

export const LandingPage = ({ onStartTest }: LandingPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartTest = () => {
    if (user) {
      onStartTest();
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/50">
        {/* Background Elements */}
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-level-a2/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-slide-up">
                <Star className="w-4 h-4 fill-primary" />
                <span className="font-medium text-sm">Trusted by 50,000+ learners worldwide</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Master Your English.
                <br />
                <span className="text-gradient">Achieve CEFR Success</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Practice with authentic mock tests designed by language experts. 
                Track your progress, identify weaknesses, and achieve your certification goals.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <button 
                  onClick={handleStartTest}
                  className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
                >
                  {user ? 'Start Mock Test' : 'Start FREE Mock Test'}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="btn-outline flex items-center gap-2 text-lg px-8 py-4">
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-6 mt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-level-a1" />
                  <span className="text-muted-foreground">No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-level-a1" />
                  <span className="text-muted-foreground">Instant results</span>
                </div>
              </div>
            </div>

            {/* Right Content - Stats Cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { icon: BookOpen, value: '200+', label: 'Practice Tests', color: 'from-emerald-400 to-teal-500' },
                { icon: Users, value: '50K+', label: 'Active Users', color: 'from-blue-400 to-indigo-500' },
                { icon: Award, value: '95%', label: 'Pass Rate', color: 'from-amber-400 to-orange-500' },
                { icon: Globe, value: '5', label: 'CEFR Levels', color: 'from-primary to-red-600' },
              ].map((stat, index) => (
                <div 
                  key={index}
                  className="card-elevated p-6 animate-slide-up"
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-display font-bold mb-1">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <a href="#features" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-muted-foreground" />
        </a>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground mb-8">Aligned with international language standards</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
            {['IELTS', 'TOEFL', 'Cambridge', 'Goethe', 'DELF'].map((brand) => (
              <div key={brand} className="text-2xl font-display font-bold text-muted-foreground/50">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-primary font-semibold mb-4">FEATURES</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              Everything You Need to <span className="text-gradient">Succeed</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive tools and resources designed to help you achieve your CEFR certification
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Reading Tests',
                description: 'Practice with authentic reading passages and question types matching real CEFR exams. 4 parts, 40 questions per test.',
                color: 'bg-emerald-500',
              },
              {
                icon: Headphones,
                title: 'Listening Tests',
                description: 'Audio-based tests with realistic scenarios to improve your listening comprehension skills.',
                color: 'bg-blue-500',
              },
              {
                icon: Clock,
                title: 'Timed Practice',
                description: 'Simulate real exam conditions with accurate 30-minute timers and progress tracking.',
                color: 'bg-amber-500',
              },
              {
                icon: Zap,
                title: 'Instant Results',
                description: 'Get immediate feedback with detailed explanations and performance analysis.',
                color: 'bg-purple-500',
              },
              {
                icon: TrendingUp,
                title: 'Progress Tracking',
                description: 'Monitor your improvement across all skill areas with comprehensive analytics.',
                color: 'bg-pink-500',
              },
              {
                icon: Shield,
                title: 'Expert Content',
                description: 'All tests created by certified CEFR instructors following official guidelines.',
                color: 'bg-primary',
              },
            ].map((feature, index) => (
              <div key={index} className="card-elevated group p-8">
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Levels Section */}
      <section id="levels" className="py-20 lg:py-32 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-primary font-semibold mb-4">CEFR LEVELS</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              Choose Your <span className="text-gradient">Level</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From beginner to advanced, we have tests tailored for every proficiency level
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {levels.map((level, index) => {
              const colors: Record<string, string> = {
                A1: 'from-emerald-400 to-emerald-600',
                A2: 'from-teal-400 to-teal-600',
                B1: 'from-amber-400 to-amber-600',
                B2: 'from-orange-400 to-orange-600',
                C1: 'from-red-400 to-red-600',
              };
              
              return (
                <button
                  key={level.level}
                  onClick={handleStartTest}
                  className="level-card text-center group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${colors[level.level]} text-white text-2xl font-display font-bold mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    {level.level}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{level.name}</h3>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-primary font-semibold mb-4">HOW IT WORKS</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              Three Simple <span className="text-gradient">Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Choose Your Level',
                description: 'Select from A1 to C1 based on your current English proficiency',
                icon: '🎯',
              },
              {
                step: '02',
                title: 'Take Mock Tests',
                description: 'Complete Reading and Listening tests under real exam conditions',
                icon: '📝',
              },
              {
                step: '03',
                title: 'Review & Improve',
                description: 'Analyze your results and focus on areas that need improvement',
                icon: '📈',
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center p-8">
                <div className="text-6xl mb-4">{item.icon}</div>
                <div className="text-sm text-primary font-bold mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-display font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-12 -right-4 w-8 h-8 text-primary/30" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={handleStartTest}
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-primary font-semibold mb-4">TESTIMONIALS</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              What Our <span className="text-primary">Students Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Aziza Karimova',
                level: 'B2 Certified',
                text: 'CEFR Test Hub helped me prepare for my B2 exam in just 3 months. The practice tests were exactly like the real exam!',
                avatar: 'AK',
              },
              {
                name: 'Sardor Rahimov',
                level: 'C1 Certified',
                text: 'The instant feedback and detailed explanations made understanding my mistakes so much easier. Highly recommended!',
                avatar: 'SR',
              },
              {
                name: 'Malika Usmanova',
                level: 'B1 Certified',
                text: 'I love how I can practice anytime, anywhere. The mobile-friendly interface is perfect for busy students.',
                avatar: 'MU',
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-red-600 flex items-center justify-center font-semibold text-lg text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{testimonial.name}</div>
                    <div className="text-sm text-secondary-foreground/70">{testimonial.level}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-secondary-foreground/80 leading-relaxed">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-primary font-semibold mb-4">FAQ</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'What is CEFR?',
                a: 'The Common European Framework of Reference for Languages (CEFR) is an international standard for describing language ability. It uses a six-point scale, from A1 for beginners to C2 for those who have mastered a language.',
              },
              {
                q: 'How many practice tests are available?',
                a: 'We offer 20 mock tests for each skill (Reading and Listening) at every CEFR level (A1-C1), giving you access to over 200 practice tests in total.',
              },
              {
                q: 'Are the tests similar to real CEFR exams?',
                a: 'Yes! Our tests are designed to mirror the format, difficulty, and question types of official CEFR examinations, providing authentic exam practice.',
              },
              {
                q: 'Can I track my progress over time?',
                a: 'Absolutely! Create a free account to save your test results and track your improvement across all levels and skills.',
              },
              {
                q: 'How long does each test take?',
                a: 'Each mock test is designed to be completed in 30 minutes, similar to the timing of actual CEFR exam sections.',
              },
            ].map((faq, index) => (
              <details key={index} className="group card-elevated cursor-pointer p-6">
                <summary className="flex items-center justify-between font-semibold text-lg list-none">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-primary group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary to-red-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of learners who have achieved their CEFR goals with our platform.
          </p>
          <button 
            onClick={handleStartTest}
            className="bg-white text-primary px-10 py-5 rounded-xl font-semibold text-lg hover:bg-white/90 transition-colors inline-flex items-center gap-3 shadow-lg"
          >
            Start Your FREE Test Now
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>
    </div>
  );
};
