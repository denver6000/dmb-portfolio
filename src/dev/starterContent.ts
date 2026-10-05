import { Timestamp } from 'firebase/firestore'
import type { Profile, SectionEntries, SectionId } from '../lib/types'

// DEV ONLY: content carried over from the laravel-portfolio concept. Used by
// the /?demo preview and the admin "Import starter content" button; neither
// is included in production builds.
//
// Work entries with confirmed month ranges are published; older approximate
// entries remain drafts to review before publishing.

const month = (year: number, m: number) => Timestamp.fromDate(new Date(Date.UTC(year, m - 1, 1)))

type Starter<K extends SectionId> = Omit<SectionEntries[K], 'id' | 'createdAt' | 'updatedAt'>

export const starterProfile: Profile = {
  name: 'Denver M. Ballesteros',
  location: 'San Jose City, Nueva Ecija',
  focus: 'Android, Web, IoT, AI Automation',
  email: 'denver@dmballesteros.com',
  githubUrl: 'https://github.com/denver6000',
  linkedinUrl: 'https://linkedin.com/in/ballesteros-denver-m',
}

export const starterContent: { [K in SectionId]: Starter<K>[] } = {
  skills: [
    {
      category: 'Development',
      items: ['Android Application Development using Kotlin Compose', 'Laravel Web Development', 'NextJS Web Development'],
      order: 0,
      published: true,
    },
    { category: 'Cloud & Tools', items: ['AWS', 'Docker', 'Git', 'Google Cloud', 'Network Management (MikroTik Routers)'], order: 1, published: true },
    {
      category: 'Automation & IoT',
      items: ['AI Automation and Integrations', 'Arduino', 'ESP32', 'Raspberry Pi'],
      order: 2,
      published: true,
    },
    {
      category: 'Design & Fabrication',
      items: ['3D Modeling', '3D Scanning', 'Reverse Engineering', '3D Printing', 'Microsoft Office 365'],
      order: 3,
      published: true,
    },
  ],
  projects: [
    {
      title: 'IoT Electricity Management System',
      category: 'featured',
      projectType: 'misc',
      period: '2026',
      summary:
        'Electricity monitoring and management system using IoT hardware, data collection, and dashboard-ready software workflows.',
      tags: [],
      private: false,
      docsUrl: 'https://github.com/denver6000/IOTScheduler-Mono/tree/main/docs',
      repoUrl: 'https://github.com/denver6000/IOTScheduler-Mono',
      order: 0,
      published: true,
    },
    {
      title: 'CSC Form6 Management System',
      category: 'featured',
      projectType: 'websites',
      period: '2026',
      summary:
        'Digital leave application workflow prepared for DepED Schools Division San Jose with structured Form 6 processing.',
      tags: [],
      private: true,
      repoUrl: 'https://github.com/denver6000/hris-deped',
      order: 1,
      published: true,
    },
    {
      title: 'Scholarship Management System',
      category: 'featured',
      projectType: 'websites',
      period: '2026',
      summary: 'Scholarship management platform prepared for City Hall of San Jose to help organize applications and records.',
      tags: [],
      private: false,
      liveUrl: 'https://sjc-sis.dmballesteros.com/login',
      screenshots: ['/projects/scholarship-site.png'],
      repoUrl: 'https://github.com/denver6000/lgu-sis-scholarship-management',
      order: 2,
      published: true,
    },
    {
      title: 'POS and Inventory Systems',
      category: 'featured',
      projectType: 'android-app',
      period: '2023-2025',
      summary:
        'Point-of-sale app for Manong Jaks Burger, a web-based POS system for Delros Motorparts, plus inventory management.',
      tags: [],
      private: true,
      order: 3,
      published: true,
    },
    {
      title: 'Pixel Alchemia',
      projectType: 'games',
      period: '2026',
      summary: 'A calm pixel-art alchemy game for Android. Combine elements in a flask to discover all 364.',
      description:
        'Start with fire, water, earth, and air, then mix pairs to uncover more than 300 recipes. The game includes animated brewing reactions, a discovery map, collection search and filters, and earned hints. It works offline without ads or an account. Pixel Alchemia is currently in internal testing on Google Play, with access by invitation.',
      screenshots: [
        '/projects/pixel-alchemia-site.png',
        'https://pixel-alchemia.dmballesteros.com/img/phone_01_combinations.webp',
        'https://pixel-alchemia.dmballesteros.com/img/phone_02_discover.webp',
        'https://pixel-alchemia.dmballesteros.com/img/phone_03_reactions.webp',
        'https://pixel-alchemia.dmballesteros.com/img/phone_04_stars.webp',
        'https://pixel-alchemia.dmballesteros.com/img/phone_05_workshop.webp',
        'https://pixel-alchemia.dmballesteros.com/img/phone_06_map.webp',
      ],
      tags: ['Android', 'Pixel art', 'Alchemy'],
      private: false,
      promoUrl: 'https://pixel-alchemia.dmballesteros.com/',
      order: 4,
      published: true,
    },
    {
      title: 'CHLC Therapy Center Web Admin',
      projectType: 'websites',
      summary: 'Web administration portal for CHLC Therapy Center. Administrators sign in here; therapists and case managers use the app.',
      tags: [],
      private: false,
      liveUrl: 'https://chlctherapy.online/',
      collaboratorName: 'Nueva Technology',
      collaboratorUrl: 'https://nuevatechsoftware.com/',
      screenshots: ['/projects/chlc-site.png'],
      order: 5,
      published: true,
    },
    {
      title: 'MikroTik MCP',
      projectType: 'ai-integrations',
      period: '2026',
      summary: 'A Model Context Protocol server that lets AI assistants run RouterOS commands on MikroTik routers over SSH.',
      description: 'Built with Node.js and TypeScript. Each tool call reads its profile configuration and opens a fresh SSH connection. Config and policy behavior are covered by tests; testing against physical MikroTik hardware is still pending.',
      tags: ['MCP', 'TypeScript', 'RouterOS', 'SSH'],
      private: false,
      repoUrl: 'https://github.com/denver6000/mikrotik-mcp',
      docsUrl: 'https://github.com/denver6000/mikrotik-mcp/tree/main/docs',
      order: 6,
      published: true,
    },
    {
      title: 'masoniclodge.com',
      projectType: 'websites',
      period: '2026',
      summary: 'A website developed in 2026, launching soon at masoniclodge.com.',
      tags: [],
      private: false,
      order: 7,
      published: true,
    },
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      school: 'STI College San Jose',
      startYear: 2022,
      highlights: [],
      published: true,
    },
    {
      degree: 'Mobile App & Web Development (MAWD)',
      school: 'STI College San Jose',
      startYear: 2020,
      endYear: 2022,
      highlights: [],
      published: true,
    },
  ],
  experience: [
    {
      role: 'Network Administrator',
      company: 'Access Network by First Integrated Ra Omega Bunobon Cable Tv Corp',
      employmentType: 'full-time',
      location: 'Unit II, Mokara Bldg, Bascos St., Abar 1st, San Jose City, Nueva Ecija, Philippines 3121',
      startDate: month(2026, 7),
      endDate: month(2026, 9),
      highlights: [],
      tags: [],
      published: true,
    },
    {
      role: 'ICT Department Intern',
      company: 'DepED Schools Division San Jose',
      employmentType: 'internship',
      startDate: month(2026, 2),
      endDate: month(2026, 3),
      highlights: [],
      tags: [],
      published: true,
    },
    {
      role: 'Freelance Developer',
      company: 'NuevaTech',
      employmentType: 'freelance',
      startDate: month(2023, 1),
      endDate: month(2025, 12),
      description:
        'Built a POS mobile application for Manong Jaks Burger and a web-based POS system for Delros Motorparts. Developed an inventory management system for Delros Motorparts.',
      highlights: [],
      tags: [],
      published: false,
    },
  ],
  competitions: [
    { title: 'Most Outstanding Student in Programming', event: '2026 Graduation · Special Award', startYear: 2026, published: true },
    { title: 'Outstanding Student Intern', event: '2026 Graduation · Special Award', startYear: 2026, published: true },
    { title: 'Codefest Cluster 6 1st Runner Up', event: 'STI College Malolos Bulacan Tagisan Ng Talino 2026', startYear: 2026, published: true },
    { title: 'Codefest Cluster 5 2nd Runner Up', event: 'STI College Balagtas Bulacan Tagisan Ng Talino 2025', startYear: 2025, published: true },
    { title: 'Codefest Cluster 5 2nd Runner Up', event: 'STI College Balagtas Bulacan Tagisan Ng Talino 2024', startYear: 2024, published: true },
    { title: 'Codefest Local Champion', event: 'STI College San Jose Tagisan Ng Talino', startYear: 2023, endYear: 2026, published: true },
    { title: 'Codefest Cluster 5 Participant', event: 'STI College Balagtas Bulacan Tagisan Ng Talino 2023', startYear: 2023, published: true },
    { title: 'MAWD Programmer of the Year', event: 'STI College San Jose Senior Highschool ICT', startYear: 2022, published: true },
  ],
  certifications: [],
}
