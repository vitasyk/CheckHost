# 📝 Інструкція з розгортання CheckHost на сервері

Ця інструкція допоможе вам розгорнути проект CheckHost у продакшн-середовищі за допомогою **Docker Compose** та **Caddy**.

---

## 🏗 Крок 1: Підготовка сервера

Перед початком переконайтеся, що на вашому сервері (Ubuntu/Debian/CentOS) встановлено:
1. **Docker**
2. **Docker Compose** (v2+)
3. **Git**

---

## 📂 Крок 2: Клонування проекту

```bash
git clone <url-вашого-репозиторію>
cd CheckHost
```

---

## ⚙️ Крок 3: Налаштування середовища (.env)

Скопіюйте приклад файлу оточення та налаштуйте його:
```bash
cp .env.example .env
nano .env
```

### Важливі змінні, які потрібно змінити:
- `DOMAIN_NAME`: Ваш домен (напр. `checknode.io`) — **ОБОВ'ЯЗКОВО**.
- `ADMIN_EMAIL`: Ваш основний Email (використовується для SSL-сертифікатів та як логін адміна) — **ОБОВ'ЯЗКОВО**.
- `NEXT_PUBLIC_SITE_URL`: Те саме, що й ваш домен з https (`https://checknode.io`).
- `NEXTAUTH_SECRET`: Згенеруйте новий (`openssl rand -base64 32`).
- `NEXTAUTH_URL`: Повна адреса вашого сайту (напр. `https://yourdomain.com`).
- `ADMIN_PASSWORD`: Ваш пароль адміністратора для входу.
- `CRON_SECRET`: Згенеруйте надійний секрет для крона.

---

## 🚀 Крок 4: Запуск проекту

Використовуйте готову команду npm або напряму docker-compose:
```bash
# Через npm
npm run docker:up

# Або напряму
docker compose up -d --build
```

Це зановить:
- **App**: Ваш Next.js застосунок.
- **DB**: PostgreSQL 15.
- **Caddy**: Веб-сервер з автоматичним SSL.
- **Redis**: Система кешування.

---

## 🔍 Крок 5: Перевірка та логи

1. **Сайти**: Перейдіть за адресою `https://yourdomain.com`.
2. **Логи**: Якщо щось не працює:
   ```bash
   docker compose logs -f app
   ```

---

## 🛠 Обслуговування

- **Оновлення**:
  ```bash
  git pull
  docker compose up -d --build
  ```
- **Бекап бази**:
  ```bash
  docker exec checkhost-db pg_dump -U postgres checkhost > backup.sql
  ```
