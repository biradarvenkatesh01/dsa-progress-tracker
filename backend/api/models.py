from django.db import models


class Topic(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Problem(models.Model):
    class DifficultyChoices(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"

    title = models.CharField(max_length=255)
    leetcode_url = models.URLField(blank=True)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name="problems")
    difficulty = models.CharField(max_length=10, choices=DifficultyChoices.choices)
    is_solved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("title", "topic")

    def __str__(self):
        return f"{self.title} ({self.topic.name})"
