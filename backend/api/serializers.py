from rest_framework import serializers

from .models import Problem, Topic


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ["id", "name", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProblemSerializer(serializers.ModelSerializer):
    topic_name = serializers.ReadOnlyField(source="topic.name")

    class Meta:
        model = Problem
        fields = [
            "id",
            "title",
            "leetcode_url",
            "topic",
            "topic_name",
            "difficulty",
            "is_solved",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "topic_name"]
