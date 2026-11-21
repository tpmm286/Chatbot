# گرفتن Build ویندوز با GitHub Actions

1. محتوای این پوشه را در ریشه یک Repository جدید GitHub بارگذاری کن.
2. بهتر است Repository را روی **Private** قرار بده.
3. مطمئن شو فایل `.github/workflows/build-windows.yml` در ریشه مخزن قرار دارد.
4. بعد از Push به شاخه `main` یا `master`، Build خودکار شروع می‌شود.
5. در GitHub وارد تب **Actions** شو و اجرای `Build Windows app` را باز کن.
6. وقتی وضعیت سبز شد، پایین صفحه در بخش **Artifacts** فایل `Chatbot-Coding-Agent-Windows` را دانلود کن.
7. ZIP دانلودشده را استخراج کن؛ فایل Setup با پسوند `.exe` داخل آن است.

برای اجرای دستی نیز در تب Actions، workflow با نام `Build Windows app` را انتخاب و **Run workflow** را بزن.

## نکات امنیتی
- مخزن را Private نگه دار، به‌خصوص اگر فایل‌های محرمانه یا کد خصوصی دارد.
- فایل `.env` و API Key را هرگز commit نکن. فقط `.env.example` بدون کلید واقعی را نگه دار.
- این workflow برای Build نیازی به Secret ابری ندارد.
- Artifact به مدت ۱۴ روز نگهداری می‌شود.
- این workflow فایل EXE را می‌سازد؛ به معنی تست کامل برنامه روی ویندوز واقعی نیست.
