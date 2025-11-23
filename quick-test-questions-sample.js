// Bosqich ichiga JSON orqali savollar qo'shish uchun namuna

// FAQAT SAVOLLAR (har bir bosqich uchun alohida)
const questionsOnlyExample = [
    {
        "questionText": "Buxgalteriya hisobi nima?",
        "explanation": "Buxgalteriya hisobi - bu xo'jalik operatsiyalarini pul va natural ko'rinishda qayd qilish, guruhlash va umumlashtirish tizimi.",
        "options": [
            { "text": "Moliyaviy hisobot tuzish", "isCorrect": false },
            { "text": "Xo'jalik operatsiyalarini qayd qilish tizimi", "isCorrect": true },
            { "text": "Soliq hisobi", "isCorrect": false },
            { "text": "Audit o'tkazish", "isCorrect": false }
        ]
    },
    {
        "questionText": "Aktiv nima?",
        "explanation": "Aktiv - bu korxonaning mol-mulki va uning manbalaridan foydalanish huquqi.",
        "options": [
            { "text": "Korxonaning mol-mulki", "isCorrect": true },
            { "text": "Korxonaning qarzi", "isCorrect": false },
            { "text": "Korxonaning daromadi", "isCorrect": false },
            { "text": "Korxonaning xarajati", "isCorrect": false }
        ]
    },
    {
        "questionText": "Passiv nima?",
        "explanation": "Passiv - bu korxonaning mol-mulk manbalari (kapital va majburiyatlar).",
        "options": [
            { "text": "Korxonaning mol-mulki", "isCorrect": false },
            { "text": "Korxonaning mol-mulk manbalari", "isCorrect": true },
            { "text": "Korxonaning daromadi", "isCorrect": false },
            { "text": "Korxonaning mahsuloti", "isCorrect": false }
        ]
    }
];

console.log('Savollar uchun JSON:');
console.log(JSON.stringify(questionsOnlyExample, null, 2));

// QANDAY ISHLATISH:
// 1. Imtihon yaratish/tahrirlash sahifasiga o'ting
// 2. Bosqich ichida "JSON orqali savollar qo'shish" tugmasini bosing
// 3. Yuqoridagi JSON ni nusxalang va joylashtiring
// 4. "Import Qilish" tugmasini bosing
// 5. Savollar avtomatik qo'shiladi!
