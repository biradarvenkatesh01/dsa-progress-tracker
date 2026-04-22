from django.contrib.auth.models import User
from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Problem, Topic
from .serializers import ProblemSerializer, TopicSerializer


class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticated]


class ProblemViewSet(viewsets.ModelViewSet):
    serializer_class = ProblemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Problem.objects.select_related("topic").all()

        topic_id = self.request.query_params.get("topic")
        difficulty = self.request.query_params.get("difficulty")
        is_solved = self.request.query_params.get("is_solved")

        if topic_id:
            queryset = queryset.filter(topic_id=topic_id)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if is_solved is not None:
            if is_solved.lower() in {"true", "1", "yes"}:
                queryset = queryset.filter(is_solved=True)
            elif is_solved.lower() in {"false", "0", "no"}:
                queryset = queryset.filter(is_solved=False)

        return queryset


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = (attrs.get("email") or attrs.get("username") or "").strip().lower()
        if email:
            user = User.objects.filter(email=email).first()
            if user:
                attrs["username"] = user.username
        return super().validate(attrs)


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    name = (request.data.get("name") or "").strip()
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""

    if not name or not email or not password:
        return Response(
            {"detail": "Name, email, and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"detail": "An account with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=email,
        first_name=name,
        email=email,
        password=password,
    )

    return Response(
        {"id": user.id, "name": user.first_name, "email": user.email},
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def progress_stats(request):
    total_topics = Topic.objects.count()
    total_problems = Problem.objects.count()
    solved_problems = Problem.objects.filter(is_solved=True).count()
    unsolved_problems = total_problems - solved_problems

    solved_percentage = (
        round((solved_problems / total_problems) * 100, 2) if total_problems else 0
    )

    by_difficulty = Problem.objects.values("difficulty").annotate(
        total=Count("id"),
        solved=Count("id", filter=Q(is_solved=True)),
    )
    difficulty_map = {
        "easy": {"total": 0, "solved": 0, "unsolved": 0},
        "medium": {"total": 0, "solved": 0, "unsolved": 0},
        "hard": {"total": 0, "solved": 0, "unsolved": 0},
    }
    for item in by_difficulty:
        total = item["total"]
        solved = item["solved"]
        difficulty_map[item["difficulty"]] = {
            "total": total,
            "solved": solved,
            "unsolved": total - solved,
        }

    topics_breakdown = Topic.objects.annotate(
        total_problems=Count("problems"),
        solved_problems=Count("problems", filter=Q(problems__is_solved=True)),
    ).values("id", "name", "total_problems", "solved_problems")

    topics = []
    for topic in topics_breakdown:
        total = topic["total_problems"]
        solved = topic["solved_problems"]
        topics.append(
            {
                "id": topic["id"],
                "name": topic["name"],
                "total_problems": total,
                "solved_problems": solved,
                "unsolved_problems": total - solved,
                "completion_percentage": round((solved / total) * 100, 2) if total else 0,
            }
        )

    return Response(
        {
            "total_topics": total_topics,
            "total_problems": total_problems,
            "solved_problems": solved_problems,
            "unsolved_problems": unsolved_problems,
            "solved_percentage": solved_percentage,
            "difficulty_breakdown": difficulty_map,
            "topics_breakdown": topics,
        }
    )
