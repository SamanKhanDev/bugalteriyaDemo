# Vercel'ga Deploy Qilish Yo'riqnomasi

## 1. Vercel Account Yaratish

1. [Vercel.com](https://vercel.com)ga kiring
2. "Sign Up" tugmasini bosing
3. GitHub account bilan ro'yxatdan o'ting

## 2. Loyihani Import Qilish

1. Vercel dashboard'da "Add New" > "Project" tugmasini bosing
2. GitHub repository'ingizni tanlang: `SamanKhanDev/bugalteriyaDemo`
3. "Import" tugmasini bosing

## 3. Project Settings

### Build & Development Settings

**MUHIM**: Vercel'da loyihani import qilgandan keyin, quyidagi sozlamalarni o'zgartiring:

1. **Root Directory**: `web` ni tanlang (dropdown'dan)
   - Bu juda muhim! Loyiha `web` papkasida joylashgan
2. **Framework Preset**: Next.js (avtomatik aniqlanadi)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)
5. **Install Command**: `npm install` (default)

**Eslatma**: Root Directory'ni to'g'ri sozlash eng muhim qadam!

### Environment Variables

"Environment Variables" bo'limiga quyidagi o'zgaruvchilarni qo'shing:

#### Firebase Client Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=sizning_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sizning_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sizning_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sizning_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sizning_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=sizning_app_id
```

#### Firebase Admin SDK
```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

**Eslatma**: Service account key'ni Firebase Console'dan olishingiz kerak:
1. Firebase Console > Project Settings > Service Accounts
2. "Generate New Private Key" tugmasini bosing
3. Yuklab olingan JSON faylning mazmunini bir qatorda ko'chiring

#### Admin Configuration
```
ADMIN_EMAIL=admin@example.com
```

## 4. Deploy Qilish

1. Barcha sozlamalarni to'g'ri kiritganingizdan keyin "Deploy" tugmasini bosing
2. Vercel avtomatik ravishda loyihani build qiladi va deploy qiladi
3. Deploy jarayoni 2-5 daqiqa davom etadi

## 5. Domain Sozlash (Ixtiyoriy)

Deploy tugagandan keyin:
1. Project Settings > Domains
2. O'zingizning domeningizni qo'shing yoki Vercel'ning bepul subdomain'idan foydalaning

## 6. Keyingi Deploy'lar

Har safar GitHub'ga push qilganingizda, Vercel avtomatik ravishda yangi versiyani deploy qiladi.

## Muammolarni Hal Qilish

### Build Xatolari

Agar build xatolari bo'lsa:
1. Local'da `npm run build` buyrug'ini ishga tushiring
2. Xatolarni to'g'rilang
3. GitHub'ga push qiling

### Environment Variables Xatolari

Agar environment variables bilan bog'liq xatolik bo'lsa:
1. Vercel dashboard'da Project Settings > Environment Variables
2. Barcha kerakli o'zgaruvchilarni tekshiring
3. "Redeploy" tugmasini bosing

### Firebase Permissions Xatolari

Agar Firebase permissions xatolari bo'lsa:
1. Firebase Console > Firestore > Rules
2. `firestore.rules` faylini tekshiring
3. Service account key to'g'ri kiritilganligini tekshiring

## Qo'shimcha Ma'lumot

- Vercel avtomatik ravishda HTTPS ni yoqadi
- CDN orqali tez yuklash ta'minlanadi
- Serverless functions Firebase Admin SDK bilan ishlaydi
- Har bir commit uchun preview URL yaratiladi

## Foydali Linklar

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase + Vercel](https://vercel.com/guides/deploying-nextjs-firebase)
