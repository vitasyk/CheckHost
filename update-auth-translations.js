const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'messages');

const newTranslations = {
    Auth: {
        signin: {
            title: "Welcome to CheckHost",
            subtitle: "Sign in to access your dashboard and monitoring tools",
            googleBtn: "Continue with Google",
            or: "or",
            adminBtn: "Admin Login",
            emailPlace: "Email address",
            passPlace: "Password",
            submitBtn: "Sign in with Password",
            cancel: "Cancel",
            invalid: "Invalid email or password",
            error: "An error occurred during sign in",
            terms: "Terms",
            privacy: "Privacy"
        }
    }
};

const translationsByLocale = {
    en: newTranslations,
    uk: {
        Auth: {
            signin: {
                title: "Вітаємо у CheckHost",
                subtitle: "Увійдіть для доступу до панелі інструментів та моніторингу",
                googleBtn: "Продовжити з Google",
                or: "або",
                adminBtn: "Вхід для адміністраторів",
                emailPlace: "Електронна пошта",
                passPlace: "Пароль",
                submitBtn: "Увійти з паролем",
                cancel: "Скасувати",
                invalid: "Неправильний email або пароль",
                error: "Помилка авторизації. Будь ласка, перевірте дані.",
                terms: "Умови",
                privacy: "Конфіденційність"
            }
        }
    },
    ru: {
        Auth: {
            signin: {
                title: "Добро пожаловать в CheckHost",
                subtitle: "Войдите для доступа к панели инструментов и мониторингу",
                googleBtn: "Продолжить с Google",
                or: "или",
                adminBtn: "Вход для администраторов",
                emailPlace: "Электронная почта",
                passPlace: "Пароль",
                submitBtn: "Войти с паролем",
                cancel: "Отмена",
                invalid: "Неверный email или пароль",
                error: "Ошибка авторизации. Пожалуйста, проверьте данные.",
                terms: "Условия",
                privacy: "Конфиденциальность"
            }
        }
    },
    de: {
        Auth: {
            signin: {
                title: "Willkommen bei CheckHost",
                subtitle: "Melden Sie sich an, um auf Ihr Dashboard und die Überwachungs-Tools zuzugreifen",
                googleBtn: "Weiter mit Google",
                or: "oder",
                adminBtn: "Admin-Login",
                emailPlace: "E-Mail-Adresse",
                passPlace: "Passwort",
                submitBtn: "Mit Passwort anmelden",
                cancel: "Abbrechen",
                invalid: "Ungültige E-Mail oder Passwort",
                error: "Bei der Anmeldung ist ein Fehler aufgetreten",
                terms: "Bedingungen",
                privacy: "Datenschutz"
            }
        }
    },
    fr: {
        Auth: {
            signin: {
                title: "Bienvenue sur CheckHost",
                subtitle: "Connectez-vous pour accéder à votre tableau de bord et aux outils de surveillance",
                googleBtn: "Continuer avec Google",
                or: "ou",
                adminBtn: "Connexion Administrateur",
                emailPlace: "Adresse e-mail",
                passPlace: "Mot de passe",
                submitBtn: "Se connecter avec un mot de passe",
                cancel: "Annuler",
                invalid: "E-mail ou mot de passe invalide",
                error: "Une erreur s'est produite lors de la connexion",
                terms: "Conditions",
                privacy: "Confidentialité"
            }
        }
    },
    es: {
        Auth: {
            signin: {
                title: "Bienvenido a CheckHost",
                subtitle: "Inicie sesión para acceder a su panel y herramientas de monitoreo",
                googleBtn: "Continuar con Google",
                or: "o",
                adminBtn: "Acceso de Administrador",
                emailPlace: "Correo electrónico",
                passPlace: "Contraseña",
                submitBtn: "Iniciar sesión con contraseña",
                cancel: "Cancelar",
                invalid: "Correo electrónico o contraseña no válidos",
                error: "Ocurrió un error durante el inicio de sesión",
                terms: "Términos",
                privacy: "Privacidad"
            }
        }
    },
    nl: {
        Auth: {
            signin: {
                title: "Welkom bij CheckHost",
                subtitle: "Meld u aan om toegang te krijgen tot uw dashboard en monitoringtools",
                googleBtn: "Doorgaan met Google",
                or: "of",
                adminBtn: "Beheerderslogin",
                emailPlace: "E-mailadres",
                passPlace: "Wachtwoord",
                submitBtn: "Aanmelden met wachtwoord",
                cancel: "Annuleren",
                invalid: "Ongeldig e-mailadres of wachtwoord",
                error: "Er is een fout opgetreden bij het aanmelden",
                terms: "Voorwaarden",
                privacy: "Privacy"
            }
        }
    },
    pl: {
        Auth: {
            signin: {
                title: "Witamy w CheckHost",
                subtitle: "Zaloguj się, aby uzyskać dostęp do panelu i narzędzi monitorowania",
                googleBtn: "Kontynuuj z Google",
                or: "lub",
                adminBtn: "Logowanie administratora",
                emailPlace: "Adres e-mail",
                passPlace: "Hasło",
                submitBtn: "Zaloguj się hasłem",
                cancel: "Anuluj",
                invalid: "Nieprawidłowy e-mail lub hasło",
                error: "Wystąpił błąd podczas logowania",
                terms: "Warunki",
                privacy: "Prywatność"
            }
        }
    },
    it: {
        Auth: {
            signin: {
                title: "Benvenuto in CheckHost",
                subtitle: "Accedi per visualizzare la dashboard e gli strumenti di monitoraggio",
                googleBtn: "Continua con Google",
                or: "o",
                adminBtn: "Accesso Amministratore",
                emailPlace: "Indirizzo email",
                passPlace: "Password",
                submitBtn: "Accedi con password",
                cancel: "Annulla",
                invalid: "Email o password non valide",
                error: "Si è verificato un errore durante l'accesso",
                terms: "Termini",
                privacy: "Privacy"
            }
        }
    }
};

const locales = ['en', 'uk', 'es', 'de', 'fr', 'ru', 'nl', 'pl', 'it'];

locales.forEach(locale => {
    const filePath = path.join(messagesDir, `${locale}.json`);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const translation = translationsByLocale[locale] || newTranslations;

        // Merge
        data.Auth = {
            ...data.Auth,
            signin: {
                ...(data.Auth && data.Auth.signin ? data.Auth.signin : {}),
                ...translation.Auth.signin
            }
        };

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Updated ${locale}.json`);
    } else {
        console.log(`File not found: ${locale}.json`);
    }
});
