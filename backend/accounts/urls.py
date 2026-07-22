from django.urls import include, path
from rest_framework import routers

from .views import InvitationViewSet, TeacherListView, StudentListView

app_name = "accounts"

router = routers.DefaultRouter()
router.register(r"teachers", TeacherListView, basename="teacher")
router.register(r"students", StudentListView, basename="student")
router.register(r"invitations", InvitationViewSet, basename="invitation")

urlpatterns = [
    # Authentication (teacher/admin only)
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Authenticated user
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
    # Directories
    path("", include(router.urls)),
]
