// Page inventory for Boardgame Club (dndclub.ir/bgg)
// URLs are real (from sitemap.xml / project routes). No fabricated URLs.
export const PAGES = [
  {
    slug: 'home',
    name: 'صفحه اصلی',
    url: 'https://dndclub.ir/bgg/',
    sections: [
      { id: 'top100', label: '۱۰۰ بازی برتر', selector: 'text=۱۰۰ بازی برتر' },
      { id: 'iranian', label: 'بازی‌های با تولید در ایران', selector: 'text=بازی‌های با تولید در ایران' },
      { id: 'table', label: 'فهرست رتبه‌بندی بازی‌ها', selector: '#catalog' },
      { id: 'categories', label: 'کاوش بر اساس سبک', selector: 'text=کاوش بر اساس سبک' },
      { id: 'updates', label: 'تازه‌های باشگاه', selector: '#updates' },
      { id: 'footer', label: 'Footer', selector: '.footer' }
    ]
  },
  {
    slug: 'search',
    name: 'جست‌وجوی کامل',
    url: 'https://dndclub.ir/bgg/search.php'
  },
  {
    slug: 'game',
    name: 'جزئیات بازی (نمونه معتبر)',
    url: 'https://dndclub.ir/bgg/game.php?id=224517'
  },
  {
    slug: 'finder',
    name: 'Finder',
    url: 'https://dndclub.ir/bgg/finder.php'
  },
  {
    slug: 'compare',
    name: 'Compare (حالت معتبر)',
    url: 'https://dndclub.ir/bgg/compare.php?ids=224517,342942'
  },
  {
    slug: 'producers',
    name: 'فهرست بازی‌های ایرانی / تولیدکنندگان',
    url: 'https://dndclub.ir/bgg/producers.php'
  },
  {
    slug: 'producer',
    name: 'صفحه تولیدکننده (نمونه)',
    url: 'https://dndclub.ir/bgg/producer.php?id=1'
  },
  {
    slug: 'login',
    name: 'ورود (حالت عمومی)',
    url: 'https://dndclub.ir/bgg/login.php'
  },
  {
    slug: 'register',
    name: 'ثبت‌نام (حالت عمومی)',
    url: 'https://dndclub.ir/bgg/register.php'
  },
  {
    slug: 'contact',
    name: 'تماس / پیشنهاد',
    url: 'https://dndclub.ir/bgg/contact.php'
  }
];
