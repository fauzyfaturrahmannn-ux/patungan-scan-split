# Rencana Perbaikan

## 1. Daftar Email pakai OTP (6 digit) ke email

Saat ini saat daftar, sistem mengirim **magic link** (lewat `supabase.auth.signUp`). Akan diganti jadi **OTP 6 digit** yang dikirim ke email, lalu user memasukkan kodenya untuk verifikasi.

**Perubahan di `src/pages/Auth.tsx`:**
- Tambah state baru: `otpSent`, `otpCode`.
- Saat user submit form **Daftar**:
  - Panggil `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, data: { password_hash_pending: ... } } })` — namun karena Supabase OTP via email tidak menyimpan password, kita ubah pendekatan: untuk daftar baru tetap pakai `signUp({ email, password })`, lalu pakai `supabase.auth.signInWithOtp` untuk kirim kode verifikasi 6 digit, dan user verifikasi dengan `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
  - Pendekatan paling bersih: gunakan **OTP-only signup** (tanpa password) → `signInWithOtp({ email, options: { shouldCreateUser: true } })` lalu `verifyOtp({ email, token, type: 'email' })`. Ini menghilangkan field password saat mode Daftar.
- Tampilkan UI input OTP (6 kotak) menggunakan komponen `InputOTP` yang sudah ada di `src/components/ui/input-otp.tsx`.
- Tombol "Verifikasi" memanggil `verifyOtp`; sukses → user otomatis login → redirect.
- Tombol "Kirim ulang kode".
- **Konfigurasi auth** lewat `supabase--configure_auth` dengan `auto_confirm_email: false` (tetap), supaya OTP berfungsi sebagai verifikasi.

**Mode Login (existing user) tetap email + password** seperti sekarang. Hanya mode Daftar yang berubah ke OTP.

## 2. Tombol Transfer wajib menunggu verifikasi host

Saat ini kode `handlePay("transfer")` sebenarnya sudah menset status `pending` (sama seperti cash), tapi UX nya belum jelas: tombol Transfer langsung trigger tanpa konfirmasi user benar-benar sudah transfer.

**Perubahan di `src/pages/RoomPage.tsx`:**
- Saat klik tombol **Transfer**: jangan langsung panggil `handlePay`. Tampilkan panel konfirmasi yang berisi:
  - Info rekening host (sudah ditampilkan di atas).
  - Tombol **"Saya sudah transfer — kirim ke host untuk verifikasi"**.
- Klik tombol konfirmasi → panggil `handlePay("transfer")` → status jadi `pending` → muncul banner "Menunggu verifikasi host".
- Pastikan banner pending sudah jelas (sudah ada di line 390-394, tetap dipakai).
- Host melihat pembayaran di list dan klik **Verifikasi** (sudah ada lewat `verifyPayment`).

Hasilnya: Transfer dan Cash dua-duanya membutuhkan verifikasi host, dan user Transfer mendapat langkah konfirmasi eksplisit.

## File yang akan diubah

- `src/pages/Auth.tsx` — ganti flow Daftar jadi OTP, tambah UI input OTP.
- `src/pages/RoomPage.tsx` — tambah state `showTransferConfirm` dan tombol konfirmasi sebelum `handlePay("transfer")`.

## Catatan teknis

- OTP via `signInWithOtp` mengirim email berisi 6 digit kode (template default Supabase: "Your code is 123456").
- Tidak perlu migrasi DB.
- Tidak perlu edge function baru.
