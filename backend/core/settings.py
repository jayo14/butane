"""Django settings for the butane backend.

Environment-driven configuration. All secrets and environment-specific values
are read from environment variables (see .env.example). Designed to run in both
development (DEBUG=true) and production (DEBUG=false) without code changes.
"""
from pathlib import Path

from core.dj_env import Env

env = Env()
env_file = Path(__file__).resolve().parent.parent / ".env"
if env_file.exists():
    env.read_env(str(env_file))

BASE_DIR = Path(__file__).resolve().parent.parent


def _as_bool(value: str, default: bool = False) -> bool:
    return str(value).lower() in {"1", "true", "yes", "on"}


DEBUG = _as_bool(env("DJANGO_DEBUG", default="false"))

SECRET_KEY = env("DJANGO_SECRET_KEY", default="insecure-dev-key-change-me")

ALLOWED_HOSTS = [h.strip() for h in env("DJANGO_ALLOWED_HOSTS", default="").split(",") if h.strip()]
if DEBUG:
    ALLOWED_HOSTS += ["localhost", "127.0.0.1", "0.0.0.0", "testserver"]
    if not ALLOWED_HOSTS:
        ALLOWED_HOSTS = ["*"]

# Production guard: refuse to start with the insecure default secret in production.
if not DEBUG and SECRET_KEY in {"insecure-dev-key-change-me"}:
    raise RuntimeError("DJANGO_SECRET_KEY must be set to a secure value in production.")

# Base site URL used to build shareable public exam links.
SITE_URL = env("SITE_URL", default="")

CSRF_TRUSTED_ORIGINS = [o.strip() for o in env("CSRF_TRUSTED_ORIGINS", default="").split(",") if o.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    "rest_framework_simplejwt.token_blacklist",
    # Local apps
    "accounts",
    "exams",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "core.middleware.RequestLoggingMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"


# --- Database ---------------------------------------------------------------
DB_ENGINE = env("DB_ENGINE", default="sqlite")
if DB_ENGINE == "postgresql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("DB_NAME", default="butane"),
            "USER": env("DB_USER", default="butane"),
            "PASSWORD": env("DB_PASSWORD", default="butane"),
            "HOST": env("DB_HOST", default="localhost"),
            "PORT": env("DB_PORT", default="5432"),
            "CONN_MAX_AGE": 60,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / env("DB_NAME", default="db.sqlite3"),
        }
    }


# --- Password validation ----------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTH_USER_MODEL = "accounts.User"


# --- Internationalization ---------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# --- Static & media files ---------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"


# --- Django REST Framework --------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
}


# --- Simple JWT -------------------------------------------------------------
JWT_SECRET = env("JWT_SECRET_KEY", default="insecure-dev-jwt-key-change-me")
if not DEBUG and JWT_SECRET == "insecure-dev-jwt-key-change-me":
    raise RuntimeError("JWT_SECRET_KEY must be set to a secure value in production.")

TOKEN_HASH_SECRET = env("TOKEN_HASH_SECRET", default=JWT_SECRET)

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": env.timedelta("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", default=60, unit="minutes"),
    "REFRESH_TOKEN_LIFETIME": env.timedelta("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7, unit="days"),
    "SIGNING_KEY": JWT_SECRET,
    "ALGORITHM": "HS256",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "USER_SETTINGS": "core.settings",
}


# --- drf-spectacular (Swagger/OpenAPI) -------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "Butane Exam Platform API",
    "DESCRIPTION": "Production-ready REST API for the Butane exam/assessment platform.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": "/api",
    "COMPONENT_SPLIT_REQUEST": True,
    "ENUM_NAME_OVERRIDES": {
        "StatusEnum": "exams.models.Exam.STATUS_CHOICES",
        "QuestionTypeEnum": "exams.models.Question.QUESTION_TYPES",
        "AttemptStatusEnum": "exams.models.Attempt.STATUS_CHOICES",
    },
    "TAGS": [
        {"name": "Authentication", "description": "JWT login, logout, and current user."},
        {"name": "Accounts", "description": "Teacher and student directories."},
        {"name": "Exams", "description": "Exam CRUD, publish, share, duplicate, archive."},
        {"name": "Questions", "description": "Nested question management under an exam."},
        {"name": "Attempts", "description": "Student attempts and submissions."},
        {"name": "Results", "description": "Aggregated results and reporting."},
        {"name": "Public", "description": "Unauthenticated student examination flow."},
        {"name": "Reports", "description": "Teacher analytics and statistics."},
    ],
    "CONTACT": {"name": "Butane Platform", "url": "https://butane.example.com"},
}


# --- CORS ------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [o.strip() for o in env("CORS_ALLOWED_ORIGINS", default="").split(",") if o.strip()]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False


# --- Security (production-hardened) ----------------------------------------
if not DEBUG:
    SECURE_SSL_REDIRECT = _as_bool(env("SECURE_SSL_REDIRECT", default="false"))
    SECURE_HSTS_SECONDS = int(env("SECURE_HSTS_SECONDS", default="0"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
    SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
    SECURE_CROSS_ORIGIN_EMBEDDER_POLICY = "require-corp"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    CSRF_COOKIE_SAMESITE = "Lax"
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")


# --- Logging ----------------------------------------------------------------
LOG_LEVEL = env("DJANGO_LOG_LEVEL", default="INFO" if DEBUG else "WARNING")
LOG_DIR = BASE_DIR / "core" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{asctime} {levelname} {name} {module}.{funcName}:{lineno} — {message}",
            "style": "{",
        },
        "json": {
            "()": "core.logging_utils.JsonFormatter",
        },
    },
    "filters": {
        "require_debug_false": {"()": "django.utils.log.RequireDebugFalse"},
        "require_debug_true": {"()": "django.utils.log.RequireDebugTrue"},
    },
    "handlers": {
        "console": {
            "level": LOG_LEVEL,
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": {
            "level": "INFO",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": str(LOG_DIR / "butane.log"),
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "json" if not DEBUG else "verbose",
            "encoding": "utf-8",
        },
        "mail_admins": {
            "level": "ERROR",
            "filters": ["require_debug_false"],
            "class": "django.utils.log.AdminEmailHandler",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": LOG_LEVEL,
            "propagate": True,
        },
        "butane": {
            "handlers": ["console", "file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "django.request": {
            "handlers": ["mail_admins"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
