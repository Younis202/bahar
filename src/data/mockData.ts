export interface Instructor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  coursesCount: number;
  studentsCount: number;
  rating: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  coursesCount: number;
  slug: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: number; // minutes
  isPreview: boolean;
  bunnyVideoId?: string;
  type: 'video' | 'quiz' | 'document';
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnail: string;
  instructorId: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  lessonsCount: number;
  studentsCount: number;
  rating: number;
  ratingCount: number;
  language: string;
  tags: string[];
  status: 'published' | 'draft';
  sections: Section[];
  requirements: string[];
  objectives: string[];
}

export const instructors: Instructor[] = [
  {
    id: 'i1',
    name: 'Capt. Ahmed Al-Rashidi',
    title: 'Senior Maritime Captain & STCW Trainer',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ahmed&backgroundColor=1a3a5c',
    bio: '25+ years as a Master Mariner on international vessels. Certified STCW instructor with expertise in navigation systems and bridge operations.',
    coursesCount: 8,
    studentsCount: 4200,
    rating: 4.9,
  },
  {
    id: 'i2',
    name: 'Dr. Omar Al-Khalifa',
    title: 'Marine Engineer & Port Operations Expert',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Omar&backgroundColor=1a3a5c',
    bio: 'PhD in Marine Engineering from Southampton University. Former Chief Engineer with P&O Ferries, now dedicating expertise to education.',
    coursesCount: 5,
    studentsCount: 2800,
    rating: 4.8,
  },
  {
    id: 'i3',
    name: 'Eng. Sarah Al-Mansoori',
    title: 'Maritime Safety & Environmental Compliance',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah&backgroundColor=1a3a5c',
    bio: 'IMO certified safety trainer with 15 years at Lloyd\'s Register. Expert in MARPOL compliance and ISM Code implementation.',
    coursesCount: 4,
    studentsCount: 1900,
    rating: 4.7,
  },
];

export const categories: Category[] = [
  { id: 'c1', name: 'Navigation', icon: '🧭', description: 'Chart reading, ECDIS, celestial navigation', coursesCount: 12, slug: 'navigation' },
  { id: 'c2', name: 'Marine Engineering', icon: '⚙️', description: 'Engine systems, maintenance, propulsion', coursesCount: 9, slug: 'engineering' },
  { id: 'c3', name: 'Maritime Safety', icon: '🛡️', description: 'STCW, firefighting, survival techniques', coursesCount: 8, slug: 'safety' },
  { id: 'c4', name: 'Port Operations', icon: '⚓', description: 'Cargo handling, port management, logistics', coursesCount: 6, slug: 'port-ops' },
  { id: 'c5', name: 'Environmental', icon: '🌊', description: 'MARPOL, waste management, compliance', coursesCount: 5, slug: 'environmental' },
  { id: 'c6', name: 'Bridge Operations', icon: '🚢', description: 'Bridge resource management, watchkeeping', coursesCount: 7, slug: 'bridge' },
];

const navSections: Section[] = [
  {
    id: 's1', title: 'Introduction to Electronic Navigation',
    lessons: [
      { id: 'l1', title: 'Welcome & Course Overview', duration: 8, isPreview: true, type: 'video' },
      { id: 'l2', title: 'History of Maritime Navigation', duration: 22, isPreview: true, type: 'video' },
      { id: 'l3', title: 'ECDIS Fundamentals', duration: 35, isPreview: false, type: 'video' },
      { id: 'l4', title: 'Quiz: Navigation Basics', duration: 10, isPreview: false, type: 'quiz' },
    ]
  },
  {
    id: 's2', title: 'Chart Reading & Navigation Tools',
    lessons: [
      { id: 'l5', title: 'Understanding Nautical Charts', duration: 40, isPreview: false, type: 'video' },
      { id: 'l6', title: 'Latitude & Longitude', duration: 28, isPreview: false, type: 'video' },
      { id: 'l7', title: 'Compass & Bearing Calculations', duration: 35, isPreview: false, type: 'video' },
      { id: 'l8', title: 'Practical Chart Reading Exercise', duration: 45, isPreview: false, type: 'document' },
    ]
  },
  {
    id: 's3', title: 'GPS & Modern Navigation Systems',
    lessons: [
      { id: 'l9', title: 'GPS Theory & Operation', duration: 32, isPreview: false, type: 'video' },
      { id: 'l10', title: 'AIS - Automatic Identification System', duration: 38, isPreview: false, type: 'video' },
      { id: 'l11', title: 'Radar Navigation Principles', duration: 42, isPreview: false, type: 'video' },
      { id: 'l12', title: 'Final Navigation Assessment', duration: 20, isPreview: false, type: 'quiz' },
    ]
  },
];

export const courses: Course[] = [
  {
    id: '1',
    title: 'Maritime Navigation Systems: ECDIS & GPS Mastery',
    shortDescription: 'Master modern electronic navigation from chart reading to advanced ECDIS operation with real-world simulations.',
    description: 'This comprehensive course covers all aspects of modern maritime navigation. Starting from fundamental chart reading skills through to advanced ECDIS operation, GPS systems, and radar navigation. Includes real-world simulations used by professional mariners globally.',
    thumbnail: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop',
    instructorId: 'i1',
    categoryId: 'c1',
    price: 299,
    originalPrice: 499,
    level: 'intermediate',
    duration: 24,
    lessonsCount: 48,
    studentsCount: 2847,
    rating: 4.9,
    ratingCount: 523,
    language: 'Arabic',
    tags: ['ECDIS', 'GPS', 'Charts', 'Navigation', 'STCW'],
    status: 'published',
    sections: navSections,
    requirements: ['Basic understanding of maritime terminology', 'Completion of basic seamanship course', 'Access to ECDIS simulator (provided)'],
    objectives: ['Master ECDIS operation to STCW standard', 'Read and interpret all types of nautical charts', 'Operate GPS and AIS systems professionally', 'Plan and execute safe passage at sea'],
  },
  {
    id: '2',
    title: 'Ship Engineering & Maintenance Fundamentals',
    shortDescription: 'Comprehensive guide to marine diesel engines, auxiliary systems, and planned maintenance.',
    description: 'Covering everything from two-stroke and four-stroke marine diesel engines to auxiliary systems, refrigeration, and comprehensive planned maintenance systems. Designed for junior engineers and officers.',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    instructorId: 'i2',
    categoryId: 'c2',
    price: 349,
    originalPrice: 549,
    level: 'beginner',
    duration: 32,
    lessonsCount: 64,
    studentsCount: 1924,
    rating: 4.8,
    ratingCount: 389,
    language: 'Arabic',
    tags: ['Engineering', 'Diesel Engine', 'Maintenance', 'Pumps'],
    status: 'published',
    sections: navSections,
    requirements: ['Basic technical knowledge', 'High school physics or equivalent'],
    objectives: ['Understand marine diesel engine operation', 'Perform routine maintenance tasks', 'Diagnose common engine problems', 'Manage auxiliary systems effectively'],
  },
  {
    id: '3',
    title: 'STCW Basic Safety: Complete Certification Prep',
    shortDescription: 'Prepare fully for your STCW Basic Safety certificate with comprehensive theory and procedures.',
    description: 'This course prepares you for the STCW Basic Safety certification covering personal survival techniques, fire prevention and firefighting, elementary first aid, and personal safety and social responsibility.',
    thumbnail: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=600&h=400&fit=crop',
    instructorId: 'i3',
    categoryId: 'c3',
    price: 199,
    originalPrice: 299,
    level: 'beginner',
    duration: 16,
    lessonsCount: 32,
    studentsCount: 4156,
    rating: 4.9,
    ratingCount: 712,
    language: 'Arabic',
    tags: ['STCW', 'Safety', 'Firefighting', 'First Aid', 'Survival'],
    status: 'published',
    sections: navSections,
    requirements: ['No prior experience required', 'Minimum age 18 years'],
    objectives: ['Master personal survival techniques', 'Understand fire prevention and response', 'Apply elementary first aid', 'Comply with maritime safety regulations'],
  },
  {
    id: '4',
    title: 'Port Operations & Cargo Management',
    shortDescription: 'Professional guide to port operations, cargo handling, and logistics coordination.',
    description: 'From container operations to bulk cargo handling, this course covers all aspects of modern port operations including documentation, safety procedures, and logistics coordination.',
    thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&h=400&fit=crop',
    instructorId: 'i2',
    categoryId: 'c4',
    price: 279,
    level: 'intermediate',
    duration: 20,
    lessonsCount: 40,
    studentsCount: 1387,
    rating: 4.7,
    ratingCount: 298,
    language: 'Arabic',
    tags: ['Port', 'Cargo', 'Logistics', 'Container', 'Operations'],
    status: 'published',
    sections: navSections,
    requirements: ['Basic maritime knowledge recommended', 'Understanding of shipping terminology'],
    objectives: ['Manage container terminal operations', 'Handle bulk and break-bulk cargo safely', 'Coordinate port logistics effectively', 'Apply ISPS Code requirements'],
  },
  {
    id: '5',
    title: 'MARPOL Environmental Compliance at Sea',
    shortDescription: 'Master MARPOL regulations and implement effective environmental management systems.',
    description: 'A thorough examination of all MARPOL annexes and their practical implementation on board ships. Covers oil pollution prevention, garbage management, sewage disposal, and air emissions compliance.',
    thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&h=400&fit=crop',
    instructorId: 'i3',
    categoryId: 'c5',
    price: 249,
    level: 'intermediate',
    duration: 18,
    lessonsCount: 36,
    studentsCount: 987,
    rating: 4.8,
    ratingCount: 201,
    language: 'Arabic',
    tags: ['MARPOL', 'Environmental', 'Compliance', 'Pollution Prevention'],
    status: 'published',
    sections: navSections,
    requirements: ['Understanding of maritime regulations', 'Experience on board ships preferred'],
    objectives: ['Implement MARPOL requirements on all vessels', 'Manage waste and pollution prevention', 'Conduct environmental audits', 'Train crew on environmental awareness'],
  },
  {
    id: '6',
    title: 'Bridge Resource Management (BRM)',
    shortDescription: 'Develop critical bridge team skills, leadership, and situational awareness for safe navigation.',
    description: 'BRM is essential for all deck officers. This course develops the leadership, communication, and decision-making skills needed for effective bridge team management in all conditions.',
    thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
    instructorId: 'i1',
    categoryId: 'c6',
    price: 319,
    originalPrice: 459,
    level: 'advanced',
    duration: 28,
    lessonsCount: 52,
    studentsCount: 1654,
    rating: 4.9,
    ratingCount: 334,
    language: 'Arabic',
    tags: ['BRM', 'Leadership', 'Bridge', 'Situational Awareness', 'STCW'],
    status: 'published',
    sections: navSections,
    requirements: ['OOW certificate or equivalent experience', 'Completion of basic navigation course'],
    objectives: ['Apply BRM principles in all conditions', 'Lead bridge teams effectively', 'Maintain situational awareness', 'Communicate professionally with VTS and pilots'],
  },
];

export const enrolledCourses = [
  { ...courses[0], progress: 68, lastLesson: 'Radar Navigation Principles' },
  { ...courses[2], progress: 100, lastLesson: 'Completed', completedAt: '2024-11-15' },
  { ...courses[5], progress: 23, lastLesson: 'Bridge Team Communication' },
];

export const getInstructor = (id: string) => instructors.find(i => i.id === id);
export const getCategory = (id: string) => categories.find(c => c.id === id);
export const getCourse = (id: string) => courses.find(c => c.id === id);
