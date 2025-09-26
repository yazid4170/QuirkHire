from rest_framework import serializers
from datetime import date

class ResumeSerializer(serializers.Serializer):
    id = serializers.CharField()
    user_id = serializers.UUIDField()
    name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    address = serializers.CharField(allow_null=True)
    dob = serializers.CharField(allow_null=True)
    education = serializers.ListField(child=serializers.DictField())
    skills = serializers.ListField(child=serializers.CharField())
    experience = serializers.ListField(child=serializers.DictField())
    languages = serializers.ListField(child=serializers.CharField())
    certifications = serializers.ListField(child=serializers.CharField())
    embedding = serializers.CharField(required=False)  # Optional field
    score = serializers.FloatField()  # Ensure this field is included
