export interface Photo {
  id: string;
  src: string;
  title: string;
  tags: string[];
  aspectRatio: '3/4' | '4/3' | '1/1' | 'auto';
  description: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  featured?: boolean;
}

export interface EssaySection {
  title: string;
  subTitle?: string;
  content: string[];
}
