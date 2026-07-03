# Reja — Mock Tests + Dashboard + Invite Link Fix

## 1. Invite Link tuzatish (birinchi — tez fix)

**Muammo:** Havolalar (`/register?class=CODE`, `/school/student?class=CODE`, `/school/teacher?code=CODE`) bosilganda foydalanuvchi avtomatik qo'shilmayapti.

**Yechim:**
- **StudentPanel** — `?class=CODE` bo'lsa va user login qilingan bo'lsa, avtomatik `joinClass()` chaqirilsin (hozir faqat inputga to'ldiradi)
- **TeacherPanel** — `?code=CODE` bo'lsa avtomatik `joinAsTeacher()` chaqirilsin
- **Register.tsx** — `?class=CODE` va `?school-code=CODE` paramlarni sessionStorage'ga saqlab, ro'yxatdan o'tgach mos panelga (`/school/student?class=...` yoki `/school/teacher?code=...`) yo'naltirsin
- **Login.tsx** — xuddi shu paramlarni saqlab, login'dan keyin yo'naltirsin
- Foydalanuvchi email tasdiqlashdan keyin ham kodni yo'qotmasligi uchun sessionStorage ishlatiladi

## 2. Mock Test tizimi (Jumpinto uslubida)

**Yangi jadval:** `mock_test_series`
```text
- id, name (masalan "IELTS 21 Academic 2026"), year, exam_type ('ielts'|'cefr')
- is_active, order_index, color (yil rangi)
```

**Yangi jadval:** `mock_tests`
```text
- id, series_id, test_number (1-4), title
- listening_test_id, reading_test_id, writing_test_id, speaking_test_id (mavjud `tests` jadvalidan FK — ixtiyoriy)
- duration_minutes, is_active
```

Ikkala jadval uchun GRANT + RLS:
- `SELECT` — hamma authenticated ko'ra oladi
- `INSERT/UPDATE/DELETE` — faqat admin (has_role)

**Yangi sahifa** `/mock-tests`:
- Jumpinto uslubidagi grid: har yil uchun 4 ta test kartochkasi
- Har karta ichida Listening/Reading/Writing/Speaking havolalari (mavjud `TestInterface`ga ulanadi)
- Sidebar'ga "Mock Tests" havolasi qo'shiladi

**Admin panel** — yangi tab `MockTestsTab`:
- Series yaratish/tahrirlash (yil, rang, tartib)
- Har series ichida 4 test slotini mavjud testlar bilan bog'lash
- Faol/faolsizga o'tkazish

## 3. Dashboard vizual yangilash

Umumiy vizual yangilanish:
- Gradient hero banner (streak + XP + darajani birlashtirgan)
- Bento-style widget tartibi
- Glassmorphism kartalar (loyihaning `visual-identity` memoriysiga mos)
- Silliqroq animatsiyalar (motion stagger)
- Reyting/tavsiya bloklari — ranglar iyerarxiyasi
- Mobil optimizatsiya saqlanadi
- Semantik design tokens ishlatiladi (hech qanday `bg-white`, `text-black` yo'q)

**Muhim:** Funksionallik o'zgarmaydi, faqat vizual qatlam.

## Ish tartibi

1. Invite link fix (kichik, tez) — 4-5 fayl
2. Mock tests migration (jadvallar + RLS + GRANT)
3. Migration tasdiqlanganidan keyin — `/mock-tests` sahifa + admin tab
4. Dashboard vizual redesign

## Tekshirish

- Playwright orqali invite link flow'ni real testlash
- Mock test sahifasi rendering
- Dashboard vizual snapshot
