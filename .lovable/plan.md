# Alisa — Vokabi ovozli AI yordamchisi

## Umumiy oqim

```text
[Mic tugma] → useVoiceRecognition (Web Speech API, uz-UZ→en-US fallback)
        │
        ├─ Buyruq rejimi ─► voice-assistant-command edge (Gemini JSON intent)
        │                     ├─ navigate → react-router
        │                     ├─ action   → local handler
        │                     └─ chat     → reply
        │
        └─ Speaking rejimi ─► voice-speaking-practice edge (Gemini examiner)
                                └─ 4-savoldan keyin → check-speaking (mavjud)

Har bir reply → elevenlabs-tts (mavjud, keshlangan)
```

## 1. Backend

### Migration
Yangi jadval `voice_usage` (user_id, used_date, count) + `increment_voice_usage(_user_id)` RPC. Kunlik limit: free = 20, pro = cheksiz.

### Yangi edge function: `voice-assistant-command`
- Kirish: `{ transcript, currentPath, conversationHistory? }`
- Auth tekshiruvi + kunlik limit (RPC orqali)
- Gemini `gemini-2.0-flash` chaqiriladi, JSON tizim prompti (loyihadagi ` /dashboard /games /practice /exams /leaderboard /pricing /articles` yo'llari) bilan
- Javobni JSON code fence'dan tozalash, `try/catch` bilan fallback intent `chat`
- Chiqish: `{ intent, path, action, reply }`

### Yangi edge function: `voice-speaking-practice`
- Kirish: `{ history, part (1|2|3), topic? }`
- Gemini IELTS examiner tizim prompti — qisqa, tabiiy, keyingi savol
- Chiqish: `{ reply, shouldAssess: boolean }` (4 turdan keyin `true`)
- Auth + kunlik limit tekshiruvi

Ikkala funksiya CORS sarlavhalarini `elevenlabs-tts`dan takrorlaydi.

### `elevenlabs-tts` keshi
Xotira ichida `Map<hash, ArrayBuffer>` — bir instansiya davomida takroriy matn qayta TTS'ga bormasin (100 tagacha, LRU).

## 2. Frontend

### `src/hooks/useVoiceRecognition.ts`
- `SpeechRecognition | webkitSpeechRecognition` mavjudligini tekshiradi
- `isSupported`, `isListening`, `transcript`, `error`, `start(lang)`, `stop()`
- `uz-UZ` bilan boshlaydi; bo'sh natija yoki `no-speech` xatosida `en-US` bilan qayta urinadi
- Push-to-talk: har `start` alohida sessiya, doimiy tinglash yo'q

### `src/hooks/useVoicePlayback.ts`
- Blob URL keshi (`Map<text, string>`) + `audio.play()`
- `elevenlabs-tts` funksiyasiga `supabase.functions.invoke` bilan

### `src/components/VoiceAssistant.tsx`
Suzuvchi widget (ekranning past-o'ng burchagi, `AppLayout`ga qo'shiladi):
- **Yopiq holat:** doira tugma, Mic ikonkasi, `framer-motion` bilan pulse
- **Ochiq holat:** kengaygan panel (`Card`, `bg-card/95 backdrop-blur`, semantik ranglar):
  - Rejim toggle: `Buyruq | Speaking`
  - Jonli transkript
  - Oxirgi 4 xabar (foydalanuvchi + Alisa) — pufakchalar
  - Katta mikrofon tugmasi (push-to-talk): bosilganda tinglash animatsiyasi (to'lqinli 3 nuqta)
  - Yordamchi holatlari: mikrofon ruxsati yo'q → "Ruxsat berish" tugmasi; STT qo'llab-quvvatlanmaydi → matn kiritish maydoni; limit tugadi → AI Tutor'ga link
- Har javob geliyar TTS orqali o'qiladi va matn sifatida ham ko'rsatiladi

### `AppLayout.tsx`ga integratsiya
Login qilingan foydalanuvchilar uchun `<VoiceAssistant />` qo'shiladi. `/tests/:id` va `/exams` da faol testda yashiriladi (test interfeysida focus buzilmasin).

## 3. Sifat nazorati

- Har edge deploydan keyin `curl_edge_functions` bilan smoke test
- `tsgo` bilan tip-check (harness avtomatik bajaradi)
- Mobil Safari fallback: STT yo'q bo'lsa matn input paneli avtomatik ko'rinadi

## Fayllar

**Yangi**
- `supabase/migrations/<ts>_voice_usage.sql`
- `supabase/functions/voice-assistant-command/index.ts`
- `supabase/functions/voice-speaking-practice/index.ts`
- `src/hooks/useVoiceRecognition.ts`
- `src/hooks/useVoicePlayback.ts`
- `src/components/VoiceAssistant.tsx`

**O'zgartiriladi**
- `supabase/functions/elevenlabs-tts/index.ts` (kesh + kunlik limit inkrementi)
- `src/components/AppLayout.tsx` (widget mount)

## Muhim qarorlar
- Faqat push-to-talk (doimiy tinglash yo'q — batareya, maxfiylik, brauzer siyosati)
- STT butunlay klientda (bepul, past kechikish)
- Intent klassifikatori server tarafda (prompt injection'dan himoya + versiyalash oson)
- Kunlik limit RPC `SECURITY DEFINER` orqali — mijoz aylanib o'tolmaydi