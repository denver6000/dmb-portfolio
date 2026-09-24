import { Timestamp } from 'firebase/firestore'
import type { Profile, SectionEntries, SectionId } from '../lib/types'

// DEV ONLY: content carried over from the laravel-portfolio concept. Used by
// the /?demo preview and the admin "Import starter content" button; neither
// is included in production builds.
//
// The concept only listed years for work experience, so those entries use
// January placeholders and are imported as drafts to check before publishing.

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
    { category: 'Cloud & Tools', items: ['AWS', 'Docker', 'Git', 'Google Cloud'], order: 1, published: true },
    {
      category: 'Automation & IoT',
      items: ['AI Automation and Integrations', 'Arduino', 'ESP32', 'Raspberry Pi'],
      order: 2,
      published: true,
    },
    {
      category: 'Design & Fabrication',
      items: ['3D Modeling', '3D Printing', 'Microsoft Office 365'],
      order: 3,
      published: true,
    },
  ],
  projects: [
    {
      title: 'IoT Electricity Management System',
      category: 'featured',
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
      period: '2025',
      summary:
        'Digital leave application workflow prepared for DepED Schools Division San Jose with structured Form 6 processing.',
      tags: [],
      private: true,
      order: 1,
      published: true,
    },
    {
      title: 'Scholarship Management System',
      category: 'featured',
      period: '2024',
      summary: 'Scholarship management platform prepared for City Hall of San Jose to help organize applications and records.',
      tags: [],
      private: false,
      liveUrl: 'https://sjc-lgu-sis.dmballesteros.com/',
      repoUrl: 'https://github.com/denver6000/lgu-sis-scholarship-management',
      order: 2,
      published: true,
    },
    {
      title: 'POS and Inventory Systems',
      category: 'featured',
      period: '2023-2025',
      summary:
        'Point-of-sale app for Manong Jaks Burger, a web-based POS system for Delros Motorparts, plus inventory management.',
      tags: [],
      private: true,
      order: 3,
      published: true,
    },
    {
      title: 'dmb-agent-harness',
      category: 'personal',
      period: 'Recent',
      summary:
        'An agent harness using pi-ai as the LLM API, built to learn how agent harnesses work and shape one that fits my personal workflow.',
      tags: [],
      private: false,
      repoUrl: 'https://github.com/denver6000/dmb-agent-harness',
      order: 4,
      published: true,
    },
    {
      title: 'Borders',
      category: 'personal',
      period: 'Recent',
      summary:
        'A Polygon view of baranggays, cities, and municipalities using OSM/Native HDX dataset. Built to help identify zones of project HatidGo of NuevaTech.',
      tags: [],
      private: false,
      liveUrl: 'https://phborders.dmballesteros.com/',
      repoUrl: 'https://github.com/denver6000/ph-border-who',
      order: 5,
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
      role: 'ICT Department Intern',
      company: 'DepED Schools Division San Jose',
      employmentType: 'internship',
      startDate: month(2026, 1),
      highlights: [],
      tags: [],
      published: false,
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
    { title: 'Codefest Cluster 6 1st Runner Up', event: 'STI College Malolos Bulacan Tagisan Ng Talino 2026', startYear: 2026, published: true },
    { title: 'Codefest Cluster 5 2nd Runner Up', event: 'STI College Balagtas Bulacan Tagisan Ng Talino 2025', startYear: 2025, published: true },
    { title: 'Codefest Cluster 5 2nd Runner Up', event: 'STI College Balagtas Bulacan Tagisan Ng Talino 2024', startYear: 2024, published: true },
    { title: 'Codefest Local Champion', event: 'STI College San Jose Tagisan Ng Talino', startYear: 2023, endYear: 2026, published: true },
    { title: 'Codefest Cluster 5 Participant', event: 'STI College Balagtas Bulacan Tagisan Ng Talino 2023', startYear: 2023, published: true },
    { title: 'MAWD Programmer of the Year', event: 'STI College San Jose Senior Highschool ICT', startYear: 2022, published: true },
  ],
  certifications: [],
}
