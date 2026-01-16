import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const useExternalScripts = (scripts) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let loadCount = 0;
    
    scripts.forEach(src => {
      if (document.querySelector(`script[src="${src}"]`)) {
        loadCount++;
        if (loadCount === scripts.length) setLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        loadCount++;
        if (loadCount === scripts.length) setLoaded(true);
      };
      document.body.appendChild(script);
    });
  }, [scripts]);

  return loaded;
};

// Hook for scroll-triggered animations using IntersectionObserver
const useOnScreen = (options) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect(); // Trigger once
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [options]);

  return [ref, isVisible];
};

/**
 * THREE.JS BACKGROUND COMPONENT
 */
const ThreeBackground = ({ loaded }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!loaded || !mountRef.current || !window.THREE) return;

    const THREE = window.THREE;
    
    // Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Geometry - Abstract Network Grid
    const geometry = new THREE.IcosahedronGeometry(15, 2);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x22c55e, // Tailwind green-500
      wireframe: true,
      transparent: true,
      opacity: 0.15 
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 700;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 80;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.15,
      color: 0x4ade80, // bright green
      transparent: true,
      opacity: 0.4,
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0; 

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event) => {
      mouseX = (event.clientX - windowHalfX);
      mouseY = (event.clientY - windowHalfY);
    };

    document.addEventListener('mousemove', onDocumentMouseMove);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);

      targetX = mouseX * 0.001;
      targetY = mouseY * 0.001;

      sphere.rotation.y += 0.002;
      sphere.rotation.x += 0.001;

      // Gentle wave effect on particles
      particlesMesh.rotation.y += 0.0005;
      particlesMesh.rotation.x = -mouseY * 0.0001;
      particlesMesh.rotation.y = mouseX * 0.0001;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, [loaded]);

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-60" />;
};

/**
 * UI COMPONENTS
 */

const Nav = () => (
  <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-green-500/10 border border-green-500/30 flex items-center justify-center rounded">
          <i className="fa-solid fa-terminal text-green-500 text-sm"></i>
        </div>
        <span className="font-mono font-bold text-lg tracking-tight text-white">BrainWave<span className="text-green-500">_</span></span>
      </Link>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
        <a href="#scenarios" className="hover:text-white transition-colors">Scenarios</a>
        <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
        <a href="#manifesto" className="hover:text-white transition-colors">Manifesto</a>
      </div>
      <Link to="/signup" className="bg-white text-black px-4 py-2 text-sm font-bold hover:bg-zinc-200 transition-colors rounded-sm font-mono">
        Start Simulation
      </Link>
    </div>
  </nav>
);

const SectionHeading = ({ children, subtitle, align = "center" }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.5 });
  
  useEffect(() => {
    if (isVisible && window.gsap) {
      window.gsap.fromTo(ref.current, 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    }
  }, [isVisible]);

  return (
    <div ref={ref} className={`mb-16 opacity-0 ${align === "center" ? "text-center" : "text-left"}`}>
      {subtitle && (
        <span className="inline-block py-1 px-2 rounded bg-green-900/20 border border-green-500/20 text-green-500 text-xs font-mono mb-4">
          {subtitle}
        </span>
      )}
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
        {children}
      </h2>
      <div className={`h-1 w-20 bg-green-500 ${align === "center" ? "mx-auto" : ""}`} />
    </div>
  );
};

const ScenarioCard = ({ icon, title, desc, difficulty, tags, delay }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.2 });
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isVisible && window.gsap) {
      window.gsap.fromTo(cardRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: delay, ease: "power2.out" }
      );
    }
  }, [isVisible, delay]);

  const onMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={element => {
          ref.current = element;
          cardRef.current = element;
      }}
      onMouseMove={onMouseMove}
      className="group relative flex flex-col h-full bg-zinc-900/30 border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-green-900/5"
    >
      {/* Spotlight Effect */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-500"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(74, 222, 128, 0.06), transparent 40%)`,
        }}
      />
      
      {/* Tech Grid Background - Subtle Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-6 flex-grow flex flex-col z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-black/50 border border-white/5 rounded-lg group-hover:scale-110 group-hover:border-green-500/30 transition-all duration-300 shadow-inner">
            <i className={`${icon} text-zinc-400 group-hover:text-green-400 text-2xl transition-colors`}></i>
          </div>
          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border ${
            difficulty === 'Hard' ? 'border-red-500/20 text-red-400 bg-red-500/5' :
            difficulty === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
            'border-green-500/20 text-green-400 bg-green-500/5'
          }`}>
            {difficulty}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">{desc}</p>
        
        <div className="mt-auto pt-6 border-t border-white/5 flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded border border-transparent hover:border-white/10 transition-colors cursor-default">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const FeatureRow = ({ title, desc, icon, reversed }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.4 });

  useEffect(() => {
    if (isVisible && window.gsap) {
      window.gsap.fromTo(ref.current.children,
        { x: reversed ? 50 : -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power3.out" }
      );
    }
  }, [isVisible, reversed]);

  return (
    <div ref={ref} className={`flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 py-12 md:py-24`}>
      <div className="flex-1 opacity-0">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 mb-6">
          <i className={`${icon} text-green-500 text-2xl`}></i>
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{title}</h3>
        <p className="text-zinc-400 text-lg leading-relaxed">{desc}</p>
      </div>
      <div className="flex-1 w-full opacity-0">
        <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black shadow-2xl">
          {/* Abstract UI Mockup */}
          <div className="absolute top-0 w-full h-8 bg-zinc-900 border-b border-white/5 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <div className="p-8 pt-12 font-mono text-xs md:text-sm text-zinc-500 space-y-2">
            <div className="flex gap-4">
              <span className="text-zinc-600">01</span>
              <span className="text-purple-400">const</span>
              <span className="text-blue-400">handleOutage</span>
              <span className="text-zinc-300">=</span>
              <span className="text-yellow-300">async</span>
              <span className="text-zinc-300">()</span>
              <span className="text-zinc-300">{`=> {`}</span>
            </div>
            <div className="flex gap-4 pl-4">
              <span className="text-zinc-600">02</span>
              <span className="text-zinc-400">// Warning: Database latency spiking</span>
            </div>
            <div className="flex gap-4 pl-4">
              <span className="text-zinc-600">03</span>
              <span className="text-zinc-300">await</span>
              <span className="text-blue-400">system</span>.
              <span className="text-yellow-300">scaleReadReplicas</span>();
            </div>
             <div className="flex gap-4 pl-4">
              <span className="text-zinc-600">04</span>
              <span className="text-red-400">Error: Connection pool exhausted...</span>
            </div>
             <div className="flex gap-4">
              <span className="text-zinc-600">05</span>
              <span className="text-zinc-300">{'}'}</span>
            </div>
            <div className="absolute bottom-4 right-4 animate-pulse">
              <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 rounded text-xs">
                CRITICAL ALERT
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TerminalHero = () => {
  const [textIndex, setTextIndex] = useState(0);
  const texts = [
    "Production is Down.",
    "Latency is Spiking.",
    "Data is Corrupt."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-0 pointer-events-none" />
      
      <div className="z-10 container mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/5 text-green-400 text-xs font-mono mb-8 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          System Status: Critical
        </div>

        <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-white mb-6 font-mono">
          <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
            {texts[textIndex]}
          </span>
          <span className="block mt-2 text-green-500">You're Up.</span>
        </h1>

        <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The first flight simulator for backend engineers.
          <br className="hidden md:block" />
          Experience real-world incidents without risking real users.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Link to="/signup" className="w-full md:w-auto px-8 py-4 bg-white text-black font-bold text-lg rounded hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 group">
            Start Incident
            <i className="fa-solid fa-chevron-right text-lg group-hover:translate-x-1 transition-transform"></i>
          </Link>
          <Link to="/scenarios" className="w-full md:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-lg rounded hover:bg-zinc-800 transition-colors font-mono">
            $ view_scenarios
          </Link>
        </div>

        {/* Stats Strip */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-8 max-w-4xl mx-auto">
          {[
            { label: "Scenarios", value: "50+" },
            { label: "Tech Stacks", value: "12" },
            { label: "Engineers Trained", value: "10k+" },
            { label: "Uptime Saved", value: "∞" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white font-mono">{stat.value}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="border-t border-white/10 bg-black pt-20 pb-10">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-terminal text-green-500 text-xl"></i>
            <span className="font-mono font-bold text-xl text-white">DevIncident<span className="text-green-500">_</span></span>
          </div>
          <p className="text-zinc-400 max-w-xs">
            Master the art of reliability engineering through simulation.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-zinc-400 text-sm">
              <li><a href="#" className="hover:text-green-400">Scenarios</a></li>
              <li><a href="#" className="hover:text-green-400">Enterprise</a></li>
              <li><a href="#" className="hover:text-green-400">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-zinc-400 text-sm">
              <li><a href="#" className="hover:text-green-400">Documentation</a></li>
              <li><a href="#" className="hover:text-green-400">Post-Mortems</a></li>
              <li><a href="#" className="hover:text-green-400">Blog</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600 font-mono">
        <p>© 2024 DevIncident Inc. All systems operational.</p>
        <div className="flex gap-4">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Status</span>
        </div>
      </div>
    </div>
  </footer>
);

/**
 * MAIN APP COMPONENT
 */
const App = () => {
  // Load GSAP and Three.js
  const scriptsLoaded = useExternalScripts([
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
  ]);

  // Inject Font Awesome
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
    return () => {
      // Cleanup if needed, though rarely necessary for single page app lifetime
      if(document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  return (
    <div className="bg-black min-h-screen text-white selection:bg-green-500/30 font-sans">
      <ThreeBackground loaded={scriptsLoaded} />
      <Nav />
      
      <main>
        <TerminalHero />

        {/* Value Prop Section */}
        <section id="manifesto" className="py-24 bg-zinc-900/30 backdrop-blur-sm border-y border-white/5">
          <div className="container mx-auto px-6">
            <SectionHeading subtitle="The Problem" align="left">
              Leetcode won't save you<br />at 3:00 AM.
            </SectionHeading>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {[
                {
                  icon: "fa-solid fa-triangle-exclamation",
                  title: "Theoretical != Practical",
                  desc: "Solving binary tree inversions doesn't help when a cascading failure hits your microservices."
                },
                {
                  icon: "fa-solid fa-chart-line",
                  title: "Pressure is Real",
                  desc: "Learn to make decisions under the constraints of time, money, and user impact."
                },
                {
                  icon: "fa-solid fa-server",
                  title: "Complex Systems",
                  desc: "Debug distributed systems where the root cause is never in the service that's alerting."
                }
              ].map((item, i) => (
                <div key={i} className="p-6 border-l border-white/10 hover:border-green-500 transition-colors">
                  <i className={`${item.icon} text-zinc-500 mb-4 text-3xl`}></i>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Scenarios Grid */}
        <section id="scenarios" className="py-32 relative">
          <div className="container mx-auto px-6 relative z-10">
            <SectionHeading subtitle="Simulation Library">
              Choose Your Disaster
            </SectionHeading>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
              <ScenarioCard 
                icon="fa-solid fa-plug-circle-xmark"
                title="The Split Brain"
                desc="Your primary database node just vanished. The replica is lagging by 4 minutes. Promote or wait?"
                difficulty="Hard"
                tags={["Postgres", "HA", "Data Loss"]}
                delay={0}
              />
              <ScenarioCard 
                icon="fa-solid fa-arrow-trend-up"
                title="Memory Leak"
                desc="API latency is climbing. OOM kills are frequent. Rollback the deployment or hotfix the loop?"
                difficulty="Medium"
                tags={["Node.js", "K8s", "Profiling"]}
                delay={0.1}
              />
              <ScenarioCard 
                icon="fa-solid fa-globe"
                title="DDoS Attack"
                desc="Traffic is up 5000%. Your load balancers are melting. Configure rate limiting before costs explode."
                difficulty="Hard"
                tags={["Security", "Networking", "WAF"]}
                delay={0.2}
              />
              <ScenarioCard 
                icon="fa-solid fa-box-open"
                title="Dependency Hell"
                desc="A 3rd party API is throwing 500s. Your retry logic is creating a thundering herd."
                difficulty="Easy"
                tags={["Microservices", "Patterns"]}
                delay={0.3}
              />
              <ScenarioCard 
                icon="fa-solid fa-stopwatch"
                title="Race Condition"
                desc="Users are reporting double charges. It only happens under load. Find the critical section."
                difficulty="Medium"
                tags={["Concurrency", "Transactions"]}
                delay={0.4}
              />
              <ScenarioCard 
                icon="fa-solid fa-file-circle-exclamation"
                title="Bad Migration"
                desc="The schema migration locked the users table. The site is down. How do you recover safely?"
                difficulty="Hard"
                tags={["SQL", "Ops"]}
                delay={0.5}
              />
            </div>
          </div>
        </section>

        {/* How it Works / Features */}
        <section id="how-it-works" className="py-24 bg-gradient-to-b from-black to-zinc-900/50">
          <div className="container mx-auto px-6">
            <FeatureRow 
              title="Real Logs. Real Metrics."
              desc="No abstract word problems. You get a terminal, a Grafana-style dashboard, and an error log. Diagnose the issue using tools you actually use in production."
              icon="fa-solid fa-chart-line"
              reversed={false}
            />
            <FeatureRow 
              title="Consequences Matter."
              desc="Every decision impacts your 'Reliability Score'. Downtime costs virtual money. Data loss hits your reputation. Feel the weight of the enter key."
              icon="fa-solid fa-triangle-exclamation"
              reversed={true}
            />
            <FeatureRow 
              title="Post-Mortem Analysis."
              desc="After the incident, get a detailed breakdown of what went wrong, what went right, and how you compare to other engineers globally."
              icon="fa-solid fa-circle-check"
              reversed={false}
            />
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-green-500/5 z-0" />
          {/* Add a subtle grid to CTA background too */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-20" />

          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tighter">
              Ready to break things?
            </h2>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Join 10,000+ engineers mastering production systems.
              <br />
              Get your first 3 scenarios for free.
            </p>
            
            <div className="flex flex-col items-center gap-4">
              <div className="group relative w-full max-w-md bg-zinc-900/80 backdrop-blur-sm p-1 rounded-xl border border-white/10 flex items-center shadow-2xl transition-all duration-300 focus-within:border-green-500/50 focus-within:ring-1 focus-within:ring-green-500/20">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />
                <input 
                  type="email" 
                  placeholder="enter_email_address" 
                  className="relative z-10 bg-transparent border-none outline-none text-white w-full font-mono placeholder-zinc-600 pl-4 py-3"
                />
                <button className="relative z-10 bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-green-400 hover:scale-105 transition-all duration-200 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                  Join
                </button>
              </div>
              <p className="text-xs text-zinc-600 font-mono mt-2 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
                 No credit card required. Full sudo access.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default App;