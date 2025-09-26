from django.contrib import admin
from .models import RecommendationFeedback, User, Profile

@admin.register(RecommendationFeedback)
class RecommendationFeedbackAdmin(admin.ModelAdmin):
    list_display = ('resume_id', 'score', 'feedback')
    search_fields = ('resume_id',)
    list_filter = ('feedback',)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'created_at')
    search_fields = ('email',)
    list_filter = ('role', 'created_at')
    
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'bio', 'linkedin', 'github')
    search_fields = ('user__email', 'bio')
    list_filter = ('created_at',)

# Register your models here.
