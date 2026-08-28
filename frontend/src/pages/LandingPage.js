import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import Marquee from 'react-fast-marquee';
import { BookOpen, Users, Award, ArrowRight, Play, Star, CheckCircle, MapPin, Phone, Mail, Briefcase, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import ClayCourseThumbnail from '../components/ClayCourseThumbnail';
import logo from "../logo.svg";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LandingPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/blogs`).then(({ data }) => setBlogs(data)).catch(() => {});
    axios.get(`${BACKEND_URL}/api/testimonials`).then(({ data }) => setTestimonials(data)).catch(() => {});
    axios.get(`${BACKEND_URL}/api/courses`).then(({ data }) => setCourses(data.slice(0, 3))).catch(() => {});
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  const partners = ['AWS', 'Google CCAI', 'Dialogflow', 'Salesforce', 'NICE CX', 'Amazon Connect'];

  const defaultBlogs = [
    { title: 'What is Agentic AI?', category: 'Fundamentals', excerpt: 'Agentic AI represents autonomous systems that can make decisions, take actions, and interact with environments independently.', readTime: '5 min read', tags: ['AI Basics', 'Automation'] },
    { title: 'Salesforce Agentforce: The Future of CRM', category: 'Salesforce', excerpt: 'Agentforce brings AI-powered autonomous agents to Salesforce, enabling intelligent customer service and sales automation.', readTime: '7 min read', tags: ['Salesforce', 'CRM'] },
    { title: 'Amazon Connect: Cloud Contact Center', category: 'AWS', excerpt: 'Amazon Connect is a cloud-based contact center solution using AI for intelligent routing and real-time analytics.', readTime: '6 min read', tags: ['AWS', 'Contact Center'] },
    { title: 'Dialogflow CX: Conversational AI', category: 'Google Cloud', excerpt: 'Dialogflow CX powers sophisticated chatbots and voice assistants with NLP and enterprise-grade scalability.', readTime: '8 min read', tags: ['Google', 'NLP'] },
    { title: 'Real-World Use Cases of Agentic AI', category: 'Applications', excerpt: 'Explore how companies deploy Agentic AI to reduce costs, improve efficiency, and enhance customer satisfaction.', readTime: '6 min read', tags: ['Use Cases', 'ROI'] },
    { title: 'Building AI Agents with AWS Lex', category: 'Technical', excerpt: 'Step-by-step guide to creating intelligent conversational agents using AWS Lex and Lambda.', readTime: '10 min read', tags: ['AWS Lex', 'Tutorial'] },
  ];

  const defaultTestimonials = [
    { name: 'Alex Johnson', role: 'AI Engineer at TechCorp', content: 'Altanon Learn transformed my career. The hands-on projects and real-world use cases helped me land my dream job in AI.', image_url: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=random', rating: 5 },
    { name: 'Priya Sharma', role: 'Conversational AI Specialist', content: 'The instructors are industry experts. I learned more in 8 weeks than I did in a year of self-study.', image_url: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=random', rating: 5 },
  ];

  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-blue-600" />,
      title: 'Live & Recorded Classes',
      description: 'Choose interactive live batches or learn at your own pace with recorded content',
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: 'Expert Instructors',
      description: 'Learn from industry practitioners with 10+ years of real-world AI experience',
    },
    {
      icon: <Award className="w-8 h-8 text-blue-600" />,
      title: 'Guaranteed Placement Support',
      description: '30+ students already placed in leading companies. Your AI career starts here.',
    },
    {
      icon: <Briefcase className="w-8 h-8 text-blue-600" />,
      title: 'Real-World Projects',
      description: 'Build production-grade AI systems using AWS, Google Cloud, Salesforce & more',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      title: '4+ Years of Excellence',
      description: 'Trusted by IT professionals across India for career-transforming AI education',
    },
    {
      icon: <Play className="w-8 h-8 text-blue-600" />,
      title: 'Hands-On Learning',
      description: 'No theory-only fluff. Every session includes practical coding and deployment',
    },
  ];

  const getImageSrc = (url) => {
    if (!url) return '';
    return url.startsWith('/api') ? `${BACKEND_URL}${url}` : url;
  };

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;
  const displayBlogs = blogs.length > 0 ? blogs : defaultBlogs;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32 px-6">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"></div>

        <motion.div
          className="max-w-7xl mx-auto relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-outfit font-bold mb-6">
                India's Premier Agentic AI Training Platform
              </span>
            </motion.div>
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-outfit font-black tracking-tighter text-slate-900 leading-tight mb-6"
              variants={itemVariants}
            >
              One of the Best Training to Learn
              <span className="block text-blue-600">Agentic AI</span>
            </motion.h1>
            <motion.p
              className="text-lg font-figtree text-slate-600 leading-relaxed max-w-2xl mx-auto mb-4"
              variants={itemVariants}
            >
              From Pune, India — empowering IT professionals to master AWS, Google Dialogflow,
              Salesforce Agentforce, Amazon Connect & more. 30+ successful placements and counting.
            </motion.p>
            <motion.div className="flex items-center justify-center gap-6 text-sm text-slate-500 font-figtree mb-8" variants={itemVariants}>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Pune, India</span>
              <span className="flex items-center gap-1"><Award className="w-4 h-4" /> 4+ Years</span>
              <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> 30+ Placed</span>
            </motion.div>
            <motion.div className="flex gap-4 justify-center" variants={itemVariants}>
              <Link to="/courses" data-testid="browse-courses-btn">
                <Button className="clay-button-primary px-8 py-6 text-lg">
                  Explore Courses <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/about" data-testid="about-link-hero">
                <Button className="clay-button-secondary px-8 py-6 text-lg">
                  About Us
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Trust Stats */}
      <section className="py-8 px-6 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { num: '4+', label: 'Years in Industry' },
              { num: '30+', label: 'Students Placed' },
              { num: '100+', label: 'Students Trained' },
              { num: '95%', label: 'Satisfaction Rate' },
            ].map((s, idx) => (
              <motion.div
                key={idx}
                className="text-center py-4"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <p className="text-3xl font-outfit font-black text-blue-600" data-testid={`stat-${idx}`}>{s.num}</p>
                <p className="text-xs font-figtree text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Logos */}
      <section className="py-12 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <p className="text-xs font-outfit uppercase tracking-[0.2em] font-bold text-slate-500 text-center">
            Technologies We Cover
          </p>
        </div>
        <Marquee gradient={false} speed={40}>
          {partners.map((partner, idx) => (
            <div key={idx} className="mx-6 px-8 py-4 bg-white rounded-2xl shadow-clay-button-light border border-white/60">
              <span className="font-outfit font-bold text-slate-700">{partner}</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* Features */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-outfit font-extrabold tracking-tight text-slate-900 mb-4">
              Why Altanon Learn is the #1 Choice
            </h2>
            <p className="text-base font-figtree text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Designed by industry practitioners. Trusted by IT professionals. Built for real-world success.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                className="clay-card clay-card-hover p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-outfit font-bold tracking-tight text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-sm font-figtree text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {courses.length > 0 && (
        <section className="py-24 px-6 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-outfit font-extrabold tracking-tight text-slate-900">
                Featured Courses
              </h2>
              <Link to="/courses" data-testid="view-all-courses-link">
                <Button className="clay-button-secondary px-6 py-3">
                  View All <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {courses.map((course, idx) => (
                <motion.div
                  key={course.id || idx}
                  className="clay-card clay-card-hover overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <ClayCourseThumbnail
                    title={course.title}
                    category={course.category || 'AI'}
                    className="h-48 w-full"
                  />
                  <div className="p-6">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-outfit font-bold mb-3">
                      {course.category || 'AI'}
                    </span>
                    <h3 className="text-lg font-outfit font-bold text-slate-800 mb-2">{course.title}</h3>
                    <p className="text-sm text-slate-600 font-figtree line-clamp-2 mb-4">{course.description}</p>
                    <Link to={`/courses/${course.id}`}>
                      <Button className="clay-button-secondary w-full text-sm">
                        View Details <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials - Dynamic */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-outfit font-extrabold tracking-tight text-slate-900 text-center mb-4">
            Success Stories
          </h2>
          <p className="text-base font-figtree text-slate-600 text-center mb-16 max-w-2xl mx-auto">
            Hear from IT professionals who transformed their careers with Altanon Learn
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayTestimonials.map((testimonial, idx) => (
              <motion.div
                key={testimonial.id || idx}
                className="clay-card p-8"
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={getImageSrc(testimonial.image_url || testimonial.img)}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover shadow-lg bg-slate-200"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${testimonial.name}&background=random`; }}
                  />
                  <div>
                    <h4 className="font-outfit font-bold text-slate-900">{testimonial.name}</h4>
                    <p className="text-sm text-slate-600 font-figtree">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 font-figtree leading-relaxed">{testimonial.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog & Resources Section */}
      <section className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-outfit font-extrabold tracking-tight text-slate-900 mb-4">
              AI Knowledge Hub
            </h2>
            <p className="text-base font-figtree text-slate-600 max-w-2xl mx-auto">
              Stay ahead with our expert articles, guides, and resources on Agentic AI and Conversational AI
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayBlogs.map((article, idx) => (
              <motion.article
                key={article.id || idx}
                className="clay-card clay-card-hover overflow-hidden group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-outfit font-bold">
                      {article.category}
                    </span>
                    <span className="text-xs text-slate-500 font-figtree">{article.readTime || article.read_time}</span>
                  </div>
                  <h3 className="text-xl font-outfit font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-figtree leading-relaxed mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(article.tags || []).map((tag, tagIdx) => (
                      <span key={tagIdx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-figtree">{tag}</span>
                    ))}
                  </div>
                  {article.pdf_filename ? (
                    <a href={`${BACKEND_URL}/api/blogs/${article.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-outfit font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all" data-testid={`blog-read-more-${article.id}`}>
                      Read More <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : article.read_more_link ? (
                    <a href={article.read_more_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-outfit font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all" data-testid={`blog-read-more-${article.id}`}>
                      Read More <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="text-blue-600 font-outfit font-bold text-sm flex items-center gap-2">
                      Read More <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </motion.article>
            ))}
          </div>

          {/* SEO content */}
          <div className="mt-16 clay-card p-12">
            <h3 className="text-2xl font-outfit font-bold text-slate-900 mb-6 text-center">
              Why Learn Agentic AI & Conversational AI?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-700 font-figtree leading-relaxed">
              <div>
                <h4 className="font-outfit font-bold text-lg text-slate-900 mb-3">Industry Demand</h4>
                <p className="mb-4">
                  The global AI market is projected to reach $1.8 trillion by 2030. Companies are actively seeking professionals skilled in Agentic AI, conversational AI, and intelligent automation platforms.
                </p>
                <p>
                  Roles like AI Engineers, Conversational AI Specialists, and Contact Center AI Architects are among the highest-paying tech positions in 2026.
                </p>
              </div>
              <div>
                <h4 className="font-outfit font-bold text-lg text-slate-900 mb-3">Key Technologies</h4>
                <ul className="space-y-2">
                  {[
                    { bold: 'AWS Lex & Lambda:', text: 'Build scalable conversational bots for customer service' },
                    { bold: 'Salesforce Agentforce:', text: 'Automate CRM workflows with intelligent agents' },
                    { bold: 'Google Dialogflow CX:', text: 'Create enterprise-grade voice and chat assistants' },
                    { bold: 'Amazon Connect:', text: 'Deploy AI-powered cloud contact centers' },
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span><strong>{item.bold}</strong> {item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-outfit font-black tracking-tighter mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl font-figtree mb-8 opacity-90">
            Join 100+ IT professionals who chose Altanon Learn to break into Agentic AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" data-testid="get-started-cta-btn">
              <Button className="bg-white text-blue-600 hover:bg-slate-100 px-10 py-6 rounded-2xl text-lg font-outfit font-bold shadow-2xl">
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="tel:+917875757511">
              <Button className="bg-white/10 text-white hover:bg-white/20 border border-white/30 px-10 py-6 rounded-2xl text-lg font-outfit font-bold">
                <Phone className="mr-2 w-5 h-5" /> Call Us
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={logo}
                  alt="Altanon Logo"
                  className="w-10 h-10"
                />
                <span className="font-outfit font-bold text-slate-900">Altanon AI Works Pvt Ltd</span>
              </div>
              <p className="text-sm text-slate-600 font-figtree leading-relaxed">
                India's premier Agentic AI & Conversational AI training platform. 4+ years of excellence, based in Pune.
              </p>
            </div>
            <div>
              <h4 className="font-outfit font-bold text-slate-900 mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/courses" className="block text-sm text-slate-600 font-figtree hover:text-blue-600 transition-colors">Courses</Link>
                <Link to="/about" className="block text-sm text-slate-600 font-figtree hover:text-blue-600 transition-colors">About Us</Link>
                <Link to="/register" className="block text-sm text-slate-600 font-figtree hover:text-blue-600 transition-colors">Sign Up</Link>
              </div>
            </div>
            <div>
              <h4 className="font-outfit font-bold text-slate-900 mb-4">Contact</h4>
              <div className="space-y-3">
                <a href="tel:+917875757511" className="flex items-center gap-2 text-sm text-slate-600 font-figtree hover:text-blue-600 transition-colors" data-testid="footer-phone">
                  <Phone className="w-4 h-4" /> +91 7875757511
                </a>
                <a href="mailto:learn@altanontech.com" className="flex items-center gap-2 text-sm text-slate-600 font-figtree hover:text-blue-600 transition-colors" data-testid="footer-email">
                  <Mail className="w-4 h-4" /> learn@altanontech.com
                </a>
                <div className="flex items-center gap-2 text-sm text-slate-600 font-figtree" data-testid="footer-location">
                  <MapPin className="w-4 h-4" /> Pune, Maharashtra, India
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-500 font-figtree">
              &copy; {new Date().getFullYear()} Altanon AI Works Pvt Ltd, Pune. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
