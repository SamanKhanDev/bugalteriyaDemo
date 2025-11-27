# Unique ID Migration - Test Instructions

## ✅ Bajarilgan Ishlar

1. **AuthProvider yangilandi** - Mavjud foydalanuvchilar login qilganda avtomatik ravishda uniqueId oladilar
2. **Firestore Rules yangilandi** - Foydalanuvchilar o'zlarining uniqueId maydonini yangilashlari mumkin
3. **Rules deploy qilindi** - Firebase Firestore rules yangilandi

## 🧪 Test Qilish

### Yangi Foydalanuvchilar
1. `/auth/register` sahifasiga o'ting
2. Yangi akkaunt yarating
3. Dashboard ga o'tganda timer yonida ID ko'rinishi kerak
4. Format: `[ID: XXXXXX] [⏰ HH:MM:SS]`

### Mavjud Foydalanuvchilar
1. Mavjud akkaunt bilan login qiling
2. Dashboard yuklanayotganda console da quyidagi xabarlar ko'rinadi:
   ```
   🔄 Generating uniqueId for existing user: [Ism]
   ✅ UniqueId generated: [XXXXXX]
   ```
3. Sahifa avtomatik yangilanadi va ID ko'rinadi
4. Keyingi safar login qilganda ID allaqachon mavjud bo'ladi

## 🔍 Tekshirish

### Browser Console
Dashboard sahifasida F12 ni bosing va Console tabini oching:
- Agar foydalanuvchida ID bo'lmasa: "🔄 Generating uniqueId..." xabari ko'rinadi
- ID yaratilgandan keyin: "✅ UniqueId generated: XXXXXX" ko'rinadi

### Firestore Database
Firebase Console da:
1. Firestore Database ga o'ting
2. `users` collection ni oching
3. Har bir user document da `uniqueId` maydoni bo'lishi kerak
4. Barcha ID lar 6 raqamli va unikal bo'lishi kerak

### Navbar
Dashboard da yuqori o'ng burchakda:
```
[🔔] [ID: 123456] [⏰ 02:00:00] [User Profile]
```

## 📊 Kutilayotgan Natijalar

- ✅ Yangi foydalanuvchilar ro'yxatdan o'tganda avtomatik ID oladilar
- ✅ Mavjud foydalanuvchilar birinchi login da avtomatik ID oladilar
- ✅ ID lar 6 raqamli (100000-999999)
- ✅ Barcha ID lar unikal
- ✅ ID timer yonida purple badge da ko'rsatiladi
- ✅ ID Firestore da saqlanadi

## 🐛 Muammolar

Agar ID ko'rinmasa:
1. Browser console ni tekshiring
2. Firestore rules deploy qilinganligini tekshiring
3. Foydalanuvchi logout/login qiling
4. Sahifani yangilang (F5)

## 🎉 Tayyor!

Barcha foydalanuvchilar endi unikal ID ga ega bo'ladilar!
