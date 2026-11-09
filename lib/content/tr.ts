import type { SiteContent } from "./types.ts"

export const siteContent: SiteContent = {
  brand: {
    shortName: "ADAKAN",
    name: "Adakan Hair Studio",
    legalName: "Adakan Hair Studio Güzellik Hizmetleri",
    tagline: "Caddebostan'da premium saç tasarımı ve planlı randevu deneyimi",
    heroEyebrow: "Caddebostan / İstanbul",
    heroTitle: "Güven veren salon deneyimi, güçlü saç tasarımı ve özenli bakım",
    heroDescription:
      "Adakan Hair Studio; kişiye özel saç kesimi, renk uygulamaları ve bakım ritüellerini sakin, düzenli ve premium bir salon deneyimiyle buluşturur.",
    heroHighlights: ["Uzman stil danışmanlığı", "Planlı randevu akışı", "Premium ürün seçkisi"],
    aboutLead:
      "Adakan Hair Studio, modern saç tasarımını dikkatli analiz, profesyonel uygulama ve güçlü misafir deneyimi standartlarıyla bir araya getiren butik bir salon markasıdır.",
    aboutDescription:
      "Her ziyarette saç yapınızı, günlük rutininizi ve stil beklentinizi değerlendiriyor; sonucu yalnızca estetik açıdan değil, sürdürülebilir kullanım açısından da planlıyoruz.",
  },
  seo: {
    siteUrl: "https://adakan.studio",
    defaultTitle: "Adakan Hair Studio | Premium Saç Tasarımı ve Online Randevu",
    titleTemplate: "%s | Adakan Hair Studio",
    description:
      "Adakan Hair Studio; saç kesimi, renk uygulamaları, keratin bakımı ve şekillendirme hizmetlerini profesyonel ekip, premium ürünler ve güven veren randevu akışıyla sunar.",
    keywords: [
      "kuaför",
      "saç tasarımı",
      "saç kesimi",
      "saç boyama",
      "keratin bakımı",
      "Caddebostan kuaför",
      "İstanbul güzellik salonu",
    ],
  },
  navigation: [
    { href: "/", label: "Ana Sayfa" },
    { href: "/hizmetler", label: "Hizmetler" },
    { href: "/hakkimizda", label: "Hakkımızda" },
    { href: "/randevu", label: "Randevu" },
  ],
  contact: {
    phoneDisplay: "539 941 65 21",
    phoneHref: "tel:+905399416521",
    email: "adakansoftware@gmail.com",
    address: "Bağdat Caddesi No:128, Caddebostan / İstanbul",
    city: "İstanbul",
    mapTitle: "Adakan Hair Studio konumu",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.8541428440346!2d28.98742!3d41.04861!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab7175e22bf43%3A0x726d431e947c8c49!2sCaddebostan%2C%20Kadikoy%2FIstanbul!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str",
    hours: [
      { label: "Pazartesi - Cumartesi", value: "09:00 - 21:00" },
      { label: "Pazar", value: "10:00 - 18:00" },
    ],
  },
  social: {
    instagram: "https://instagram.com/adakanhairstudio",
    tiktok: "https://tiktok.com/@adakanhairstudio",
  },
  stats: [
    { value: 10, suffix: "+", label: "Yıllık Deneyim" },
    { value: 5000, suffix: "+", label: "Memnun Misafir" },
    { value: 15, suffix: "", label: "Uzman Ekip Üyesi" },
    { value: 4.9, suffix: "/5", label: "Ortalama Değerlendirme" },
  ],
  services: [
    {
      slug: "sac-kesim-tasarim",
      title: "Saç Kesim ve Tasarım",
      shortTitle: "Saç Kesim",
      price: "950 TL'den başlayan",
      teaser: "Yüz hatlarına ve kullanım alışkanlıklarınıza göre planlanan profesyonel kesim.",
      description:
        "Saç yapınız, yüz formunuz ve günlük rutininiz birlikte değerlendirilir; stil danışmanlığı, yıkama, makas ve jilet tekniklerinin doğru seçimi ile son şekillendirme dahil eksiksiz bir kesim deneyimi sunulur. Kesim planı, saçınızın doğallığını ve eve taşıyabileceğiniz formu gözetir.",
      image: "/images/service-haircut.jpg",
      features: [
        "Kişiye özel stil danışmanlığı",
        "Yüz hattına göre denge çalışması",
        "Yıkama ve saç derisi bakımı",
        "Makas ve jilet tekniğinde doğru seçim",
        "Günlük kullanıma uygun kesim planı",
        "Profesyonel son dokunuş ve şekillendirme",
      ],
    },
    {
      slug: "sac-boyama",
      title: "Saç Boyama",
      shortTitle: "Saç Boyama",
      price: "2.200 TL'den başlayan",
      teaser: "Doğal geçişler ve kontrollü ton çalışmalarıyla dengeli renk uygulaması.",
      description:
        "Saçınızın mevcut durumu analiz edilerek ombré, balyaj, dip boya, tonlama veya renk yenileme uygulamaları kontrollü biçimde planlanır. Gerektiğinde uygulama öncesi renk testi yapılır; süreç, saç sağlığını koruyan premium ürünlerle yürütülür. Hedef doğal, parlak ve taşınabilir bir sonuçtur.",
      image: "/images/service-coloring.jpg",
      features: [
        "Ombré ve balyaj seçenekleri",
        "Ton eşitleme ve renk yenileme",
        "Dip boya ve retuş uygulamaları",
        "Gerektiğinde ön renk testi",
        "Premium ürün ve koruyucu bakım",
        "Uygulama sonrası bakım yönlendirmesi",
      ],
    },
    {
      slug: "keratin-bakimi",
      title: "Keratin Bakımı",
      shortTitle: "Keratin",
      price: "2.800 TL'den başlayan",
      teaser: "Parlaklık, yumuşaklık ve daha kontrollü bir saç görünümü için yoğun bakım.",
      description:
        "Yıpranma seviyesine göre planlanan keratin bakımı, saç tellerini destekleyen yoğun içeriklerle daha parlak, daha sakin ve daha kolay şekil alan bir görünüm hedefler. Uygulama adımları saç yapınıza göre bölge bölge ayarlanır; işlem sonrası ilk günlerde dikkat edilmesi gerekenler ve ev bakım rutini ayrıntılı biçimde anlatılır.",
      image: "/images/service-keratin.jpg",
      features: [
        "Yıpranma seviyesine göre planlama",
        "Yoğun onarım odaklı bakım",
        "Kabarma ve elektriklenme kontrolü",
        "Parlak ve dengeli bitiş",
        "Kolay şekil alma desteği",
        "Ev bakım rutini önerisi",
      ],
    },
    {
      slug: "fon-sekillendirme",
      title: "Fon ve Şekillendirme",
      shortTitle: "Fon",
      price: "400 TL'den başlayan",
      teaser: "Günlük kullanım veya özel günler için temiz ve kalıcı şekillendirme.",
      description:
        "Saçınızın boyu, yoğunluğu ve kullanım amacı değerlendirilerek düz, hacimli veya dalgalı bitişler hazırlanır. Fön, maşa ve düzleştirici teknikleri ısıdan koruyucu ürünlerle desteklenir; amaç hızlı ama özensiz olmayan, gün boyu taşınabilir bir sonuç üretmektir.",
      image: "/images/service-blowdry.jpg",
      features: [
        "Günlük ve özel gün alternatifleri",
        "Düz, hacimli veya dalgalı bitişler",
        "Fön, maşa ve düzleştirici teknikleri",
        "Isıdan koruyucu ürün kullanımı",
        "Isı kontrollü uygulama",
        "Zamanında ve düzenli servis akışı",
      ],
    },
    {
      slug: "kaynak-islemleri",
      title: "Kaynak İşlemleri",
      shortTitle: "Kaynak",
      price: "1.800 TL'den başlayan",
      teaser: "Doğal görünüm odaklı hacim ve uzunluk çözümleri.",
      description:
        "Saç yapınıza uygun teknik seçilerek uzunluk ve hacim ihtiyacınız profesyonel şekilde planlanır. Kaynak seçiminde renginiz ve saç kalınlığınız dikkate alınır; uygulama sonrası bakım seti ve düzenli kontrol randevularıyla doğallık ve kullanım konforu korunur.",
      image: "/images/service-extensions.jpg",
      features: [
        "Doğal görünüm hedefli planlama",
        "Farklı teknik alternatifleri",
        "Saç rengine uygun ton seçimi",
        "Hacim ve uzunluk dengesi",
        "Uygulama sonrası bakım seti önerisi",
        "Düzenli kontrol ve yenileme planı",
      ],
    },
  ],
  reasons: [
    {
      title: "Uzman Kadro",
      description:
        "Sürekli eğitim alan, tekniği güncel takip eden deneyimli bir ekip. Her uzman kendi alanında — kesim, renk veya bakım — derinleşir.",
    },
    {
      title: "Premium Ürünler",
      description:
        "Saç sağlığını koruyan, profesyonel ve güvenilir ürün seçkisi. Uygulamada kullanılan seriyi her misafirle paylaşırız.",
    },
    {
      title: "Hijyen Standardı",
      description:
        "Temiz, düzenli ve güven veren salon akışı. Her misafir sonrası araç-gereç sterilizasyonu tavizsiz uygulanır.",
    },
    {
      title: "Kişiye Özel Planlama",
      description:
        "Her işlem saç yapısına, yüz formuna ve beklentiye göre ayrı değerlendirilir. Şablon uygulama değil, kişiye özel plan yapılır.",
    },
    {
      title: "Sakin Deneyim",
      description:
        "Randevu yoğunluğu kontrollü, iletişimi net bir ziyaret süreci. Bekleme salonunda geçen süre planlı tutulur.",
    },
    {
      title: "Sonuç Odaklı Yaklaşım",
      description:
        "Gösterişli değil, sürdürülebilir ve taşınabilir sonuçlara odaklanırız. Evde yeniden üretebileceğiniz bir bitiş hedefleriz.",
    },
  ],
  gallery: [
    { src: "/images/before-after-1.jpg", alt: "Saç bakım uygulaması öncesi ve sonrası" },
    { src: "/images/before-after-2.jpg", alt: "Renk uygulaması öncesi ve sonrası" },
    { src: "/images/before-after-3.jpg", alt: "Şekillendirme uygulaması öncesi ve sonrası" },
    { src: "/images/service-coloring.jpg", alt: "Balyaj uygulamasıyla doğal renk geçişleri" },
    { src: "/images/service-keratin.jpg", alt: "Keratin bakımı sonrası parlak ve dengeli görünüm" },
    { src: "/images/service-blowdry.jpg", alt: "Fön ve şekillendirme ile günlük bakımlı bitiş" },
  ],
  testimonials: [
    {
      name: "Ayşe Yılmaz",
      text: "Randevu süreci çok düzenliydi. Ekip ihtiyaçlarımı iyi dinledi ve sonuç beklentimin tam karşılığını verdi. Kesim evde de aynı şekilde şekillendirilebiliyor.",
      rating: 5,
    },
    {
      name: "Zeynep Kara",
      text: "Keratin bakımında saçımın yapısına göre yönlendirme yapmaları çok güven vericiydi. Sonuç doğal ve bakımlı görünüyor, elektriklenmem tamamen bitti.",
      rating: 5,
    },
    {
      name: "Elif Demir",
      text: "Renk çalışmasında ton seçimi çok başarılıydı. Bir sonraki uygulamada dip boyayı biraz daha soğuk tonla denemeyi planlıyoruz. Salon deneyimi sakin ve profesyoneldi.",
      rating: 4,
    },
    {
      name: "Merve Şahin",
      text: "Kaynak işlemi öncesi detaylı bilgilendirme aldım, tereddütlerim sıfırlandı. Uygulama sonrası bakım önerileri sayesinde kaynaklarım ilk günkü gibi duruyor.",
      rating: 5,
    },
    {
      name: "Deniz Aksoy",
      text: "Özel davet öncesi fon için gittim; dalgalı bitiş tam istediğim gibi oldu ve gece boyu bozulmadı. Zamanında başladılar, zamanında bitirdiler.",
      rating: 5,
    },
    {
      name: "Selin Yıldız",
      text: "İlk ziyaretimde saç geçmişimi dikkatle sordular, acele etmediler. Genel deneyim iyi; bir dahaki sefere balyajı denemeyi düşünüyorum.",
      rating: 4,
    },
  ],
  values: [
    { title: "Kaliteli Ürün", description: "Her işlemde güvenilir profesyonel ürünler kullanırız." },
    { title: "Uzman Ekip", description: "Deneyim ve teknik bilgiyi iletişim kalitesiyle birleştiririz." },
    { title: "Hijyen", description: "Salon içi düzen ve hijyen standardını tavizsiz koruruz." },
    { title: "Ölçülü Tasarım", description: "Her misafire yüz ve saç yapısına uygun sonuç planlarız." },
  ],
  team: [
    {
      name: "Elif Aydın",
      title: "Kurucu ve Baş Stilist",
      bio: "Kesim, tasarım ve misafir deneyimi standardı üzerinde uzmanlaşmış kurucu stilist.",
      image: "/images/team-1.jpg",
    },
    {
      name: "Emre Kılıç",
      title: "Renk Uzmanı",
      bio: "Modern renk geçişleri, ton dengeleme ve koruyucu boya uygulamalarında uzman.",
      image: "/images/team-2.jpg",
    },
    {
      name: "Seda Öztürk",
      title: "Bakım Uzmanı",
      bio: "Keratin ve yoğun bakım uygulamalarında saç yapısına uygun planlama yaklaşımıyla çalışır.",
      image: "/images/team-3.jpg",
    },
  ],
  booking: {
    introTitle: "Online randevu talebinizi birkaç adımda oluşturun",
    introDescription:
      "Uygun hizmet, tarih ve saati seçin. Ekibimiz talebinizi kontrol edip en kısa sürede teyit için sizinle iletişime geçsin.",
    notes: [
      "Randevu talepleri salon yoğunluğu ve ekip uygunluğuna göre teyit edilir.",
      "Değişiklik veya iptal için mümkünse en az 24 saat önce bilgi verilmesini rica ederiz.",
      "İlk ziyaretinizde saç geçmişinizi daha sağlıklı değerlendirebilmemiz için 5-10 dakika erken gelmeniz faydalı olur.",
      "Randevunuza 15 dakadan fazla geç kalmanız halinde uygulama süresi kısaltılabilir veya randevu yeniden planlanabilir.",
      "Boyama ve renk işlemlerinde hassasiyet ihtimaline karşı, son 48 saat içinde tamamlanmış bir renk testi isteyebiliriz.",
    ],
    trustPoints: [
      "Gizli ve güvenli talep kaydı",
      "Aynı saat için çakışma kontrolü",
      "Net teyit ve geri dönüş akışı",
      "Ödeme bilgisi istemeden, yalnızca iletişim bilgisiyle talep",
    ],
  },
  cta: {
    eyebrow: "Randevunuzu Planlayın",
    title: "Saçınız için doğru uygulamayı birlikte planlayalım",
    description:
      "Kesim, renk veya bakım ihtiyaçlarınız için ekibimizle iletişime geçin; size uygun hizmeti ve zamanı güvenle planlayalım.",
    primaryLabel: "Online Randevu Oluştur",
    secondaryLabel: "Telefonla Ulaşın",
  },
  admin: {
    statusLabels: {
      NEW: "Yeni Talep",
      CONFIRMED: "Onaylandı",
      COMPLETED: "Tamamlandı",
      CANCELLED: "İptal Edildi",
    },
  },
  pages: {
    home: {
      hero: {
        primaryCtaLabel: "Randevu Oluştur",
        secondaryCtaLabel: "Hizmetleri İncele",
        noteTitle: "Salon Notu",
        noteDescription:
          "İlk temastan son dokunuşa kadar net iletişim, düzenli operasyon ve profesyonel saç tasarımı odağını birlikte koruyoruz.",
        metrics: [
          { value: "09:00 - 21:00", label: "Hafta içi ve cumartesi çalışma saatleri" },
          { value: "4.9/5", label: "Ortalama misafir değerlendirmesi" },
          { value: "15 kişilik", label: "Alanında uzman ekip yapılanması" },
        ],
      },
      intro: {
        eyebrow: "Marka Hakkında",
        title: "Saç tasarımını güvenli süreç ve ölçülü estetikle buluşturuyoruz",
        highlights: [
          {
            title: "Kişiye özel",
            description:
              "Yüz hattı, saç yapısı ve kullanım alışkanlığı birlikte değerlendirilir; sonuç size özel planlanır.",
          },
          {
            title: "Premium",
            description:
              "Ürün seçimi, uygulama disiplini ve misafir iletişimi aynı çizgide ilerler; detaylar küçük değildir.",
          },
        ],
      },
      reasons: {
        eyebrow: "Farkımız",
        title: "Neden Adakan Hair Studio?",
        description:
          "Hizmet kalitesini yalnızca sonuçla değil, süreç disiplini ve iletişim güveniyle birlikte ele alıyoruz.",
      },
      featuredServices: {
        eyebrow: "Hizmetlerimiz",
        title: "En çok talep gören hizmetler",
        description:
          "Salon içi en sık tercih edilen uygulamaları, net fiyat başlangıçları ve kısa içerikleriyle inceleyin.",
        allServicesLabel: "Tüm hizmetleri görüntüle",
        bookingLabel: "Bu hizmet için talep oluştur",
      },
      gallery: {
        eyebrow: "Galeri",
        title: "Öncesi ve sonrası",
        description:
          "Uygulama disiplinimizi ve elde edilen sonuçları görsel örneklerle inceleyin; her kare gerçek misafir çalışmasıdır.",
      },
      testimonials: {
        eyebrow: "Misafir Yorumları",
        title: "Misafirlerimiz deneyimi nasıl anlatıyor?",
      },
      faq: {
        eyebrow: "Sıkça Sorulan Sorular",
        title: "Merak edilenler",
        description:
          "Randevu süreci, fiyat politikası ve uygulama sonrası bakımla ilgili en sık sorulan soruları yanıtladık.",
        items: [
          {
            question: "Randevu nasıl oluşturuluyor ve ne zaman teyit ediliyor?",
            answer:
              "Online randevu formundan hizmet, tarih ve saati seçerek talebinizi iletebilirsiniz. Talebiniz salon yoğunluğu ve ekip uygunluğuna göre kontrol edilir; teyit için en kısa sürede sizinle iletişime geçilir. Çakışan saatler sistem tarafından otomatik olarak engellenir.",
          },
          {
            question: "Fiyatlar neye göre belirleniyor?",
            answer:
              "Her hizmetin başlangıç fiyatı açıkça belirtilmiştir. Saç uzunluğu, yoğunluğu ve uygulamanın kapsamına göre net fiyat, işlem öncesindeki danışmanlıkta paylaşılır; sürpriz maliyet çıkmaz.",
          },
          {
            question: "Boyama sonrası saçımı nasıl korumalıyım?",
            answer:
              "İlk 48 saat renk koruyucu olmayan şampuanlardan kaçınmalı, saçınızı ılık suyla yıkamalısınız. Sülfatsız ve renk koruyucu ürünler öneririz; doğru seri, rengin kalıcılığını belirgin biçimde artırır.",
          },
          {
            question: "Keratin bakımı ne kadar kalıcı?",
            answer:
              "Saç yapısına ve ev bakım rutinine bağlı olarak genellikle 3-4 ay kalıcıdır. Sülfatsız şampuan kullanımı ve deniz/havuz sonrası durulama, süreyi uzatan en önemli etkenlerdir.",
          },
          {
            question: "Kaynak işlemleri sonrası bakım nasıl olmalı?",
            answer:
              "Kaynak bağlantı noktalarını ıslak saçla taramamak, yatmadan gevşek örgü yapmak ve önerilen bakım setini kullanmak gerekir. Kaynak sağlığı için 6-8 haftada bir kontrol randevusu planlanır.",
          },
          {
            question: "İlk ziyaretimde neler oluyor?",
            answer:
              "Saç geçmişiniz, kullanım alışkanlıklarınız ve beklentiniz hakkında kısa bir görüşme yapılır. Ardından saç analizi ve uygulama planı paylaşılır. Bu yüzden ilk randevunuza 5-10 dakika erken gelmenizi rica ederiz.",
          },
          {
            question: "Ödeme seçenekleri neler?",
            answer:
              "Nakit ve kredi kartı ile ödeme yapabilirsiniz. Ödeme, hizmet tamamlandıktan ve sonucu onayladıktan sonra alınır; randevu talebi için ödeme bilgisi istenmez.",
          },
          {
            question: "Randevumu iptal etmek istersem ne yapmalıyım?",
            answer:
              "Değişiklik veya iptal için mümkünse en az 24 saat önce bizi bilgilendirmenizi rica ederiz. Böylece saatinizi ihtiyacı olan başka bir misafire tahsis edebiliriz.",
          },
        ],
      },
    },
    booking: {
      eyebrow: "Randevu",
      title: "Online randevu oluşturun",
      seoTitle: "Online Randevu",
      seoDescription:
        "Adakan Hair Studio için online randevu talebi oluşturun, uygun hizmet ve saati birkaç adımda planlayın.",
    },
    services: {
      eyebrow: "Hizmetlerimiz",
      title: "Premium saç bakım hizmetleri",
      description:
        "Her uygulamayı saç yapınıza, kullanım alışkanlığınıza ve hedef sonuca göre planlıyoruz.",
      bookingLabel: "Bu hizmet için randevu oluştur",
      seoTitle: "Hizmetler",
      seoDescription:
        "Saç kesimi, boyama, keratin bakımı, şekillendirme ve kaynak işlemlerini profesyonel hizmet detaylarıyla inceleyin.",
    },
    about: {
      eyebrow: "Hakkımızda",
      title: "Hikayemiz",
      description:
        "Butik salon deneyimini teknik uzmanlık, sakin iletişim ve özenli bakım anlayışıyla birleştiriyoruz.",
      seoTitle: "Hakkımızda",
      seoDescription: "Adakan Hair Studio ekibini, hizmet yaklaşımını ve salon değerlerini yakından inceleyin.",
      leadTitle: "Güzelliğe özenli ve profesyonel bir yaklaşım",
      valuesEyebrow: "Değerlerimiz",
      valuesTitle: "Temel değerlerimiz",
      ctaTitle: "Ekibimizle tanışmak ister misiniz?",
      ctaDescription:
        "İhtiyacınıza uygun hizmeti birlikte planlamak için hemen randevu talebinizi oluşturun.",
      ctaLabel: "Randevu oluştur",
    },
    footer: {
      headline:
        "Saç bakım ve tasarım sürecinizi sakin, planlı ve güven veren bir deneyime dönüştürelim.",
    },
  },
}
