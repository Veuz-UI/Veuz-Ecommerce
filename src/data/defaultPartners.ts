export interface PartnerItem {
  id: string;
  name: string;
  logo: string;
  link?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
}

export interface PartnersData {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  partners: PartnerItem[];
}

export const DEFAULT_PARTNERS_DATA: PartnersData = {
  title: 'Our Official Brand & Safety Partners',
  subtitle: 'Partnered with globally certified industrial safety, PPE, and equipment manufacturers.',
  buttonText: 'Become a Partner',
  buttonLink: '/products',
  partners: [
    {
      id: 'partner-1',
      name: '3M Personal Safety',
      logo: '/assets/imgs/client/partner1.svg',
      link: '/products',
      isActive: true,
      order: 1,
    },
    {
      id: 'partner-2',
      name: 'Honeywell Safety Products',
      logo: '/assets/imgs/client/partner2.svg',
      link: '/products',
      isActive: true,
      order: 2,
    },
    {
      id: 'partner-3',
      name: 'MSA Safety Equipment',
      logo: '/assets/imgs/client/partner3.svg',
      link: '/products',
      isActive: true,
      order: 3,
    },
    {
      id: 'partner-4',
      name: 'Ansell Healthcare & PPE',
      logo: '/assets/imgs/client/partner4.svg',
      link: '/products',
      isActive: true,
      order: 4,
    },
    {
      id: 'partner-5',
      name: 'DuPont Personal Protection',
      logo: '/assets/imgs/client/partner5.svg',
      link: '/products',
      isActive: true,
      order: 5,
    },
    {
      id: 'partner-6',
      name: 'Delta Plus Safety Systems',
      logo: '/assets/imgs/client/partner1.svg',
      link: '/products',
      isActive: true,
      order: 6,
    },
    {
      id: 'partner-7',
      name: 'Drager Industrial Safety',
      logo: '/assets/imgs/client/partner2.svg',
      link: '/products',
      isActive: true,
      order: 7,
    },
    {
      id: 'partner-8',
      name: 'Bolle Safety Eyewear',
      logo: '/assets/imgs/client/partner3.svg',
      link: '/products',
      isActive: true,
      order: 8,
    },
  ],
};
