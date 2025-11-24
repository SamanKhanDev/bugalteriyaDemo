# Bugalteriya - Buxgalteriya Ta'lim Platformasi

Bu loyiha Next.js va Firebase yordamida yaratilgan buxgalteriya ta'lim platformasidir.

## Texnologiyalar

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Deployment**: Vercel

## Xususiyatlar

- ✅ Foydalanuvchi autentifikatsiyasi
- ✅ Video darslar
- ✅ Testlar va savollar
- ✅ Tezkor testlar (Quick Tests)
- ✅ Sertifikatlar yaratish
- ✅ Admin panel
- ✅ Foydalanuvchilar reytingi
- ✅ Analitika

## O'rnatish

1. Repozitoriyani klonlash:
```bash
git clone <repository-url>
cd Bugalteriya
```

2. Web papkasiga o'tish va paketlarni o'rnatish:
```bash
cd web
npm install
```

3. Environment o'zgaruvchilarni sozlash:
`.env.example` faylidan `.env.local` yarating va Firebase ma'lumotlaringizni kiriting:
```bash
cp .env.example .env.local
```

4. Development serverini ishga tushirish:
```bash
npm run dev
```

Brauzerda `http://localhost:3000` ochiladi.

## Firebase Sozlash

1. [Firebase Console](https://console.firebase.google.com/)da yangi loyiha yarating
2. Authentication, Firestore, va Storage xizmatlarini yoqing
3. Web app yarating va konfiguratsiya ma'lumotlarini oling
4. Service Account key yarating (Settings > Service Accounts > Generate New Private Key)
5. `.env.local` fayliga barcha ma'lumotlarni kiriting

## Vercel'ga Deploy Qilish

1. GitHub'ga push qiling:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. [Vercel](https://vercel.com)ga kiring va GitHub repozitoriyangizni ulang

3. Environment o'zgaruvchilarni Vercel'da sozlang:
   - Project Settings > Environment Variables
   - `.env.example`dagi barcha o'zgaruvchilarni qo'shing

4. Deploy tugmasini bosing!

## Build

Production build yaratish:
```bash
npm run build
npm start
```

## Loyiha Tuzilmasi

```
Bugalteriya/
├── web/                    # Next.js ilovasi
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React komponentlar
│   │   ├── lib/          # Utility funksiyalar
│   │   └── store/        # Zustand state management
│   ├── public/           # Statik fayllar
│   └── package.json
├── firebase.json          # Firebase konfiguratsiyasi
├── firestore.rules       # Firestore xavfsizlik qoidalari
└── vercel.json           # Vercel deploy konfiguratsiyasi
```

## Litsenziya

Private project
