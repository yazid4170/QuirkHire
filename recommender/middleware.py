from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .supabase_client import supabase
import logging
from django.contrib.auth.models import User

logger = logging.getLogger(__name__)

class SupabaseAuthentication(BaseAuthentication):
    def __init__(self, get_response=None):
        self.get_response = get_response

    def __call__(self, request):
        # Process the request
        self.authenticate(request)
        response = self.get_response(request)
        return response

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return None
            
        try:
            token = auth_header.split(' ')[1]
            user = supabase.auth.get_user(token)
            
            if user:
                # Get or create user in your database
                user_profile, created = User.objects.get_or_create(
                    supabase_id=user.id,
                    defaults={'email': user.email}
                )
                return (user_profile, None)
            else:
                raise AuthenticationFailed('Invalid authentication token')
                
        except Exception as e:
            logger.error(f'Authentication error: {str(e)}')
            raise AuthenticationFailed('Authentication failed') 