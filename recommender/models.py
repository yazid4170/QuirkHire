from django.db import models

class RecommendationFeedback(models.Model):
    resume_id = models.CharField(max_length=36)
    job_description = models.TextField()
    score = models.FloatField()
    feedback = models.IntegerField()  # 1 for positive, 0 for negative

    class Meta:
        indexes = [
            models.Index(fields=['resume_id']),
        ]

class User(models.Model):
    supabase_id = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=[("candidate", "Candidate"), ("recruiter", "Recruiter")])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"

class Profile(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='user_profile'
    )
    bio = models.TextField(blank=True)
    website = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    github = models.URLField(blank=True)
    twitter = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    @property
    def completeness(self):
        required_fields = [
            'first_name', 'last_name', 'profile_picture', 'bio'
        ]
        completed = 0
        
        for field in required_fields:
            if getattr(self, field):
                completed += 1
                
        return int((completed / len(required_fields)) * 100)