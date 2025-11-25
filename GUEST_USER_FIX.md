# Mehmon Rejimi Xatoligini Tuzatish

## Muammo
Mehmon sifatida test topshirganda natijalarni saqlashda xatolik chiqmoqda.

## Yechim
`quick-tests/[testId]/page.tsx` faylida quyidagi o'zgarishlarni amalga oshiring:

### 1. Guest User State qo'shish (22-qatordan keyin):
```typescript
const { user } = useStore();
const router = useRouter();
const [guestUser, setGuestUser] = useState<any>(null);

// Active user (either logged in or guest)
const activeUser = user || guestUser;
```

### 2. LocalStorage'dan guest user yuklash (37-qatordan keyin):
```typescript
// Load guest user from localStorage
useEffect(() => {
    const storedGuest = localStorage.getItem('guestUser');
    if (storedGuest) {
        try {
            setGuestUser(JSON.parse(storedGuest));
        } catch (e) {
            console.error('Error parsing guest user:', e);
        }
    }
}, []);
```

### 3. loadTest useEffect'ni yangilash (37-40 qatorlarni almashtirish):
```typescript
useEffect(() => {
    if (user || guestUser) {
        loadTest();
    }
}, [testId, user, guestUser]);
```

### 4. submitTest funksiyasida activeUser ishlatish (160-170 qatorlar):
```typescript
await addDoc(collection(db, 'quickTestResults'), {
    testId,
    userId: activeUser?.userId || `guest_${Date.now()}`,
    userName: activeUser?.name || 'Mehmon',
    isGuest: activeUser?.isGuest || false,
    levelId: level.levelId,
    levelNumber: level.levelNumber,
    score: levelScore,
    totalQuestions: level.questions.length,
    timeSpentSeconds: levelDuration,
    answers: levelAnswers,
    completedAt: Timestamp.now()
});
```

### 5. downloadCertificate funksiyasida activeUser ishlatish (213-qator):
```typescript
const downloadCertificate = async () => {
    if (!activeUser || !test) return;
    // ... qolgan kod
    doc.text(activeUser.name.toUpperCase(), 148.5, 108, { align: 'center' });
    // ...
    doc.save(`${activeUser.name}_sertifikat.pdf`);
};
```

## Foydalanish
1. `/quick-tests/public/[testId]` sahifasiga o'ting
2. "Tez Kirish" tugmasini bosing
3. Ism-familyangizni kiriting
4. Test topshiring
5. Natijalar muvaffaqiyatli saqlanadi

## Firestore Rules
Mehmon foydalanuvchilar uchun quyidagi qoidani qo'shing:
```
match /quickTestResults/{resultId} {
  allow create: if request.auth != null || request.resource.data.isGuest == true;
  allow read: if request.auth != null;
}
```
