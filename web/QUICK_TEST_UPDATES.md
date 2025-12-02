# Quick Test O'zgarishlar

## Qo'shilgan funksiyalar:

### 1. Sidebar Navigatsiya
- O'ng tomonda barcha savollar raqamlari ko'rinadi
- Raqamga bosilganda o'sha savolga o'tiladi
- Hozirgi savol ko'k rangda
- Javob berilgan savollar kulrang rangda
- Javob berilmagan savollar qora rangda

### 2. Manual Navigatsiya
- Variant tanlanganda: "Keyingisi" tugmasi (ko'k rang)
- Variant tanlanmaganda: "O'tkazib yuborish" tugmasi (kulrang)
- Har qanday savolga sidebar orqali o'tish mumkin

### 3. Vaqt Tugashi
- activeTimeTo vaqti kelganda avtomatik yakunlanadi
- Alert bilan xabar beriladi
- Barcha javoblar avtomatik saqlanadi

## Kerakli o'zgarishlar:

1. Import qo'shish: `ArrowRight, ChevronRight` icons
2. State qo'shish: `selectedOptionId`, `timeExpired`
3. useEffect qo'shish: selected option sync, time check
4. Functions: `handleOptionSelect`, `handleNext`
5. UI: Options with selection state, Next/Skip button, Sidebar
