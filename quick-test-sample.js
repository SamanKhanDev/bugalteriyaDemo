// Quick Test Seed Data
// Run this in browser console or create a separate script

const quickTestSample = {
    title: "Buxgalteriya Asoslari",
    description: "Buxgalteriya asoslarini o'rganish uchun tezkor imtihon. 3 bosqichdan iborat.",
    isActive: true,
    totalLevels: 3,
    timeLimit: 900, // 15 minutes
    levels: [
        {
            levelNumber: 1,
            title: "1-bosqich: Asosiy Tushunchalar",
            timeLimit: 300,
            questions: [
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Buxgalteriya hisobi nima?",
                    explanation: "Buxgalteriya hisobi - bu xo'jalik operatsiyalarini pul va natural ko'rinishda qayd qilish, guruhlash va umumlashtirish tizimi.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Moliyaviy hisobot tuzish", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Xo'jalik operatsiyalarini qayd qilish tizimi", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Soliq hisobi", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Audit o'tkazish", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Aktiv nima?",
                    explanation: "Aktiv - bu korxonaning mol-mulki va uning manbalaridan foydalanish huquqi.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Korxonaning mol-mulki", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Korxonaning qarzi", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Korxonaning daromadi", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Korxonaning xarajati", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Passiv nima?",
                    explanation: "Passiv - bu korxonaning mol-mulk manbalari (kapital va majburiyatlar).",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Korxonaning mol-mulki", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Korxonaning mol-mulk manbalari", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Korxonaning daromadi", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Korxonaning mahsuloti", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Balans tenglamasi qanday ko'rinishda?",
                    explanation: "Buxgalteriya balansining asosiy tenglamasi: Aktiv = Passiv",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Aktiv = Passiv", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Daromad = Xarajat", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Debet = Kredit", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Kapital = Majburiyat", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Qo'sh yozuv prinsipi nima?",
                    explanation: "Qo'sh yozuv - har bir xo'jalik operatsiyasi ikki hisobda qayd etiladi: birida debet, ikkinchisida kredit.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Operatsiyani ikki marta yozish", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Operatsiyani ikki hisobda qayd etish", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Ikki xil valyutada yozish", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Ikki kun davomida yozish", isCorrect: false }
                    ]
                }
            ]
        },
        {
            levelNumber: 2,
            title: "2-bosqich: Hisoblar va Hujjatlar",
            timeLimit: 300,
            questions: [
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Buxgalteriya hisobi nechta sinfga bo'linadi?",
                    explanation: "Buxgalteriya hisobi 9 ta sinfga bo'linadi (0-8 sinflar).",
                    options: [
                        { optionId: crypto.randomUUID(), text: "5 ta", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "7 ta", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "9 ta", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "10 ta", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Asosiy vositalar qaysi sinfda hisoblanadi?",
                    explanation: "Asosiy vositalar 0-sinf hisoblarida qayd etiladi.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "0-sinf", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "1-sinf", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "2-sinf", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "3-sinf", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Moliyaviy hisobot qanday hujjat?",
                    explanation: "Moliyaviy hisobot - korxonaning moliyaviy ahvolini aks ettiruvchi rasmiy hujjat.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Ichki hujjat", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Rasmiy hisobot hujjati", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Yordamchi hujjat", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Shaxsiy hujjat", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Inventarizatsiya nima?",
                    explanation: "Inventarizatsiya - bu korxonadagi mol-mulkning haqiqiy mavjudligini tekshirish jarayoni.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Mol-mulkni sotish", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Mol-mulkni tekshirish", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Mol-mulkni sotib olish", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Mol-mulkni saqlash", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Debet va kredit nima?",
                    explanation: "Debet - hisobning chap tomoni, kredit - o'ng tomoni. Ular orqali operatsiyalar qayd etiladi.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Hisobning ikki tomoni", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Ikki xil valyuta", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Ikki xil soliq", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Ikki xil hujjat", isCorrect: false }
                    ]
                }
            ]
        },
        {
            levelNumber: 3,
            title: "3-bosqich: Amaliy Bilimlar",
            timeLimit: 300,
            questions: [
                {
                    questionId: crypto.randomUUID(),
                    questionText: "QQS nima?",
                    explanation: "QQS - Qo'shilgan Qiymat Solig'i, tovarlar va xizmatlar sotilganda olinadigan soliq.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Qo'shilgan Qiymat Solig'i", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Qimmat Qog'oz Solig'i", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Qarz Qoplash Solig'i", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Qishloq Qurilish Solig'i", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Amortizatsiya nima?",
                    explanation: "Amortizatsiya - asosiy vositalarning qiymatini asta-sekin xarajatlarga o'tkazish jarayoni.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Asosiy vositalarni sotish", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Asosiy vositalarning eskirishi", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Asosiy vositalarni ta'mirlash", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Asosiy vositalarni sotib olish", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Balans qachon tuziladi?",
                    explanation: "Balans odatda chorak va yil oxirida tuziladi.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Har kuni", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Har hafta", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Chorak va yil oxirida", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Faqat yil oxirida", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Foyda-zarar hisoboti nima?",
                    explanation: "Foyda-zarar hisoboti - korxonaning daromad va xarajatlarini aks ettiruvchi hisobot.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Mol-mulk hisoboti", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Daromad va xarajatlar hisoboti", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Xodimlar hisoboti", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Soliq hisoboti", isCorrect: false }
                    ]
                },
                {
                    questionId: crypto.randomUUID(),
                    questionText: "Buxgalterning asosiy vazifasi nima?",
                    explanation: "Buxgalterning asosiy vazifasi - xo'jalik operatsiyalarini to'g'ri va o'z vaqtida qayd etish.",
                    options: [
                        { optionId: crypto.randomUUID(), text: "Pul to'lash", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Operatsiyalarni qayd etish", isCorrect: true },
                        { optionId: crypto.randomUUID(), text: "Tovar sotish", isCorrect: false },
                        { optionId: crypto.randomUUID(), text: "Xodimlarni boshqarish", isCorrect: false }
                    ]
                }
            ]
        }
    ]
};

console.log('Quick Test Sample Data:');
console.log(JSON.stringify(quickTestSample, null, 2));
