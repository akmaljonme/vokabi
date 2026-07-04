# Jumpinto-style Mock Test Tizimi + Dashboard Redesign

## 1. Yangi Mock Test Ma'lumotlar Modeli

Hozirgi `mock_tests` faqat mavjud `tests` ga link qiladi — buni to'liq o'zgartirmiz. Mock test o'ziga alohida kontent egasi bo'ladi.

### Yangi jadvallar (migration)

**`mock_test_parts`** — har bir mock test uchun bo'limlar
- `mock_test_id` (FK → mock_tests.id)
- `skill` enum: listening | reading | writing | speaking
- `part_number` (1..N — admin belgilaydi)
- `title`, `instruction`
- `passage_text` (reading uchun)
- `audio_url` (listening uchun)
- `image_url` (writing task 1 grafik uchun)
- `duration_seconds` (skill uchun umumiy vaqt part 1 da)

**`mock_test_questions`** — har xil savol turlari
- `part_id` (FK → mock_test_parts.id)
- `question_number`
- `question_type` enum:
  - `multiple_choice` (bitta javob)
  - `multiple_choice_multi` (bir nechta)
  - `true_false_notgiven`
  - `yes_no_notgiven`
  - `matching_headings`
  - `matching_features`
  - `matching_information`
  - `sentence_completion` (bo'sh joy to'ldirish)
  - `note_completion` (jadval/notes)
  - `short_answer`
  - `writing_task` (task 1 / task 2 — javob = insho matni)
  - `speaking_question` (audio yozib topshirish)
- `question_text`
- `options` jsonb (variantlar uchun)
- `correct_answer` jsonb (matn, massiv yoki accepted answers)
- `points` (default 1)
- `group_label` (masalan "Questions 1-6" sarlavhasi uchun)

Grants + RLS: admin CRUD, autentifikatsiyalanganlar `SELECT` faol seriyadagilarga.

**`mock_test_attempts`** — foydalanuvchi urinishlari
- `user_id`, `mock_test_id`, `skill`
- `answers` jsonb
- `score`, `band_score`, `ai_feedback` (writing/speaking uchun)
- `submitted_at`

## 2. Admin — Yangi Mock Test Builder

`MockTestsTab.tsx` ni to'liq qayta yozamiz:

- Series (yaratish/o'chirish/rang) — hozirgi qismi qoladi
- Har mock ichida: **4 skill karta** (Listening / Reading / Writing / Speaking)
- Har skill ochilganda: **Parts** paneli (Part qo'shish, o'chirish, tartib)
- Har Part ichida:
  - Skillga qarab: matn / audio yuklash / rasm yuklash / instruction
  - **Questions builder** — savol turini tanlash → dinamik forma:
    - multiple_choice: variant qatorlari + to'g'ri javobni tanlash
    - true_false_notgiven: to'g'ri javobni radio
    - matching: chap tomon banki + o'ng tomon items
    - sentence_completion: matn ichida `___` (yoki `{{1}}`) + accepted answers
    - writing_task: rubrik + minimal so'zlar
    - speaking_question: audio prompt (optional) + savol
  - Savollarni tartib bilan qayta ko'rish

Mavjud `tests` bilan bog'liq ustunlarni (`listening_test_id` va h.k.) ishlatishni to'xtatamiz — sof mock kontenti.

## 3. Mock Test Player (Jumpinto-style)

Yangi sahifa: `/mock/:mockId/:skill`

Layout (screenshotlarga qarab):
- Yuqorida: logo + "Mock Test" + timer + tema/til
- Chap: **PART N** + audio player (listening) yoki passage (reading) yoki task brief (writing) yoki savollar ro'yxati (speaking)
- O'ng: **Questions X-Y** paneli — savol turiga qarab render
- Pastda: navigator bar — `Scores | 1 2 3 4 | Reading →` (skill oralig'ida navigatsiya)
- Timer tugagach yoki "Submit" bosilganda:
  - Listening/Reading: avtomatik ball hisoblanadi (accepted answers bilan solishtirish, case-insensitive)
  - Writing/Speaking: `check-writing` / `check-speaking` edge function orqali AI baholash
- Scores ekrani: to'g'ri/noto'g'ri, band score konvertatsiyasi

Har savol turi uchun renderer (`QuestionRenderer.tsx`):
- Radio (MC / TFNG / YNNG)
- Checkbox (MC-multi)
- Text input (completion, short answer)
- Drag/select matching
- Textarea + word counter (writing)
- MediaRecorder (speaking)

## 4. Practice Testlarni Ham Kengaytirish

Mavjud `questions` jadvaliga yangi `question_type` qiymatlarini qo'shamiz (yuqoridagi ro'yxatdagilar). `TestInterface.tsx` va `QuestionFormDialog.tsx` yangi turlarni qo'llasin. Admin practice test yaratishda ham xuddi shu builder komponentidan foydalanadi (`QuestionEditor.tsx` — umumiy komponent).

## 5. Dashboard Redesign — "1 Milliardlik"

`Dashboard.tsx` ni premium darajaga ko'taramiz:

- **Hero:** Katta gradient mesh fon (radial + conic), foydalanuvchi ismi, level ring (SVG animated), streak flame ikonasi (Lottie-style pulse), Pro badge
- **Bento grid** (12-col):
  - Katta karta: Haftalik AI study plan preview + progress ring
  - O'rta karta: Band score bashorati (chart)
  - Kichik kartalar: XP, streak, tests taken, mock hisobi
  - "Continue mock test" resume banneri (agar tugallanmagan attempt bo'lsa)
- **Study heatmap** — GitHub uslubidagi (mavjud, redizayn)
- **Motion:** framer-motion stagger, hover 3D tilt, glassmorphism `backdrop-blur-xl`, border gradient
- Semantic tokenlar (`index.css`), yangi `--gradient-hero`, `--shadow-premium` qo'shamiz
- To'liq responsive, mobile-first

## Texnik amalga oshirish tartibi

1. **Migration** — yangi 3 jadval + eski `mock_tests` skill_id ustunlarini `nullable` qoldiramiz (backward compat)
2. **Admin builder** — `MockTestsTab` qayta yozish + skill/part/question editor
3. **Player** — `/mock/:id/:skill` route, `QuestionRenderer` komponenti, timer, scoring
4. **Auto-grade + AI grade** — edge funksiyalardan foydalanish
5. **Practice** — `questions.question_type` kengaytirish, `TestInterface` yangi renderer
6. **Dashboard** — hero + bento + tokens
7. Sidebar/route: mavjud `/mock-tests` sahifasidan yangi player ga link

## Fayllar (asosiy)

- `supabase/migrations/…_mock_test_content.sql`
- `src/components/admin/MockTestsTab.tsx` (rewrite)
- `src/components/admin/mock/PartsEditor.tsx`, `QuestionEditor.tsx`, `QuestionTypeForms.tsx` (new)
- `src/pages/MockTestPlayer.tsx` (new)
- `src/components/mock/QuestionRenderer.tsx`, `MockTimer.tsx`, `MockNavBar.tsx` (new)
- `src/pages/MockTests.tsx` — yangi playerga yo'naltirish
- `src/pages/Dashboard.tsx` — redesign
- `src/index.css` — yangi tokenlar
- `src/components/TestInterface.tsx` + `QuestionFormDialog.tsx` — yangi savol turlari
