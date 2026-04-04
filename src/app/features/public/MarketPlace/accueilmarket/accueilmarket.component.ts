import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface CampingItem {
  title: string;
  image: string;
}

interface HeroSection {
  title: string;
  subtitle: string;
  backgroundImage: string;
  buttonText: string;
  buttonLink: string;
}

interface InfoItem {
  title: string;
  description: string;
  link: string;
}

interface CustomCardItem {
  title: string;
  description: string;
}

interface CustomCta {
  title: string;
  buttonText: string;
  link: string;
}

interface FeatureBlock {
  title: string;
  description: string;
  image: string;
  buttonText: string;
  link: string;
}

interface ProductItem {
  title: string;
  image: string;
  link: string;
}

interface BoardSection {
  title: string;
  subtitle: string;
  leftImage: string;
  rightImage: string;
  centerTitle: string;
  centerText: string;
  buttonText: string;
  buttonLink: string;
}

@Component({
  selector: 'app-accueilmarket',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accueilmarket.component.html',
  styleUrl: './accueilmarket.component.css',
})
export class AccueilmarketComponent {
  sectionTitle = 'Buy Camping Equipment Online';
  sectionText =
    'Are you looking for an online store for your favorite camping products?';

  campingItems: CampingItem[] = [
    {
      title: 'Camping Cooking',
      image: '/assets/images/cuisine.jpeg'
    },
    {
      title: 'Camping Stoves',
      image: '/assets/images/OB022.jpg'
    },
    {
      title: 'Sleeping Bags',
      image: '/assets/images/couchage.jpeg'
    },
    {
      title: 'Tent',
      image: '/assets/images/tente.jpeg'
    },
    {
      title: 'Camping Lanterns',
      image: '/assets/images/camping-lantern-americancowboy.jpg'
    },
    {
      title: 'Practical Camping Products',
      image: '/assets/images/1.jpeg'
    }
  ];

  infoItems: InfoItem[] = [
    {
      title: 'Camping Chairs',
      description:
        'Lightweight and comfortable camping chairs, perfect for relaxing outdoors during your camping or hiking adventures.',
      link: '/listP'
    },
    {
      title: 'Folding Tables',
      description:
        'Easy-to-carry and simple-to-set-up folding tables, ideal for camping, picnics, and outdoor adventures.',
      link: '/listP'
    },
    {
      title: 'Air Mattresses',
      description:
        'Lightweight and durable air mattresses designed to provide maximum comfort during your nights outdoors.',
      link: '/listP'
    }
  ];

  boardSection: BoardSection = {
    title: 'Camping Hiking',
    subtitle:
      'Order today and get ready to enjoy unforgettable outdoor adventures.',
    leftImage: '/assets/images/tt.jpg',
    rightImage: '/assets/images/tasse.jpeg',
    centerTitle: 'Fast Online Camping Shopping',
    centerText:
      'Explore our website and easily shop for essential camping supplies.',
    buttonText: 'Join Us Now',
    buttonLink: '/listP'
  };

  productsSectionTitle = 'Reliable Camping Equipment';

  productItems: ProductItem[] = [
    {
      title: 'Essential Camping Items',
      image: '/assets/images/1.jpeg',
      link: '/listP'
    },
    {
      title: 'Camping Lamps',
      image: '/assets/images/lampe.jpg',
      link: '/listP'
    },
    {
      title: 'Camping Coolers',
      image: '/assets/images/glaciere.jpg',
      link: '/listP'
    },
    {
      title: 'Solar Showers',
      image: '/assets/images/douche.jpg',
      link: '/listP'
    },
    {
      title: 'Portable Barbecues',
      image: '/assets/images/bbq.jpg',
      link: '/listP'
    },
    {
      title: 'Camping Hammocks',
      image: '/assets/images/feu9.jpeg',
      link: '/listP'
    },
    {
      title: 'Camping Mats',
      image: '/assets/images/tapis.jpg',
      link: '/listP'
    },
    {
      title: 'Camping Tableware',
      image: '/assets/images/cuis3.jpg',
      link: '/listP'
    }
  ];

  customSectionTitle = 'Everything for Custom Camping';
  customSectionText =
    'Our store offers everything you need for the perfect camping experience.';

  customImages = {
    largeLeft: '/assets/images/tente.jpeg',
    topRight: '/assets/images/cuis3.jpg',
    bottomRight: '/assets/images/douche.jpg',
    bottomWide: '/assets/images/feu3.jpeg'
  };

  customCards: CustomCardItem[] = [
    {
      title: 'Camping Accessories',
      description:
        'Discover tents, sleeping bags, cooking equipment, and other essential camping accessories.'
    },
    {
      title: 'Camping Tents',
      description:
        'Find quality products that will make your next camping trip unforgettable and comfortable.'
    }
  ];

  featureBlock: FeatureBlock = {
    title: 'Camping Cooking',
    description:
      'Our camping products website offers a wide range of essential equipment and accessories for your next getaway. Shop online with ease and get ready for a memorable experience.',
    image: '/assets/images/cuisine.jpeg',
    buttonText: 'Learn More',
    link: '/listP'
  };

  customCta: CustomCta = {
    title: 'Complete Online Camping Store',
    buttonText: 'GO',
    link: '/listP'
  };

  heroSection: HeroSection = {
    title: 'Premium Quality Camping Products',
    subtitle:
      'Are you looking for an online store for your favorite camping products?',
    backgroundImage: '/assets/images/feu.jpeg',
    buttonText: 'See More',
    buttonLink: '/listP'
  };

  currentIndex = 0;
  cardsPerView = 4;

  prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  next(): void {
    if (this.currentIndex < this.maxIndex) {
      this.currentIndex++;
    }
  }

  get maxIndex(): number {
    return Math.max(this.campingItems.length - this.cardsPerView, 0);
  }

  get translateX(): string {
    const percentage = (100 / this.cardsPerView) * this.currentIndex;
    return `translateX(-${percentage}%)`;
  }
}