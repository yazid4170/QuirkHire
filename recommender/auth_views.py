from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .supabase_client import supabase
import logging
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class SignUpView(APIView):
    def post(self, request):
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            role = 'candidate'  # Hardcoded for candidate signup
            
            # Create user in Supabase
            response = supabase.auth.sign_up({
                'email': email,
                'password': password,
                'options': {
                    'data': {
                        'role': role,
                        'account_type': 'candidate'
                    }
                }
            })
            
            if response.user:
                # Create profile with role
                profile_response = supabase.table('profiles').upsert({
                    'id': response.user.id,
                    'email': email,
                    'role': role,
                    'created_at': datetime.now().isoformat()
                }).execute()
                
                if profile_response.error:
                    raise Exception(profile_response.error.message)
                
                return Response({
                    'message': 'Candidate created successfully',
                    'user_id': response.user.id,
                    'role': role
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': 'Candidate creation failed'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f'Error in candidate signup: {str(e)}')
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create_recruiter_profile(self, user, profile_data):
        supabase = create_client(
            url=os.getenv("SUPABASE_URL"),
            key=os.getenv("SUPABASE_ANON_KEY"),
        )
        supabase.table('recruiter_profiles').insert({
            'id': user.id,
            'company_name': profile_data.get('company_name'),
            'website': profile_data.get('website'),
            'company_size': profile_data.get('company_size'),
            'industry': profile_data.get('industry')
        }).execute()

class LoginView(APIView):
    def post(self, request):
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            
            # Authenticate user with Supabase
            response = supabase.auth.sign_in_with_password({
                'email': email,
                'password': password
            })
            
            if response.user:
                return Response({
                    'access_token': response.session.access_token,
                    'refresh_token': response.session.refresh_token,
                    'user': response.user
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Authentication failed'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
            logger.error(f'Error in user login: {str(e)}')
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 