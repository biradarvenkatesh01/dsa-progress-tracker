from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Problem, Topic


class StudentDataIsolationTests(APITestCase):
    def setUp(self):
        self.user_one = User.objects.create_user(
            username="student1@example.com",
            email="student1@example.com",
            password="password123",
        )
        self.user_two = User.objects.create_user(
            username="student2@example.com",
            email="student2@example.com",
            password="password123",
        )

        self.topic_one = Topic.objects.create(name="Arrays", owner=self.user_one)
        self.topic_two = Topic.objects.create(name="Graphs", owner=self.user_two)

        self.problem_one = Problem.objects.create(
            title="Two Sum",
            topic=self.topic_one,
            owner=self.user_one,
            difficulty="easy",
            is_solved=True,
        )
        self.problem_two = Problem.objects.create(
            title="Clone Graph",
            topic=self.topic_two,
            owner=self.user_two,
            difficulty="medium",
            is_solved=False,
        )

    def authenticate(self, email, password):
        response = self.client.post(
            "/api/auth/token/",
            {"username": email, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_each_student_sees_only_their_topics_and_problems(self):
        self.authenticate("student1@example.com", "password123")

        topics_response = self.client.get("/api/topics/")
        problems_response = self.client.get("/api/problems/")

        self.assertEqual(topics_response.status_code, status.HTTP_200_OK)
        self.assertEqual(problems_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(topics_response.data), 1)
        self.assertEqual(len(problems_response.data), 1)
        self.assertEqual(topics_response.data[0]["name"], "Arrays")
        self.assertEqual(problems_response.data[0]["title"], "Two Sum")

    def test_student_cannot_create_problem_in_another_students_topic(self):
        self.authenticate("student1@example.com", "password123")

        response = self.client.post(
            "/api/problems/",
            {
                "title": "Alien Dictionary",
                "topic": self.topic_two.id,
                "difficulty": "hard",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("topic", response.data)
