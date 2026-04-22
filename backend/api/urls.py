from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    EmailTokenObtainPairView,
    ProblemViewSet,
    TopicViewSet,
    progress_stats,
    register_user,
)

router = DefaultRouter()
router.register("topics", TopicViewSet, basename="topic")
router.register("problems", ProblemViewSet, basename="problem")

urlpatterns = [
    path("auth/register/", register_user, name="register_user"),
    path("auth/token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("progress/stats/", progress_stats, name="progress_stats"),
    path("", include(router.urls)),
]
