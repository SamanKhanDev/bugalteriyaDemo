# Rasmlar Ko'rinmasa - Debug Qo'llanma

## Muammo
Admin tezkor imtihonga rasmli savol qo'shgan, lekin rasm ko'rinmayapti va xatolik ham bermayapti.

## Debug Qadamlari

### 1. Browser Console'ni Oching
1. Imtihon sahifasida **F12** tugmasini bosing
2. **Console** tab'ga o'ting
3. Console'ni tozalang (Clear console tugmasi)

### 2. Imtihonni Boshlang
1. Rasmli savolga o'ting
2. Console'da quyidagi xabarlarni qidiring:

#### ✅ Agar rasm yuklansa:
```
🖼️ Savol rasmi URL: https://drive.google.com/uc?export=view&id=...
📍 Savol: Tashkilot o'zi uchun ofis qurmoqda...
✅ Rasm muvaffaqiyatli yuklandi: https://drive.google.com/uc?export=view&id=...
```

#### ❌ Agar rasm yuklanmasa:
```
🖼️ Savol rasmi URL: https://drive.google.com/uc?export=view&id=...
📍 Savol: Tashkilot o'zi uchun ofis qurmoqda...
❌ RASM YUKLANMADI: https://drive.google.com/uc?export=view&id=...
Xatolik: Rasm topilmadi yoki ochiq emas
```

### 3. URL'ni Tekshirish

Console'dan rasm URL'ini ko'chiring va yangi tab'da oching:

#### ✅ Agar rasm ochilsa:
- Muammo yo'q, rasm to'g'ri
- Lekin sahifada ko'rinmasa - browser cache muammosi bo'lishi mumkin
- Ctrl+Shift+R bosib sahifani yangilang (hard refresh)

#### ❌ Agar rasm ochilmasa:
- Google Drive'da rasm "Anyone with the link" ga ochiq emas
- Yoki FILE_ID noto'g'ri

### 4. Google Drive Ruxsatlarini Tekshirish

1. **Google Drive'ga kiring**
2. **Rasmni toping**
3. **O'ng tugma → Share / Ulashish**
4. **"Restricted" yoki "Cheklangan" bo'lsa:**
   - "Anyone with the link" ga o'zgartiring
   - "Viewer" ruxsatini tanlang
   - "Copy link" ni bosing

5. **Admin panelga qayting**
6. **Savolni tahrirlang**
7. **Yangi linkni joylashtiring**
8. **Saqlang**

### 5. Link Formatini Tekshirish

Console'da ko'rsatilgan URL quyidagi formatda bo'lishi kerak:
```
https://drive.google.com/uc?export=view&id=FILE_ID
```

Agar boshqa formatda bo'lsa:
- Admin panelda savolni tahrirlang
- Rasm URL'ini o'chiring
- Google Drive'dan yangi link oling
- Qayta joylashtiring (avtomatik konvert qilinadi)

## Keng Tarqalgan Xatolar

### Xato 1: Rasm "Restricted" ga o'rnatilgan
**Alomat:** Console'da "❌ RASM YUKLANMADI" xabari
**Yechim:** Google Drive'da "Anyone with the link" ga o'zgartiring

### Xato 2: Noto'g'ri FILE_ID
**Alomat:** URL to'g'ri formatda lekin rasm yo'q
**Yechim:** Google Drive'dan linkni qayta oling

### Xato 3: Rasm o'chirilgan
**Alomat:** Google Drive'da rasm topilmaydi
**Yechim:** Rasmni qayta yuklang va yangi link oling

### Xato 4: Browser Cache
**Alomat:** Admin panelda rasm ko'rinadi, lekin imtihonda yo'q
**Yechim:** Ctrl+Shift+R bosib sahifani yangilang

## Test Qilish

### Admin Panelda:
1. Savolni tahrirlang
2. Rasm URL'ini kiriting
3. Preview'da rasm ko'rinishini tekshiring
4. Agar "⚠️ Rasm yuklanmadi" ko'rsatilsa - link muammosi

### Foydalanuvchi Tomonida:
1. Imtihonni boshlang
2. F12 bosib Console'ni oching
3. Rasmli savolga o'ting
4. Console'da xabarlarni o'qing
5. Agar xatolik bo'lsa - yuqoridagi qadamlarni bajaring

## Yordam Uchun Ma'lumot

Agar muammo hal bo'lmasa, quyidagi ma'lumotlarni to'plang:

1. **Console Screenshot:** F12 → Console → Screenshot
2. **Rasm URL:** Console'dan URL'ni ko'chiring
3. **Google Drive Link:** Original link (admin qo'ygan)
4. **Browser:** Qaysi browser ishlatilayotgani
5. **Xatolik Xabari:** Console'dagi to'liq xatolik

## Qo'shimcha Maslahatlar

### Rasm Hajmi:
- Optimal: 500KB dan kam
- Maksimal: 2MB
- Format: JPG, PNG, GIF

### Rasm Sifati:
- Minimum: 800x600 piksel
- Tavsiya: 1200x900 piksel
- Maksimal: 1920x1080 piksel

### Rasm Joylashuvi:
- Google Drive (tavsiya)
- Imgur
- ibb.co
- Boshqa rasm hosting xizmatlari

---

**Eslatma:** Barcha o'zgarishlar avtomatik saqlanadi. Rasm URL'ini yangilaganingizdan so'ng, imtihonni qayta boshlang.
