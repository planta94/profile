import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface WorkExperience {
  role: string;
  company: string;
  period: string;
  bullets: string[];
  tech?: string[];
}

export interface TabData {
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  description: string;
  bullets: string[];
  tech: string[];
}

export interface TranslationDictionary {
  header: {
    about: string;
    experience: string;
    expertise: string;
    publications: string;
    skills: string;
    contact: string;
    downloadCv: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaContact: string;
    ctaResearch: string;
  };
  experience: {
    tag: string;
    title: string;
    desc: string;
    list: WorkExperience[];
  };
  expertise: {
    tag: string;
    title: string;
    desc: string;
    tabs: TabData[];
  };
  publications: {
    tag: string;
    title: string;
    desc: string;
  };
  skills: {
    tag: string;
    title: string;
    desc: string;
    devToolsTitle: string;
    langInterestsTitle: string;
    researchInterestsTitle: string;
  };
  contact: {
    tag: string;
    title: string;
    desc: string;
    emailLabel: string;
    phoneLabel: string;
    locationLabel: string;
    locationValue: string;
    referencesTitle: string;
  };
}

// English translations act as the direct in-memory fallback to avoid undefined template errors during initial loading or SSG prerendering
const enFallback: TranslationDictionary = {
  header: {
    about: 'Profile',
    experience: 'Experience',
    expertise: 'Expertise',
    publications: 'Publications',
    skills: 'Skills',
    contact: 'Contact',
    downloadCv: 'Download CV',
  },
  hero: {
    title: 'Bridging Engineering, Data Science, and Agentic AI',
    subtitle:
      'Dr. Chia Min Yan is a PhD Engineer and Data Scientist specializing in machine learning, agentic LLM solutions, full-stack microservices, and environmental process modelling.',
    ctaContact: 'Get in Touch',
    ctaResearch: 'Selected Research',
  },
  experience: {
    tag: 'Career History',
    title: 'Professional Experience',
    desc: 'Bridging the gap between scientific research and commercial application.',
    list: [
      {
        role: 'Machine Learning Engineer',
        company: 'JuiceUp EV Grid Sdn. Bhd.',
        period: 'July 2026 – Present',
        bullets: [
          'Lead the end-to-end research, architecture, and deployment of production-grade statistical algorithms and systems (rewards program optimization, EV fleet charging schedules, station utilization) to drive EV charging network operations.',
          'Spearhead the technical design of scalable backend microservices, rewards database structures, and RESTful APIs, while directing frontend development of responsive EV fleet management portals and interactive customer dashboards.',
          'Initiate and champion generative AI strategies, orchestrating LLM integrations and advanced agentic frameworks to automate complex reasoning and EV customer support workflows.',
        ],
        tech: ['Node.js', 'TypeScript', 'PostgreSQL', 'Angular', 'Python', 'Docker', 'Git'],
      },
      {
        role: 'Data Scientist',
        company: 'PAIDChain Sdn. Bhd.',
        period: 'July 2022 – July 2026',
        bullets: [
          'Lead the end-to-end research, architecture, and deployment of production-grade statistical and machine learning models (fraud detection, merchant anomalies, website monitors, credit scoring) to drive fintech operations.',
          'Spearhead the technical design of scalable backend microservices, database structures, and RESTful APIs, while directing frontend development of responsive fintech web portals and interactive dashboards.',
          'Initiate and champion generative AI strategies, orchestrating LLM integrations and advanced agentic frameworks to automate complex reasoning and business workflows.',
        ],
        tech: [
          'Node.js',
          'TypeScript',
          'PostgreSQL',
          'Angular',
          'Python',
          'Docker',
          'Git',
          'LangChain',
        ],
      },
      {
        role: 'Production Engineer',
        company: 'Maxter Glove Manufacturing Sdn. Bhd.',
        period: 'Jan 2019 – Apr 2019',
        bullets: [
          'Supervised glove manufacturing quality assurance lines, ensuring strict compliance with international client specifications and regulatory requirements.',
          'Standardized maintenance documentation and compiled performance tracking metrics to maximize line efficiency and runtime.',
        ],
      },
      {
        role: 'Production Engineer (Intern)',
        company: 'Maxter Glove Manufacturing Sdn. Bhd.',
        period: 'Oct 2015 – Dec 2015',
        bullets: [
          'Monitored and maintained treatment parameters at the wastewater facility, ensuring 100% compliance with national environmental safety standards.',
          'Analyzed chemical dosing process variables to optimize treatment operations, successfully achieving operational cost savings.',
        ],
      },
    ],
  },
  expertise: {
    tag: 'Capabilities',
    title: 'Core Focus Areas',
    desc: 'Interactive dashboard showcasing direct industrial work and research achievements.',
    tabs: [
      {
        title: 'Agentic AI & LLMs',
        subtitle: 'Intelligent Workflows',
        icon: 'smart_toy',
        badge: 'Innovation',
        description:
          'Initiating and setting up advanced AI architectures to automate complex decision-making processes and pipelines.',
        bullets: [
          'Setup and implementation of artificial intelligence for fintech business use cases.',
          'Integration of Large Language Models (LLMs) and advanced agentic frameworks.',
          'Developing specialized pipelines for autonomous task planning and code execution.',
          'Applied research in process intelligence and agent-based decision-making.',
        ],
        tech: ['LLMs', 'Agentic Frameworks', 'LangChain', 'Python', 'TypeScript', 'Node.js'],
      },
      {
        title: 'Data Science & Fintech',
        subtitle: 'Predictive Modeling',
        icon: 'query_stats',
        badge: 'Production',
        description:
          'Researching, designing, and maintaining backend systems for statistical and machine learning models in fintech environments.',
        bullets: [
          'Designed statistical and machine learning models for fraud detection and merchant monitoring.',
          'Developed website monitoring and credit scoring models.',
          'Built and managed microservices, databases, and RESTful APIs.',
          'Led responsive frontend developments for portals and interactive dashboards.',
        ],
        tech: ['Python', 'TypeScript', 'PostgreSQL', 'Node.js', 'Angular', 'Docker', 'Git'],
      },
      {
        title: 'Academic Research',
        subtitle: 'Scientific Contribution',
        icon: 'science',
        badge: 'Science',
        description:
          'Extensive scientific contribution to machine learning applications in hydrology and environmental engineering.',
        bullets: [
          'Doctor of Philosophy (Engineering) with focus on robust data fusion techniques.',
          'Published 5+ articles in Q1 Web of Science journals.',
          'Pioneered deep learning applications for reference evapotranspiration estimation.',
          'Integrated advanced optimization algorithms with support vector machines for prediction.',
        ],
        tech: ['Machine Learning', 'Deep Learning', 'Data Fusion', 'Hydrology', 'Statistics'],
      },
      {
        title: 'Engineering & Optimization',
        subtitle: 'Chemical & Process Systems',
        icon: 'engineering',
        badge: 'Engineering',
        description:
          'Leveraging chemical engineering principles to optimize processes and develop advanced composite membranes.',
        bullets: [
          'Master of Engineering Science focusing on proton exchange membranes.',
          'Optimized process parameters of wastewater treatment plants for cost savings.',
          'Monitored product quality compliance to meet regulated client standards.',
          'Expertise in fuel cell membranes, environmental modelling, and process simulations.',
        ],
        tech: ['MATLAB', 'Aspen HYSYS', 'SEM', 'Gas Chromatography', 'Wastewater Treatment'],
      },
    ],
  },
  publications: {
    tag: 'Academic Research',
    title: 'Selected Publications',
    desc: 'High-impact research articles published in Q1 Web of Science journals.',
  },
  skills: {
    tag: 'Skillsets',
    title: 'Technical Expertise',
    desc: 'Core competencies, tools, and languages.',
    devToolsTitle: 'Development & Core Tools',
    langInterestsTitle: 'Languages & Interests',
    researchInterestsTitle: 'Research Interests',
  },
  contact: {
    tag: 'Get in Touch',
    title: "Let's build together",
    desc: 'I am always open to discussing new opportunities, machine learning integrations, or academic collaborations.',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    locationLabel: 'Location',
    locationValue: 'Selangor, Malaysia',
    referencesTitle: 'Professional References',
  },
};

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentLang = signal<'en' | 'zh' | 'ms'>('en');
  readonly t = signal<TranslationDictionary>(enFallback);

  /**
   * Called by APP_INITIALIZER to guarantee translations are loaded
   * before any component renders.
   */
  initialize(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const cached = localStorage.getItem('preferredLang') as 'en' | 'zh' | 'ms';
      const initialLang = cached && ['en', 'zh', 'ms'].includes(cached) ? cached : 'en';
      return this.loadLanguageTranslations(initialLang);
    }
    // SSR/prerender: resolve immediately with the in-memory English fallback
    return Promise.resolve();
  }

  setLanguage(lang: 'en' | 'zh' | 'ms'): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('preferredLang', lang);
    }
    return this.loadLanguageTranslations(lang);
  }

  private async loadLanguageTranslations(lang: 'en' | 'zh' | 'ms'): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.get<TranslationDictionary>(`i18n/${lang}.json`));
      this.t.set(res);
      this.currentLang.set(lang);
    } catch (err) {
      console.error(`Failed to load translation JSON: ${lang}`, err);
      this.currentLang.set(lang);
    }
  }
}
