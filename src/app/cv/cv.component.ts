import { Component, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-cv',
  standalone: true,
  imports: [],
  templateUrl: './cv.component.html',
  styleUrl: './cv.component.scss',
})
export class CvComponent {
  protected readonly ts = inject(TranslationService);
  protected isGenerating = false;

  // Core skills listed in CV sidebar
  protected readonly coreSkills = [
    'Agentic AI',
    'LLMs',
    'LangChain',
    'Python',
    'TypeScript',
    'Node.js',
    'Angular',
    'PostgreSQL',
    'Docker',
    'Git',
    'MATLAB',
    'Process Opt.',
  ];

  // Dynamic Publications list matching original source of truth
  protected readonly publications = [
    {
      title:
        'Quantification of COVID-19 impacts on NO2 and O3: Systematic model selection and hyperparameter optimization on AI-based meteorological-normalization methods',
      journal: 'Atmospheric Environment',
      year: 2023,
      authors: [
        'Wong, Y.J.',
        'Yeganeh, A.',
        'Chia, M.Y.',
        'Shiu, H.Y.',
        'Ooi, M.C.G.',
        'Chang, J.H.H.',
        'Shimizu, Y.',
        'Ryosuke, H.',
        'Try, S.',
        'Elbeltagi, A.',
      ],
      tier: 'Q1',
    },
    {
      title: 'Applications of deep learning in water quality management: A state-of-the-art review',
      journal: 'Journal of Hydrology',
      year: 2022,
      authors: ['Wai, K.P.', 'Chia, M.Y.', 'Koo, C.H.', 'Huang, Y.F.', 'Chong, W.C.'],
      tier: 'Q1',
    },
    {
      title:
        'Long-term forecasting of monthly mean reference evapotranspiration using deep neural network: A comparison of training strategies and approaches',
      journal: 'Applied Soft Computing',
      year: 2022,
      authors: [
        'Chia, M. Y.',
        'Huang, Y. F.',
        'Koo, C. H.',
        'Ng, J. L.',
        'Ahmed, A. N.',
        'El-Shafie, A.',
      ],
      tier: 'Q1',
    },
    {
      title:
        'Resolving data-hungry nature of machine learning reference evapotranspiration estimating models using inter-model ensembles with various data management schemes',
      journal: 'Agricultural Water Management',
      year: 2022,
      authors: ['Chia, M.Y.', 'Huang, Y.F.', 'Koo, C.H.'],
      tier: 'Q1',
    },
    {
      title:
        'Improving reference evapotranspiration estimation using novel inter-model ensemble approaches',
      journal: 'Computers and Electronics in Agriculture',
      year: 2021,
      authors: ['Chia, M.Y.', 'Huang, Y.F.', 'Koo, C.H.'],
      tier: 'Q1',
    },
  ];

  // Dynamic translated Education history details
  get educationHistory() {
    const lang = this.ts.currentLang();
    if (lang === 'zh') {
      return [
        {
          degree: '工程学博士学位 (数据融合与机器学习)',
          school: '马来西亚拉曼大学 (UTAR)',
          year: '2019 – 2022',
        },
        {
          degree: '工程科学硕士学位 (质子交换膜燃料电池)',
          school: '马来西亚拉曼大学 (UTAR)',
          year: '2017 – 2019',
        },
        {
          degree: '化学工程工学学士学位 (CGPA 3.8758, 优秀/Distinction)',
          school: '马来西亚拉曼大学 (UTAR)',
          year: '2013 – 2016',
        },
      ];
    } else if (lang === 'ms') {
      return [
        {
          degree: 'PhD dalam Kejuruteraan (Fusi Data & Pembelajaran Mesin)',
          school: 'Universiti Tunku Abdul Rahman (UTAR), Malaysia',
          year: '2019 – 2022',
        },
        {
          degree: 'Sarjana Sains Kejuruteraan (Membran Sel Bahan Api)',
          school: 'Universiti Tunku Abdul Rahman (UTAR), Malaysia',
          year: '2017 – 2019',
        },
        {
          degree:
            'Sarjana Muda Kejuruteraan (Kepujian) Kejuruteraan Kimia (CGPA 3.8758, Distinction)',
          school: 'Universiti Tunku Abdul Rahman (UTAR), Malaysia',
          year: '2013 – 2016',
        },
      ];
    } else {
      return [
        {
          degree: 'PhD in Engineering (Data Fusion & Machine Learning)',
          school: 'Universiti Tunku Abdul Rahman (UTAR), Malaysia',
          year: '2019 – 2022',
        },
        {
          degree: 'Master of Engineering Science (Fuel Cell Membranes)',
          school: 'Universiti Tunku Abdul Rahman (UTAR), Malaysia',
          year: '2017 – 2019',
        },
        {
          degree: 'Bachelor of Engineering (Hons.) Chemical Engineering (CGPA 3.8758, Distinction)',
          school: 'Universiti Tunku Abdul Rahman (UTAR), Malaysia',
          year: '2013 – 2016',
        },
      ];
    }
  }

  selectLang(lang: 'en' | 'zh' | 'ms') {
    this.ts.setLanguage(lang);
  }

  /** Render each .cv-page as a high-res canvas image, package into a jsPDF and trigger download.
   *  This bypasses Chrome's Skia PDF text renderer which causes thick/doubled glyph artifacts. */
  async printPage() {
    this.isGenerating = true;
    try {
      const pages = document.querySelectorAll('.cv-page');
      // A4 dimensions in points (1pt = 1/72 inch)
      const pdfWidth = 595.28;
      const pdfHeight = 841.89;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;

        // Temporarily remove desktop scaling transform for accurate capture
        const origTransform = pageEl.style.transform;
        const origTransformOrigin = pageEl.style.transformOrigin;
        pageEl.style.transform = 'none';
        pageEl.style.transformOrigin = 'top left';

        // Wait for browser reflow so html2canvas captures at true size
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const canvas = await html2canvas(pageEl, {
          scale: 4,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: pageEl.scrollWidth,
          windowHeight: pageEl.scrollHeight,
        });

        // Restore original transform
        pageEl.style.transform = origTransform;
        pageEl.style.transformOrigin = origTransformOrigin;

        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save('CV_Chia_Min_Yan.pdf');
    } finally {
      this.isGenerating = false;
    }
  }

  formatAuthors(authors: string[]): string {
    return authors
      .map((author) => {
        const clean = author.trim();
        if (clean === 'Chia, M.Y.' || clean === 'Chia, M. Y.') {
          return '<strong>' + clean + '</strong>';
        }
        return clean;
      })
      .join(', ');
  }

  get researchExperience() {
    const lang = this.ts.currentLang();
    if (lang === 'zh') {
      return {
        title: '研究经历',
        list: [
          {
            role: '研究助理',
            company: '拉曼大学 (UTAR)',
            period: '2019年6月 – 2022年5月',
            bullets: [
              '协助起草研究提案和项目申请',
              '撰写用于国际学术期刊发表的论文手稿',
              '协助指导本科毕业论文（FYP）学生',
            ],
          },
          {
            role: '研究助理',
            company: '拉曼大学 (UTAR)',
            period: '2016年11月 – 2018年11月',
            bullets: [
              '开展化学与过程工程实验室教学示范与安全监督',
              '撰写用于国际学术期刊发表的论文手稿',
              '协助指导本科毕业论文（FYP）学生',
            ],
          },
        ],
      };
    } else if (lang === 'ms') {
      return {
        title: 'Pengalaman Penyelidikan',
        list: [
          {
            role: 'Pembantu Penyelidik',
            company: 'Universiti Tunku Abdul Rahman (UTAR)',
            period: 'Jun 2019 – Mei 2022',
            bullets: [
              'Membantu dalam merangka cadangan penyelidikan dan projek',
              'Penulisan manuskrip untuk penerbitan jurnal antarabangsa',
              'Membantu dalam membimbing pelajar projek tahun akhir (FYP)',
            ],
          },
          {
            role: 'Pembantu Penyelidik',
            company: 'Universiti Tunku Abdul Rahman (UTAR)',
            period: 'Nov 2016 – Nov 2018',
            bullets: [
              'Menjalankan demonstrasi makmal dan latihan keselamatan',
              'Penulisan manuskrip untuk penerbitan jurnal antarabangsa',
              'Membantu dalam membimbing pelajar projek tahun akhir (FYP)',
            ],
          },
        ],
      };
    } else {
      return {
        title: 'Research Experience',
        list: [
          {
            role: 'Research Assistant',
            company: 'Universiti Tunku Abdul Rahman (UTAR)',
            period: 'June 2019 – May 2022',
            bullets: [
              'Assist in drafting research proposals and projects',
              'Manuscript writing for international journal publications',
              'Assist in guiding final year project students',
            ],
          },
          {
            role: 'Research Assistant',
            company: 'Universiti Tunku Abdul Rahman (UTAR)',
            period: 'Nov 2016 – Nov 2018',
            bullets: [
              'Perform laboratory demonstrations and safety oversight',
              'Manuscript writing for international journal publications',
              'Assist in guiding final year project students',
            ],
          },
        ],
      };
    }
  }

  get professionalAffiliations() {
    const lang = this.ts.currentLang();
    if (lang === 'zh') {
      return {
        title: '专业协会',
        list: [
          { name: '马来西亚工程师局 (BEM) 毕业生会员', year: '2018 – 至今' },
          { name: '马来西亚工程师协会 (IEM) 毕业生会员', year: '2017 – 至今' },
          { name: '英国化学工程师学会 (IChemE) 准会员', year: '2017 – 至今' },
          { name: '马来西亚技术员协会 (MBOT) 毕业生技术员', year: '2022 – 至今' },
        ],
      };
    } else if (lang === 'ms') {
      return {
        title: 'Gabungan Profesional',
        list: [
          { name: 'Ahli Siswazah Lembaga Jurutera Malaysia (BEM)', year: '2018 – kini' },
          { name: 'Ahli Siswazah Institusi Jurutera, Malaysia (IEM)', year: '2017 – kini' },
          { name: 'Ahli Bersekutu Institusi Jurutera Kimia (IChemE)', year: '2017 – kini' },
          { name: 'Teknologis Siswazah Lembaga Teknologis Malaysia (MBOT)', year: '2022 – kini' },
        ],
      };
    } else {
      return {
        title: 'Affiliations',
        list: [
          { name: 'Graduate Member of Board of Engineers Malaysia (BEM)', year: '2018 – present' },
          {
            name: 'Graduate Member of The Institution of Engineers, Malaysia (IEM)',
            year: '2017 – present',
          },
          {
            name: 'Associate Member of Institution of Chemical Engineers (IChemE)',
            year: '2017 – present',
          },
          {
            name: 'Graduate Technologist of Malaysia Board of Technologists (MBOT)',
            year: '2022 – present',
          },
        ],
      };
    }
  }

  get extracurricularActivities() {
    const lang = this.ts.currentLang();
    if (lang === 'zh') {
      return {
        title: '课外活动',
        list: [
          {
            activity: '拉曼大学（双溪龙校区）中文辩论队队员',
            year: '2018 – 2022',
          },
          {
            activity: '参赛第十七届全国大专辩论会 (全辩17)',
            year: '2020',
          },
          {
            activity: '参赛2018年南瀛杯国际大专辩论邀请赛',
            year: '2018',
          },
          {
            activity: '参赛UCSI大学华语辩论公开赛',
            year: '2018',
          },
          {
            activity: '参赛第十六届全国大专辩论会 (全辩16)',
            year: '2018',
          },
        ],
      };
    } else if (lang === 'ms') {
      return {
        title: 'Aktiviti Kokurikulum',
        list: [
          {
            activity:
              'Ahli Pasukan Debat Bahasa Cina Universiti Tunku Abdul Rahman (Kampus Sungai Long)',
            year: '2018 – 2022',
          },
          {
            activity: 'Penyertaan dalam Pertandingan Debat Universiti Kebangsaan Ke-17 (Pebat17)',
            year: '2020',
          },
          {
            activity: 'Penyertaan dalam Pertandingan Debat Antarabangsa Piala Nan Ying 2018',
            year: '2018',
          },
          {
            activity: 'Penyertaan dalam Kejohanan Debat Bahasa Cina Universiti UCSI',
            year: '2018',
          },
          {
            activity: 'Penyertaan dalam Pertandingan Debat Universiti Kebangsaan Ke-16 (Pebat16)',
            year: '2018',
          },
        ],
      };
    } else {
      return {
        title: 'Extracurricular Activities',
        list: [
          {
            activity:
              'Member of Universiti Tunku Abdul Rahman (Sungai Long Campus) Chinese Debate Team',
            year: '2018 – 2022',
          },
          {
            activity: 'Participation in the 17th National Varsity Chinese Debate Competition',
            year: '2020',
          },
          {
            activity:
              'Participation in the 2018 Nan Ying Cup International Intervarsity Chinese Debate Competition',
            year: '2018',
          },
          {
            activity: 'Participation in the UCSI University Chinese Debate Tournament',
            year: '2018',
          },
          {
            activity: 'Participation in the 16th National Varsity Chinese Debate Competition',
            year: '2018',
          },
        ],
      };
    }
  }
}
