# User Unique ID Feature

## Tavsif

Har bir foydalanuvchi (mavjud va yangi ro'yxatdan o'tadigan) uchun unikal 6 raqamli ID yaratildi. Bu ID foydalanuvchi dashboard da timer yonida ko'rsatiladi.

## O'zgarishlar

### 1. Schema O'zgarishlari
- **File**: `src/lib/schema.ts`
- `User` interface ga `uniqueId: string` maydoni qo'shildi

### 2. Yangi Funksiyalar
- **File**: `src/lib/generateUniqueId.ts`
- Unikal 6 raqamli ID yaratish funksiyasi
- Firestore da mavjud ID larni tekshiradi va takrorlanmasligini ta'minlaydi

### 3. Ro'yxatdan O'tish Jarayoni
- **File**: `src/app/auth/register/page.tsx`
- Yangi foydalanuvchi ro'yxatdan o'tganda avtomatik ravishda unikal ID yaratiladi

- **File**: `src/app/quick-tests/public/[testId]/page.tsx`
- Quick test uchun ro'yxatdan o'tganda ham unikal ID yaratiladi

### 4. UI O'zgarishlari
- **File**: `src/components/layout/Navbar.tsx`
- Timer yonida foydalanuvchi ID si ko'rsatiladi
- ID purple rangda, "ID: XXXXXX" formatida ko'rsatiladi

- **File**: `src/app/dashboard/page.tsx`
- Navbar ga `uniqueId` prop qo'shildi

### 5. Migration Script
- **File**: `scripts/addUniqueIdToUsers.ts`
- Mavjud foydalanuvchilar uchun unikal ID qo'shish scripti
- **Ishga tushirish**: `npm run migrate:uniqueId`

## Ishlatish

### Yangi Foydalanuvchilar
Yangi foydalanuvchilar ro'yxatdan o'tganda avtomatik ravishda unikal 6 raqamli ID oladilar.

### Mavjud Foydalanuvchilar
Mavjud foydalanuvchilar uchun migration scriptni ishga tushiring:

```bash
npm run migrate:uniqueId
```

Bu script barcha mavjud foydalanuvchilarni tekshiradi va uniqueId bo'lmaganlarga yangi ID beradi.

## ID Formati
- **Uzunlik**: 6 raqam
- **Diapazon**: 100000 - 999999
- **Unikal**: Har bir ID faqat bitta foydalanuvchiga tegishli

## Ko'rinish
ID foydalanuvchi dashboard da timer yonida quyidagicha ko'rsatiladi:

```
[ID: 123456] [⏰ 02:00:00]
```

- Purple rangda badge
- "ID:" prefixi bilan
- Mono font bilan ko'rsatiladi

## Xavfsizlik
- ID lar faqat Firestore da saqlanadi
- Har bir ID unikal bo'lishi ta'minlangan
- ID lar tasodifiy generatsiya qilinadi
