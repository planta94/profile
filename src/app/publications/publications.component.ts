import { Component, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

interface PublicationData {
  title: string;
  journal: string;
  year: number;
  authors: string[];
  tier: string;
}

// Selected research publications list component declared as standalone.
@Component({
  selector: 'app-publications',
  standalone: true, // Explicitly marks component as standalone (default in Angular 19+)
  imports: [],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.scss',
})
export class PublicationsComponent {
  protected readonly ts = inject(TranslationService);
  protected readonly publications: PublicationData[] = [
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
}
