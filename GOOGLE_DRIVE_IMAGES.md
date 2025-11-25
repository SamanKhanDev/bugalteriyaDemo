# Google Drive Rasmlarni Qo'shish Bo'yicha Qo'llanma

## Muammo
Admin tezkor imtihonga rasmli savol qo'shganda, Google Drive dan link qo'yilgan, lekin boshqa kompyuterdan imtihonni ochganda rasm ko'rinmaydi.

## Yechim
Rasmlar to'g'ri ko'rinishi uchun quyidagi qadamlarni bajaring:

### 1. Google Drive da Rasmni Ochiq Qilish

1. Google Drive ga kiring
2. Rasmni tanlang
3. O'ng tugmani bosing va **"Get link"** yoki **"Havolani olish"** ni tanlang
4. **"Anyone with the link"** yoki **"Havola bor har kim"** ga o'zgartiring
5. **"Copy link"** ni bosing

### 2. Linkni Qo'shish

Sistemamiz avtomatik ravishda Google Drive linkni to'g'ri formatga o'zgartiradi:

#### Qo'llab-quvvatlanadigan formatlar:

✅ **Oddiy share link** (avtomatik konvert qilinadi):
```
https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing
```

✅ **To'g'ridan-to'g'ri URL** (shu formatda qoladi):
```
https://drive.google.com/uc?export=view&id=1ABC123xyz
```

✅ **Boshqa rasm URL'lar** (Imgur, ibb.co, va h.k.):
```
https://i.imgur.com/abc123.png
https://ibb.co/abc123
```

### 3. Admin Panelda Qo'shish

#### Oddiy qo'shish:
1. Savol qo'shish yoki tahrirlash
2. "Rasm URL" maydoniga Google Drive linkni joylashtiring
3. Link avtomatik to'g'ri formatga o'zgaradi
4. Rasm darhol ko'rinadi (agar link to'g'ri bo'lsa)

#### JSON orqali qo'shish:
```json
[
  {
    "questionText": "Bu qanday rasm?",
    "imageUrl": "https://drive.google.com/file/d/1ABC123xyz/view",
    "explanation": "Bu test rasmi",
    "options": [
      { "text": "Variant A", "isCorrect": false },
      { "text": "To'g'ri javob", "isCorrect": true }
    ]
  }
]
```

## Tekshirish

### Admin panelda:
- Savol qo'shgandan so'ng rasm darhol ko'rinishi kerak
- Agar rasm ko'rinmasa, link noto'g'ri yoki rasm "Anyone with the link" ga ochiq emas

### Foydalanuvchi tomonida:
- Imtihon boshlaganda rasmlar to'liq yuklanishi kerak
- Agar rasm yuklanmasa, browser console'da xatolikni ko'rish mumkin (F12)

## Muhim Eslatmalar

⚠️ **Rasm ochiq bo'lishi shart!**
- Google Drive da rasm "Anyone with the link" ga ochiq bo'lishi kerak
- Aks holda faqat admin ko'radi, foydalanuvchilar ko'rmaydi

⚠️ **Link formati**
- Sistemamiz avtomatik konvert qiladi, lekin to'g'ri Google Drive linkni joylashtiring
- FILE_ID ni to'g'ri ko'chirib olganingizga ishonch hosil qiling

⚠️ **Rasm hajmi**
- Katta rasmlar sekin yuklanishi mumkin
- Optimal: 500KB dan kam
- Format: JPG, PNG, GIF

## Muammolarni Hal Qilish

### Rasm ko'rinmayapti?

1. **Google Drive linkni tekshiring:**
   - Link "Anyone with the link" ga ochiq ekanligini tasdiqlang
   - Linkni yangi tab'da ochib ko'ring

2. **Browser console'ni tekshiring:**
   - F12 ni bosing
   - Console tab'ga o'ting
   - Qizil xatoliklarni qidiring

3. **Link formatini tekshiring:**
   - Link `drive.google.com/file/d/` ni o'z ichiga olishi kerak
   - FILE_ID mavjud bo'lishi kerak

### Faqat admin ko'radi, foydalanuvchilar ko'rmaydi?

Bu eng keng tarqalgan muammo! Sababi:
- Rasm "Anyone with the link" ga ochiq emas
- Rasm faqat sizning Google akkauntingiz uchun ochiq

**Yechim:**
1. Google Drive ga qaytib boring
2. Rasmni tanlang
3. Share settings'ni "Anyone with the link" ga o'zgartiring
4. Linkni qayta ko'chiring va yangilang

## Misol

### To'g'ri jarayon:

1. Google Drive ga rasm yuklash
2. Rasmni "Anyone with the link" ga ochiq qilish
3. Link olish: `https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing`
4. Admin panelda "Rasm URL" ga joylashtirish
5. Avtomatik konvert: `https://drive.google.com/uc?export=view&id=1ABC123xyz`
6. Rasm ko'rinadi ✅

---

**Qo'shimcha yordam kerak bo'lsa, texnik qo'llab-quvvatlash bilan bog'laning.**
