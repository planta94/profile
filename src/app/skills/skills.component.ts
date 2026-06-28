import { Component, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

interface SkillData {
  name: string;
  level: number;
}

interface LanguageData {
  name: string;
  zhName: string;
  msName: string;
  level: number;
  enLabel: string;
  zhLabel: string;
  msLabel: string;
}

interface LocalizedInterest {
  en: string;
  zh: string;
  ms: string;
}

// Technical skills, languages, and interests matrices component declared as standalone.
@Component({
  selector: 'app-skills',
  standalone: true, // Explicitly marks component as standalone (default in Angular 19+)
  imports: [],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
})
export class SkillsComponent {
  protected readonly ts = inject(TranslationService);

  protected readonly devSkills: SkillData[] = [
    { name: 'Python (Machine Learning, PyTorch, Pandas)', level: 90 },
    { name: 'JavaScript & TypeScript', level: 85 },
    { name: 'Node.js & Express / Microservices', level: 85 },
    { name: 'Angular Framework & State Management', level: 80 },
    { name: 'PostgreSQL & Database Optimization', level: 80 },
    { name: 'Docker, Git & Containerization', level: 75 },
    { name: 'MATLAB / Scientific Computing', level: 80 },
  ];

  protected readonly languages: LanguageData[] = [
    {
      name: 'English',
      zhName: '英语',
      msName: 'Bahasa Inggeris',
      level: 95,
      enLabel: 'Professional',
      zhLabel: '专业熟练',
      msLabel: 'Profesional',
    },
    {
      name: 'Chinese',
      zhName: '中文',
      msName: 'Bahasa Cina',
      level: 95,
      enLabel: 'Native',
      zhLabel: '母语',
      msLabel: 'Bahasa Ibunda',
    },
    {
      name: 'Bahasa Melayu',
      zhName: '马来语',
      msName: 'Bahasa Melayu',
      level: 90,
      enLabel: 'Professional',
      zhLabel: '专业熟练',
      msLabel: 'Profesional',
    },
    {
      name: 'Korean',
      zhName: '韩语',
      msName: 'Bahasa Korea',
      level: 50,
      enLabel: 'Conversational',
      zhLabel: '日常会话',
      msLabel: 'Perbualan Harian',
    },
  ];

  protected readonly researchInterests: LocalizedInterest[] = [
    { en: 'Environmental Modelling', zh: '环境系统建模', ms: 'Pemodelan Alam Sekitar' },
    {
      en: 'Agentic AI for Decision Processes',
      zh: '基于代理决策的人工智能',
      ms: 'AI Agen untuk Proses Keputusan',
    },
    {
      en: 'Artificial Intelligence for Engineering',
      zh: '工程应用人工智能',
      ms: 'Kecerdasan Buatan untuk Kejuruteraan',
    },
    {
      en: 'Large Language Models for Industry Applications',
      zh: '大语言模型工业应用',
      ms: 'Model Bahasa Besar untuk Aplikasi Industri',
    },
    { en: 'Fuel Cell Membranes', zh: '燃料电池膜研究', ms: 'Membran Sel Bahan Api' },
    {
      en: 'Process Engineering & Optimization',
      zh: '化工过程工程与优化',
      ms: 'Kejuruteraan & Pengoptimuman Proses',
    },
  ];
}
