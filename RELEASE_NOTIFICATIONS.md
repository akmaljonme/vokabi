# Yangilanish e'lonlari — standart amaliyot

Har safar yangi funksiya yoki muhim yangilanish chiqarilganda, **barcha
foydalanuvchilarga** shu haqda in-app bildirishnoma yuborilishi kerak
(Bildirishnomalar bo'limida ko'rinadi — `/notifications`).

## Qanday yuborish mumkin

### 1) Admin panel orqali (tavsiya etiladi)
Admin Dashboard → **"Yangilanish e'loni"** bo'limi → sarlavha va matn kiriting →
"Barcha foydalanuvchilarga yuborish". Faqat `admin` roli bo'lgan foydalanuvchilar
buni qila oladi.

### 2) SQL orqali (Supabase SQL Editor yoki MCP)
```sql
INSERT INTO public.notifications (user_id, type, title, body)
SELECT user_id, 'announcement', '🎉 Sarlavha', 'Matn...'
FROM public.profiles;
```

### 3) Kod orqali (RPC)
```ts
await supabase.rpc('broadcast_notification', {
  p_title: '🎉 Sarlavha',
  p_body: 'Matn...',
  p_type: 'announcement', // ixtiyoriy, default shu
});
```

## Nega bu muhim
Foydalanuvchilar yangi funksiyalarni (Feed, Do'stlar, Challenge va h.k.)
o'zlari bilib olishlarini kutmasdan, biz ularni faol ravishda xabardor
qilamiz — bu yangi funksiyalardan foydalanish darajasini oshiradi.

**Qoida**: har bir sezilarli yangilanishdan so'ng — shu jarayonni bajarish
standart amaliyot hisoblanadi.
