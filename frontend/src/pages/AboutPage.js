import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Award, Users, Target, CheckCircle, ArrowRight, BookOpen, Briefcase, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import logo from "../logo.svg";

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-sm font-outfit uppercase tracking-[0.2em] font-bold text-blue-600 mb-4">About Altanon AI Works Pvt Ltd</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-outfit font-black tracking-tighter text-slate-900 leading-tight mb-6">
              Building India's Finest
              <span className="block text-blue-600">AI Training Institute</span>
            </h1>
            <p className="text-lg font-figtree text-slate-600 leading-relaxed max-w-3xl mx-auto">
              Based in Pune, Altanon AI Works Pvt Ltd has been at the forefront of Agentic AI and Conversational AI education for over 4 years.
              We believe in transforming IT professionals into AI leaders who shape the future of intelligent automation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: '4+', label: 'Years in Industry', icon: <Award className="w-6 h-6 text-blue-600" /> },
              { number: '30+', label: 'Students Placed', icon: <Briefcase className="w-6 h-6 text-green-600" /> },
              { number: '100+', label: 'Students Trained', icon: <Users className="w-6 h-6 text-indigo-600" /> },
              { number: '10+', label: 'Industry Partners', icon: <Globe className="w-6 h-6 text-orange-600" /> },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className="clay-card p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex justify-center mb-3">{stat.icon}</div>
                <p className="text-3xl font-outfit font-black text-slate-900">{stat.number}</p>
                <p className="text-sm font-figtree text-slate-600 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl sm:text-4xl font-outfit font-black tracking-tighter text-slate-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-slate-700 font-figtree leading-relaxed">
                <p>
                  Altanon AI Works Pvt Ltd was founded in Pune with a clear mission: to bridge the gap between
                  traditional IT skills and the rapidly evolving world of Artificial Intelligence. For over
                  4 years, we've been empowering IT professionals to transition into high-demand AI roles.
                </p>
                <p>
                  What started as a small training initiative has grown into one of India's most trusted
                  platforms for Agentic AI and Conversational AI education. Our curriculum is designed by
                  industry practitioners who bring real-world project experience into every classroom.
                </p>
                <p>
                  We've successfully placed more than 30 IT professionals in leading companies, helping
                  them command higher salaries and work on cutting-edge AI projects. Our alumni now work
                  at top-tier organizations deploying intelligent automation solutions across industries.
                </p>
                <p className="font-outfit font-bold text-slate-900 text-lg">
                  We're not just teaching AI — we're building a community of innovators who are making the world better, one intelligent solution at a time.
                </p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="clay-card p-8 space-y-6">
                <h3 className="text-xl font-outfit font-bold text-slate-900">Why Choose Altanon Learn?</h3>
                {[
                  'Industry-recognized curriculum designed by AI practitioners',
                  'Hands-on projects with AWS, Google CCAI, Salesforce Agentforce',
                  'Dedicated placement support with 30+ successful placements',
                  'Live interactive batches with real-world case studies',
                  'Affordable pricing with flexible payment options',
                  'Post-training mentorship and community support',
                  'Partnerships with leading tech companies',
                  'Located in Pune — India\'s top tech hub',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 font-figtree">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-8 h-8 text-blue-600" />,
                title: 'Our Mission',
                description: 'To democratize AI education and make world-class Agentic AI training accessible to every IT professional in India and beyond.',
              },
              {
                icon: <BookOpen className="w-8 h-8 text-indigo-600" />,
                title: 'Our Approach',
                description: 'We combine theoretical foundations with hands-on projects, ensuring every student can build production-ready AI solutions from day one.',
              },
              {
                icon: <Users className="w-8 h-8 text-green-600" />,
                title: 'Our Community',
                description: 'A growing network of AI professionals, mentors, and industry partners working together to push the boundaries of intelligent automation.',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="clay-card p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-lg font-outfit font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-sm text-slate-600 font-figtree leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6" id="contact">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-outfit font-black tracking-tighter text-slate-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-lg font-figtree text-slate-600 mb-12">
              Have questions about our courses? Want to know more about how Altanon Learn can help your AI career?
              We'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <motion.a
              href="tel:+917875757511"
              className="clay-card clay-card-hover p-8 text-center block"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              data-testid="contact-phone"
            >
              <Phone className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <p className="font-outfit font-bold text-slate-900 text-lg mb-1">Call Us</p>
              <p className="text-sm text-slate-600 font-figtree">+91 7875757511</p>
            </motion.a>

            <motion.a
              href="mailto:learn@altanontech.com"
              className="clay-card clay-card-hover p-8 text-center block"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              data-testid="contact-email"
            >
              <Mail className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <p className="font-outfit font-bold text-slate-900 text-lg mb-1">Email Us</p>
              <p className="text-sm text-slate-600 font-figtree">learn@altanontech.com</p>
            </motion.a>

            <motion.div
              className="clay-card p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              data-testid="contact-location"
            >
              <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <p className="font-outfit font-bold text-slate-900 text-lg mb-1">Visit Us</p>
              <p className="text-sm text-slate-600 font-figtree">Pune, Maharashtra, India</p>
            </motion.div>
          </div>

          <Link to="/register" data-testid="about-get-started-btn">
            <Button className="clay-button-primary px-10 py-6 text-lg">
              Start Your AI Journey <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200 bg-white/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Altanon Logo"
              className="w-10 h-10"
            />
            <span className="font-outfit font-bold text-slate-900">Altanon AI Works Pvt Ltd</span>
          </div>
          <p className="text-sm text-slate-500 font-figtree">
            &copy; {new Date().getFullYear()} Altanon AI Works Pvt Ltd, Pune. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-600 font-figtree">
            <a href="tel:+917875757511" className="hover:text-blue-600 transition-colors">+91 7875757511</a>
            <a href="mailto:learn@altanontech.com" className="hover:text-blue-600 transition-colors">learn@altanontech.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
