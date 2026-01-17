import { ArrowRight, BookOpen, Headphones, Award, Users, Clock, CheckCircle2, Star, ChevronDown } from 'lucide-react';
import { levels } from '@/data/mockData';

interface LandingPageProps {
  onStartTest: () => void;
}

export const LandingPage = ({ onStartTest }: LandingPageProps) => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center dot-pattern overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-40 right-20 w-32 h-32 bg-level-a2/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-40 right-40 w-16 h-16 bg-level-b1/10 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8 animate-slide-up">
              <Star className="w-4 h-4 fill-primary" />
              <span className="font-medium text-sm">Trusted by 50,000+ learners worldwide</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
              MASTER YOUR ENGLISH.
              <br />
              <span className="text-gradient">ACHIEVE CEFR SUCCESS</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Practice with authentic mock tests, track your progress, and get certified. 
              From A1 to C1, we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <button 
                onClick={onStartTest}
                className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
              >
                Start FREE Mock Test
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="btn-outline flex items-center gap-2 text-lg px-8 py-4">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center justify-center gap-8 mt-12 text-muted-foreground animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-level-a1" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-level-a1" />
                <span>Instant results</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-level-a1" />
                <span>CEFR aligned</span>
              </div>
            </div>
          </div>
        </div>

        <a href="#features" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-muted-foreground" />
        </a>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '50K+', label: 'Active Users' },
              { value: '200+', label: 'Practice Tests' },
              { value: '5', label: 'CEFR Levels' },
              { value: '95%', label: 'Pass Rate' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-secondary-foreground/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
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
                description: 'Practice with authentic reading passages and question types matching real CEFR exams.',
                color: 'bg-level-a1/10 text-level-a1',
              },
              {
                icon: Headphones,
                title: 'Listening Tests',
                description: 'Audio-based tests with native speakers to improve your listening comprehension.',
                color: 'bg-level-a2/10 text-level-a2',
              },
              {
                icon: Clock,
                title: 'Timed Practice',
                description: 'Simulate real exam conditions with our accurate timer and progress tracking.',
                color: 'bg-level-b1/10 text-level-b1',
              },
              {
                icon: Award,
                title: 'Instant Results',
                description: 'Get immediate feedback with detailed explanations for every question.',
                color: 'bg-level-b2/10 text-level-b2',
              },
              {
                icon: Users,
                title: 'Expert Support',
                description: 'Access to certified CEFR instructors for guidance and tips.',
                color: 'bg-primary/10 text-primary',
              },
              {
                icon: CheckCircle2,
                title: 'Progress Tracking',
                description: 'Monitor your improvement across all skill areas and levels.',
                color: 'bg-level-a1/10 text-level-a1',
              },
            ].map((feature, index) => (
              <div key={index} className="card-elevated group">
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Levels Section */}
      <section id="levels" className="py-20 lg:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Choose Your <span className="text-gradient">Level</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From beginner to advanced, we have tests tailored for every proficiency level
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {levels.map((level, index) => (
              <div 
                key={level.level}
                className="level-card text-center group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`level-badge text-${level.color}`}>
                  {level.level}
                </div>
                <h3 className="text-lg font-semibold mb-2">{level.name}</h3>
                <p className="text-sm text-muted-foreground">{level.description}</p>
                <div className={`absolute inset-x-0 bottom-0 h-1 bg-${level.color} transform scale-x-0 group-hover:scale-x-100 transition-transform rounded-b-2xl`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to start your CEFR preparation journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Choose Your Level',
                description: 'Select from A1 to C1 based on your current English proficiency',
              },
              {
                step: '02',
                title: 'Take Mock Tests',
                description: 'Complete Reading and Listening tests with real exam conditions',
              },
              {
                step: '03',
                title: 'Review & Improve',
                description: 'Analyze your results and focus on areas that need improvement',
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="text-6xl font-display font-bold text-primary/10 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-8 h-8 text-primary/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
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
              <div key={index} className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-semibold text-primary-foreground">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-secondary-foreground/70">{testimonial.level}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-secondary-foreground/80">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
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
                q: 'Can I access tests on mobile devices?',
                a: 'Absolutely! Our platform is fully responsive and works seamlessly on smartphones, tablets, and desktop computers.',
              },
              {
                q: 'How long does each test take?',
                a: 'Each mock test is designed to be completed in 30 minutes, similar to the timing of actual CEFR exam sections.',
              },
            ].map((faq, index) => (
              <details key={index} className="group card-elevated cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-lg list-none">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-primary group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-4 text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of learners who have achieved their CEFR goals with our platform.
          </p>
          <button 
            onClick={onStartTest}
            className="bg-white text-primary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2"
          >
            Start Your FREE Test Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
};
