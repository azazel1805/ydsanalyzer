[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

# Bu blok, build işlemi sırasında kullanılacak ortam değişkenlerini tanımlar.
# SECRETS_SCAN_OMIT_KEYS değişkenini burada tanımlayarak build işlemine 
# bu kuralı bilerek başlamasını sağlıyoruz.
[build.environment]
  SECRETS_SCAN_OMIT_KEYS = "VITE_FIREBASE_API_KEY,VITE_FIREBASE_APP_ID,VITE_FIREBASE_AUTH_DOMAIN,VITE_FIREBASE_MESSAGING_SENDER_ID,VITE_FIREBASE_PROJECT_ID,VITE_FIREBASE_STORAGE_BUCKET"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
