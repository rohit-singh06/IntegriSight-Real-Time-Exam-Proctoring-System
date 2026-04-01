// js/about.js

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('year').textContent = new Date().getFullYear();

    // Intersection Observer for scroll reveal animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                // If it's the stats section, fire the counters
                if (entry.target.id === 'stats-section' && !entry.target.dataset.counted) {
                    entry.target.dataset.counted = 'true';
                    document.querySelectorAll('.counter').forEach(countNode => {
                        const target = parseInt(countNode.getAttribute('data-target'));
                        const duration = 2000;
                        const start = performance.now();
                        
                        const step = (now) => {
                            const progress = Math.min((now - start) / duration, 1);
                            const eased = 1 - Math.pow(1 - progress, 3);
                            countNode.textContent = Math.floor(eased * target);
                            if (progress < 1) requestAnimationFrame(step);
                        };
                        requestAnimationFrame(step);
                    });
                }
            }
        });
    }, observerOptions);

    // 1. Populating Project Features
    const projFeaturesContainer = document.getElementById('project-features');
    const features = [
        { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>', title: 'Real-Time AI Monitoring', desc: 'Webcam-based face and gaze detection running every 2 seconds' },
        { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>', title: 'AI Question Generation', desc: 'Advanced open-source LLMs create tailored MCQs from a simple topic prompt' },
        { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>', title: 'Live Risk Scoring', desc: 'Dynamic 0–100 risk scores updated as violations are detected' }
    ];
    projFeaturesContainer.innerHTML = features.map((f, i) => `
        <div class="reveal-up" style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; transition-delay: ${(i+1)*0.15}s;">
            <div style="width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; background: rgba(99,82,221,0.15); display: flex; align-items: center; justify-content: center;">
                ${f.icon}
            </div>
            <div>
                <div style="font-size: 14px; color: white; font-weight: 600;">${f.title}</div>
                <div style="font-size: 13px; color: #666; margin-top: 3px;">${f.desc}</div>
            </div>
        </div>
    `).join('');

    // 2. Populating Tech Stack
    const techGrid = document.getElementById('tech-grid');
    const techs = [
        { icon: '📄', color: '#e34f26', bg: 'rgba(227,79,38,0.1)', name: 'Vanilla HTML', cat: 'Frontend Architecture', desc: 'Semantic layouts eliminating React VDOM overhead' },
        { icon: '🎨', color: '#1572b6', bg: 'rgba(21,114,182,0.1)', name: 'Pure CSS3', cat: 'Design System', desc: 'Keyframe animations and Flex/Grid without Tailwind dependencies' },
        { icon: '⚡', color: '#f7df1e', bg: 'rgba(247,223,30,0.1)', name: 'Vanilla JS', cat: 'Logic Layer', desc: 'Modern ES6+ standards for DOM manipulation and web APIs' },
        { icon: '🐍', color: '#c0c0d8', bg: 'rgba(255,255,255,0.06)', name: 'Flask', cat: 'Backend', desc: 'Lightweight Python REST API serving the AI engine' },
        { icon: '👁️', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', name: 'MediaPipe', cat: 'AI / ML', desc: "Google's face mesh for real-time landmark detection" },
        { icon: '📷', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', name: 'OpenCV', cat: 'AI / ML', desc: 'Image processing for frame decoding and analysis' },
        { icon: '✨', color: '#a78bfa', bg: 'rgba(99,82,221,0.15)', name: 'Open-Source LLMs', cat: 'AI / ML', desc: 'Powers the AI MCQ generation from topic descriptions' },
        { icon: '💾', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', name: 'LocalStorage', cat: 'Data Layer', desc: 'Persistent mock data store for prototype demonstration' },
        { icon: '📊', color: '#ff6384', bg: 'rgba(255,99,132,0.1)', name: 'Chart.js (CDN)', cat: 'Analytics', desc: 'Lightweight canvas-based dashboard visualizations' }
    ];
    techGrid.innerHTML = techs.map((t, i) => `
        <div class="tech-card reveal-scale" style="transition-delay: ${i*0.1}s;">
            <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; background: ${t.color}; opacity: 0.04;"></div>
            <div style="width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; background: ${t.bg}; font-size: 24px;">
                ${t.icon}
            </div>
            <div style="font-size: 16px; font-weight: 700; color: white;">${t.name}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em;">${t.cat}</div>
            <div style="font-size: 13px; color: #888; margin-top: 10px; line-height: 1.6;">${t.desc}</div>
        </div>
    `).join('');

    // 3. Populating Team Grid
    const teamGrid = document.getElementById('team-grid');
    const teamMembers = [
        {
            name: 'Rohit', role: 'AI & ML Engineer', icon: '🤖', color: '#a78bfa', colorPrimary: '#6352dd',
            gradient: 'linear-gradient(90deg, #6352dd, #a78bfa)',
            desc: 'Led the AI and Machine Learning development, implementing the real-time face detection, gaze analysis, and head pose estimation using MediaPipe and OpenCV. Also integrated the AI API for automated MCQ generation.',
            tags: ['Python', 'MediaPipe', 'OpenCV', 'Flask', 'Open-Source LLMs', 'Computer Vision', 'Machine Learning'],
            image: "team/rohit.jpeg",
            github: "https://github.com/rohit-singh06", linkedin: "https://www.linkedin.com/in/rohit-singh-69592a293/", email: "https://mail.google.com/mail/?view=cm&fs=1&to=rohitmahargain@gmail.com"
        },
        {
            name: 'Anushka', role: 'Frontend & UI/UX Designer', icon: '🎨', color: '#f472b6', colorPrimary: '#ec4899',
            gradient: 'linear-gradient(90deg, #ec4899, #f472b6)',
            desc: 'Designed the entire visual identity of IntegriSight — from the dark-themed design system to every pixel of the UI. Also handled key frontend development, bringing the design to life natively.',
            tags: ['UI/UX Design', 'Vanilla JS', 'CSS', 'Design Systems', 'Frontend Integration'],
            image: "team/anushka.jpg",
            github: "https://github.com/AnushkaDandriyal", linkedin: "https://www.linkedin.com/in/anushka-dandriyal-bb0241354/", email: "https://mail.google.com/mail/?view=cm&fs=1&to=anushkadandriyalnush43@gmail.com"
        },
        {
            name: 'Kartik', role: 'Frontend Developer', icon: '⚙️', color: '#67e8f9', colorPrimary: '#06b6d4',
            gradient: 'linear-gradient(90deg, #06b6d4, #67e8f9)',
            desc: 'Handled the frontend development and full-stack integration, converting React hooks to native DOM states and connecting the Flask AI engine to the UI. Ensured the proctoring pipeline worked end-to-end.',
            tags: ['HTML5', 'Vanilla JS', 'REST APIs', 'Data Architecture', 'Frontend Integration'],
            image: "team/kartik.jpg",
            github: "https://github.com/kartik2005-sketch", linkedin: "https://www.linkedin.com/in/kartik-mahargaine-02aa09323/", email: "https://mail.google.com/mail/?view=cm&fs=1&to=kartikmahargaine@gmail.com"
        }
    ];

    teamGrid.innerHTML = teamMembers.map((m, i) => `
        <div class="team-item reveal-up" style="transition-delay: ${i*0.15}s;">
            <div class="team-tilt" style="transition: transform 0.4s ease; height: 100%; display: flex; flex-direction: column;">
                <div style="height: 6px; width: 100%; background: ${m.gradient}; border-top-left-radius: 24px; border-top-right-radius: 24px;"></div>
                
                <div class="team-body" data-color="${m.colorPrimary}">
                    <div style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 20px; position: relative;">
                        <div style="width: 100%; height: 100%; border-radius: 50%; overflow: hidden; border: 3px solid ${m.colorPrimary}; box-shadow: 0 0 0 6px ${m.colorPrimary}1a;">
                            <img src="${m.image}" alt="${m.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${m.colorPrimary}; border: 2px solid #0a0a14; display: flex; align-items: center; justify-content: center; position: absolute; bottom: 0; right: 0; font-size: 14px;">
                            ${m.icon}
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: white;">${m.name}</div>
                        <div style="font-size: 13px; font-weight: 600; color: ${m.color}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 6px;">${m.role}</div>
                        <div style="text-align: left; font-size: 14px; color: #888; line-height: 1.7; margin-top: 16px;">${m.desc}</div>
                    </div>

                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px;">
                        ${m.tags.map(tag => `
                            <span class="team-tag" data-c1="${m.colorPrimary}1a" data-c2="${m.colorPrimary}33" style="padding: 4px 12px; border-radius: 20px; font-size: 12px; background: ${m.colorPrimary}1a; border: 1px solid ${m.colorPrimary}40; color: ${m.color}; transition: all 0.2s;">
                                ${tag}
                            </span>
                        `).join('')}
                    </div>

                    <div style="margin-top: auto; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: center; gap: 12px;">
                        <a href="${m.github}" target="_blank" style="width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: #888;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                        </a>
                        <!-- Add Linkedin & Email identically... -->
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Team Card Hover Effects including 3D Tilt
    const isTouchDevice = window.matchMedia('(hover: none)').matches;
    document.querySelectorAll('.team-item').forEach(item => {
        const tiltInner = item.querySelector('.team-tilt');
        const bodyTag = item.querySelector('.team-body');
        const primaryColor = bodyTag.getAttribute('data-color');
        
        if (!isTouchDevice) {
            item.addEventListener('mousemove', (e) => {
                const rect = item.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const tiltX = ((y - centerY) / centerY) * -10;
                const tiltY = ((x - centerX) / centerX) * 10;
                tiltInner.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;
            });
            item.addEventListener('mouseleave', () => {
                tiltInner.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
            });
        }
        
        bodyTag.addEventListener('mouseenter', () => {
            bodyTag.style.borderColor = primaryColor + '4d';
            bodyTag.style.boxShadow = `0 20px 60px ${primaryColor}26`;
            bodyTag.style.background = 'rgba(255,255,255,0.06)';
        });
        bodyTag.addEventListener('mouseleave', () => {
             bodyTag.style.borderColor = 'rgba(255,255,255,0.08)';
             bodyTag.style.boxShadow = 'none';
             bodyTag.style.background = 'rgba(255,255,255,0.04)';
        });
    });

    document.querySelectorAll('.team-tag').forEach(tag => {
        tag.addEventListener('mouseenter', () => { tag.style.background = tag.getAttribute('data-c2'); tag.style.transform = 'translateY(-1px)'; });
        tag.addEventListener('mouseleave', () => { tag.style.background = tag.getAttribute('data-c1'); tag.style.transform = 'none'; });
    });

    // 4. Populating Architecture Timeline
    const archContainer = document.getElementById('arch-timeline');
    const steps = [
        { icon: '📹', title: 'Webcam Capture', desc: "The student's browser captures a video frame every 2 seconds using standard DOM APIs and converts it to base64." },
        { icon: '🔄', title: 'Frame Transmission', desc: "The base64 frame is POST'd to the Flask AI engine running locally on port 5001 via a vanilla fetch call." },
        { icon: '🧠', title: 'AI Analysis', desc: "MediaPipe's Face Mesh processes the frame, detecting 468 facial landmarks. Yaw and pitch ratios determine gaze." },
        { icon: '⚠️', title: 'Violation Detection', desc: "The engine checks for: face not visible, multiple faces, and gaze away from screen." },
        { icon: '📊', title: 'Risk Scoring & Sync', desc: "Violations are stored in LocalStorage, updating live Proctor Dashboard states via polling." }
    ];

    let archHTML = '';
    steps.forEach((step, i) => {
        const isEven = i % 2 !== 0;
        let leftSide = '', rightSide = '';
        const boxHTML = `
            <div class="reveal-${isEven ? 'right' : 'left'}" style="display: inline-block; max-width: 320px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; text-align: left;">
                <div style="font-size: 32px;">${step.icon}</div>
                <div style="font-size: 16px; color: white; font-weight: 700; margin-top: 10px;">${step.title}</div>
                <div style="font-size: 14px; color: #888; line-height: 1.7; margin-top: 8px;">${step.desc}</div>
            </div>
        `;
        if (isEven) { rightSide = boxHTML; } else { leftSide = boxHTML; }

        archHTML += `
            <div class="arch-item reveal-up" style="display: flex; align-items: center; margin-bottom: 40px; position: relative; z-index: 1;">
                <div class="arch-left-content" style="flex: 1; text-align: right; padding-right: 40px;">${leftSide}</div>
                <div style="width: 48px; height: 48px; border-radius: 50%; background: #0a0a14; border: 2px solid #6352dd; box-shadow: 0 0 0 8px rgba(99,82,221,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 2;">
                    <span style="font-size: 16px; font-weight: 800; color: #6352dd;">${i + 1}</span>
                </div>
                <div class="arch-right-content" style="flex: 1; padding-left: 40px;">${rightSide}</div>
            </div>
        `;
    });
    archContainer.innerHTML += archHTML;

    // Finally attach observers
    setTimeout(() => {
        document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el));
    }, 100);
});
