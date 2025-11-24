# Ahost Domenini Vercel'ga Ulash

## 1. Vercel'da Domain Qo'shish

### A) Vercel Dashboard'ga Kiring
1. [Vercel.com](https://vercel.com)ga kiring
2. Loyihangizni tanlang
3. **Settings** > **Domains** ga o'ting

### B) Domenni Qo'shing
1. "Add Domain" tugmasini bosing
2. Ahost'dan olgan domeningizni kiriting (masalan: `example.uz` yoki `example.com`)
3. "Add" tugmasini bosing

Vercel sizga DNS sozlamalarini ko'rsatadi. Ikki xil usul bor:

---

## 2. DNS Sozlash (Ahost'da)

### Usul 1: A Record (Tavsiya etiladi)

Vercel sizga quyidagi ma'lumotlarni beradi:

#### Ahost DNS Sozlamalari:

1. [Ahost.uz](https://ahost.uz) ga kiring
2. **Domenlar** > **DNS Sozlamalari** ga o'ting
3. Quyidagi recordlarni qo'shing:

**A Record (Root Domain uchun):**
```
Type: A
Name: @ (yoki bo'sh qoldiring)
Value: 76.76.21.21
TTL: 3600 (yoki default)
```

**CNAME Record (www uchun):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**AAAA Record (IPv6 uchun - ixtiyoriy):**
```
Type: AAAA
Name: @ (yoki bo'sh qoldiring)
Value: 2606:4700:4700::1111
TTL: 3600
```

### Usul 2: CNAME Record (Subdomain uchun)

Agar faqat subdomain ishlatmoqchi bo'lsangiz (masalan: `app.example.uz`):

```
Type: CNAME
Name: app (yoki istalgan subdomain)
Value: cname.vercel-dns.com
TTL: 3600
```

---

## 3. Vercel'da Tasdiqlash

DNS sozlamalarini qo'shgandan keyin:

1. Vercel dashboard'ga qayting
2. Domains bo'limida domeningizni toping
3. "Verify" yoki "Refresh" tugmasini bosing
4. DNS propagation 5-48 soat davom etishi mumkin (odatda 1-2 soat)

---

## 4. SSL Sertifikat (Avtomatik)

Vercel avtomatik ravishda **bepul SSL sertifikat** (Let's Encrypt) o'rnatadi. Hech narsa qilishingiz shart emas!

---

## 5. Ahost'da Qo'shimcha Sozlamalar

### Eski DNS Recordlarni O'chirish

Agar domeningizda eski A yoki CNAME recordlar bo'lsa, ularni o'chiring:
- Eski hosting IP manzillari
- Eski CNAME recordlar

Faqat Vercel uchun yangi recordlarni qoldiring.

### Nameserver O'zgartirish (Ixtiyoriy)

Agar Vercel'ning DNS'ini to'liq ishlatmoqchi bo'lsangiz:

1. Vercel'da **Settings** > **Domains** > **Nameservers** ga o'ting
2. Vercel nameserverlarini ko'chiring:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
3. Ahost'da **Domenlar** > **Nameservers** ga o'ting
4. Vercel nameserverlarini kiriting

**Eslatma:** Bu usul bilan barcha DNS sozlamalari Vercel'da bo'ladi.

---

## 6. Tekshirish

DNS sozlamalari faollashgandan keyin:

### Online DNS Checker
1. [DNS Checker](https://dnschecker.org) ga kiring
2. Domeningizni kiriting
3. A yoki CNAME recordni tekshiring

### Terminal orqali:
```bash
# Windows (PowerShell)
nslookup example.uz

# A record tekshirish
nslookup -type=A example.uz

# CNAME tekshirish
nslookup -type=CNAME www.example.uz
```

---

## 7. Muammolarni Hal Qilish

### "Domain Not Verified" Xatosi
- DNS sozlamalarini qayta tekshiring
- 1-2 soat kuting (DNS propagation)
- Ahost'da eski recordlarni o'chirib tashlang

### "Invalid Configuration" Xatosi
- A record IP manzilini to'g'ri kiritganingizni tekshiring: `76.76.21.21`
- CNAME value to'g'ri ekanligini tekshiring: `cname.vercel-dns.com`

### SSL Sertifikat Ishlamayapti
- Vercel avtomatik SSL beradi, 5-10 daqiqa kuting
- Agar ishlamasa, Vercel support'ga murojaat qiling

### WWW va Non-WWW
Vercel avtomatik ravishda `example.uz` va `www.example.uz` ni bir-biriga redirect qiladi.

---

## 8. Ahost DNS Sozlamalari Namunasi

Sizning Ahost DNS sozlamalaringiz quyidagicha ko'rinishi kerak:

| Type  | Name | Value                  | TTL  |
|-------|------|------------------------|------|
| A     | @    | 76.76.21.21           | 3600 |
| CNAME | www  | cname.vercel-dns.com  | 3600 |

---

## 9. Qo'shimcha Maslahatlar

### Subdomenlar
Har bir subdomen uchun alohida CNAME record qo'shing:
```
Type: CNAME
Name: api
Value: cname.vercel-dns.com
```

### Email Sozlamalari
Agar domeningizda email ishlatmoqchi bo'lsangiz, MX recordlarni qo'shing (Vercel recordlari bilan birga ishlaydi).

### Redirect
Vercel'da **Settings** > **Domains** da redirect sozlashingiz mumkin (masalan, `www` dan `non-www` ga).

---

## 10. Tayyor!

DNS sozlamalari faollashgandan keyin (1-2 soat), domeningiz Vercel loyihangizga ulangan bo'ladi va HTTPS bilan ishlaydi! 🎉

**Muhim:** Ahost'da DNS o'zgarishlar 1-48 soat ichida tarqaladi. Sabr qiling!

---

## Yordam Kerakmi?

Agar muammo bo'lsa:
1. Ahost support: [support@ahost.uz](mailto:support@ahost.uz)
2. Vercel support: [vercel.com/support](https://vercel.com/support)
3. DNS Checker: [dnschecker.org](https://dnschecker.org)
