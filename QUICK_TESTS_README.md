# Tezkor Imtihonlar (Quick Tests) - Foydalanish Qo'llanmasi

## Umumiy Ma'lumot

Tezkor Imtihonlar - bu foydalanuvchilar bilimini sinash va reytingda raqobatlashish uchun mo'ljallangan bosqichli imtihon tizimi.

## Asosiy Xususiyatlar

### Admin Uchun

1. **Imtihon Yaratish**
   - Qo'lda yoki JSON orqali imtihon yaratish
   - Bosqichli imtihonlar tuzish
   - Har bir bosqichga vaqt limiti qo'yish
   - Imtihonni faol/nofaol qilish

2. **Imtihonlarni Boshqarish**
   - Imtihonlarni tahrirlash
   - Imtihonlarni ko'rib chiqish (preview)
   - Imtihonlarni o'chirish

3. **Natijalarni Ko'rish**
   - Barcha foydalanuvchilar natijalari
   - Bosqich bo'yicha filtrlash
   - Ball yoki vaqt bo'yicha saralash
   - CSV formatda export qilish

### Foydalanuvchi Uchun

1. **Imtihonlar**
   - Faol imtihonlarni ko'rish
   - Bosqichma-bosqich imtihon topshirish
   - Real-time progress tracking
   - Natijalarni ko'rish
   - **🎲 Random savollar** - Har bir user uchun savollar va variantlar random tartibda

2. **Reyting**
   - Umumiy reyting jadvali
   - Top 3 podium
   - O'z o'rnini ko'rish
   - Eng yaxshi natijalar

## Anti-Cheating Xususiyatlari

### 🔒 Savollar va Variantlar Randomizatsiyasi

Har bir foydalanuvchi imtihonni boshlaganda:
- ✅ Savollar **tasodifiy tartibda** ko'rsatiladi
- ✅ Har bir savoldagi variantlar ham **tasodifiy tartibda**
- ✅ Har bir user **har xil tartibda** savollarni ko'radi
- ✅ Bu nusxa ko'chirishni oldini oladi

**Misol:**
- User A: Savol 3 → Savol 1 → Savol 2
- User B: Savol 2 → Savol 3 → Savol 1
- Variantlar ham har xil: A, B, C, D → C, A, D, B

## JSON Format

### 1. To'liq Imtihon Import (Barcha bosqichlar)

Imtihon yaratishda JSON formatdan foydalanish uchun quyidagi strukturani ishlating:

```json
[
  {
    "title": "Moliya",
    "timeLimit": 600,
    "questions": [
      {
        "questionText": "Buxgalteriya hisobi nima?",
        "explanation": "Buxgalteriya hisobi - bu...",
        "options": [
          { "text": "Moliyaviy hisobot", "isCorrect": false },
          { "text": "Xo'jalik operatsiyalarini qayd qilish", "isCorrect": true },
          { "text": "Soliq hisobi", "isCorrect": false },
          { "text": "Audit", "isCorrect": false }
        ]
      }
    ]
  },
  {
    "title": "Qonunlar",
    "questions": [
      {
        "questionText": "Aktiv nima?",
        "options": [
          { "text": "Korxonaning mol-mulki", "isCorrect": true },
          { "text": "Korxonaning qarzi", "isCorrect": false }
        ]
      }
    ]
  }
]
```

### 2. Bosqich Ichida Savollar Import (Har bir bosqich uchun)

Har bir bosqich ichida "JSON orqali savollar qo'shish" bo'limidan foydalanish:

```json
[
  {
    "questionText": "Savol matni?",
    "explanation": "Tushuntirish (ixtiyoriy)",
    "options": [
      { "text": "Variant 1", "isCorrect": false },
      { "text": "To'g'ri javob", "isCorrect": true },
      { "text": "Variant 3", "isCorrect": false }
    ]
  },
  {
    "questionText": "Yana bir savol?",
    "options": [
      { "text": "Javob A", "isCorrect": false },
      { "text": "To'g'ri javob B", "isCorrect": true }
    ]
  }
]
```

**Qanday ishlatish:**
1. Bosqich yarating (masalan: "Moliya")
2. Bosqich ichida "JSON orqali savollar qo'shish" ni oching
3. Yuqoridagi formatda JSON kiriting
4. "Import Qilish" bosing
5. Savollar qo'shiladi!

## Firestore Struktura

### Collections

1. **quickTests**
   - testId (document ID)
   - title: string
   - description: string
   - createdBy: string (admin userId)
   - createdAt: Timestamp
   - updatedAt: Timestamp
   - isActive: boolean
   - totalLevels: number
   - timeLimit?: number (seconds)

2. **quickTests/{testId}/levels** (subcollection)
   - levelId (document ID)
   - levelNumber: number
   - title: string
   - questions: QuickTestQuestion[]
   - timeLimit?: number

3. **quickTestResults**
   - resultId (document ID)
   - testId: string
   - userId: string
   - userName: string
   - levelId: string
   - levelNumber: number
   - score: number (correct answers count)
   - totalQuestions: number
   - timeSpentSeconds: number
   - answers: Array<{questionId, selectedOptionId, isCorrect}>
   - completedAt: Timestamp

## Sahifalar

### Admin

- `/admin/quick-tests` - Barcha imtihonlar ro'yxati
- `/admin/quick-tests/create` - Yangi imtihon yaratish
- `/admin/quick-tests/[testId]/edit` - Imtihonni tahrirlash
- `/admin/quick-tests/[testId]/preview` - Imtihonni ko'rib chiqish
- `/admin/quick-tests/[testId]/results` - Natijalar va reyting

### Foydalanuvchi

- `/quick-tests` - Faol imtihonlar ro'yxati
- `/quick-tests/[testId]` - Imtihon topshirish
- `/quick-tests/leaderboard` - Umumiy reyting jadvali

## Xavfsizlik Qoidalari

Firestore security rules yangilandi:
- Imtihonlarni hamma o'qiy oladi
- Faqat adminlar imtihon yarata/tahrirlashi mumkin
- Foydalanuvchilar o'z natijalarini saqlashi mumkin
- Reyting uchun barcha natijalarni o'qish mumkin

## Dizayn Xususiyatlari

- Zamonaviy gradient ranglar
- Smooth animatsiyalar
- Responsive dizayn
- Real-time progress tracking
- Interactive UI elementlar
- Premium ko'rinish

## Kelajakda Qo'shilishi Mumkin

1. Kategoriyalar (Buxgalteriya, Soliq, Audit, va h.k.)
2. Qiyinlik darajalari (Oson, O'rta, Qiyin)
3. Vaqtli musobaqalar
4. Sertifikatlar (eng yaxshi natijalar uchun)
5. Tarixiy natijalar grafigi
6. Savdo-sotiq tizimi (premium imtihonlar)
