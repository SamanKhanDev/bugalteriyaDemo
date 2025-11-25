// Firebase Console'da Quick Test savollarini tekshirish

// 1. Firebase Console'ga kiring: https://console.firebase.google.com
// 2. Loyihangizni tanlang
// 3. Firestore Database'ga o'ting
// 4. quickTests collection'ni oching
// 5. Imtihonni toping (masalan: "rasmli")
// 6. levels subcollection'ni oching
// 7. Biror level'ni oching
// 8. questions array'ini ko'ring

// Savol quyidagi formatda bo'lishi kerak:
{
    "questionId": "...",
        "questionText": "Savol matni",
            "imageUrl": "https://drive.google.com/uc?export=view&id=FILE_ID",  // ← BU MAYDON BOR MI?
                "explanation": "Tushuntirish",
                    "options": [
                        {
                            "optionId": "...",
                            "text": "Variant 1",
                            "isCorrect": false
                        },
                        {
                            "optionId": "...",
                            "text": "To'g'ri javob",
                            "isCorrect": true
                        }
                    ]
}

// TEKSHIRISH:
// ✅ imageUrl maydoni bormi?
// ✅ imageUrl to'ldirilganmi (bo'sh emas)?
// ✅ imageUrl to'g'ri formatdami?

// Agar imageUrl yo'q yoki bo'sh bo'lsa:
// 1. Admin panelda savolni tahrirlang
// 2. Rasm URL'ini kiriting
// 3. Saqlang
// 4. Firebase'da qayta tekshiring
