from django.contrib.sites.shortcuts import get_current_site
from rest_framework import status, generics
from rest_framework.response import Response
from djoser.conf import settings
from .models import CustomUser,ActivationEmailLog,PasswordResetEmailLog

from .serializers import (ResendActivationEmailSerializer,
                            CustomPasswordResetSerializer,
                            CustomPasswordResetConfirmSerializer,
                            FacebookLoginSerializer
                            )
import math
from djoser.email import ActivationEmail
from djoser.utils import encode_uid
from django.contrib.auth.tokens import default_token_generator
from datetime import timedelta
from django.utils import timezone
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from rest_framework.generics import GenericAPIView

import requests
from rest_framework.views import APIView
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings




User = get_user_model()

class CustomActivationEmail(ActivationEmail):
    def __init__(self, user=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = user or kwargs.get('context', {}).get('user')  # Ensure user is set early

    def get_context_data(self):
        context = super().get_context_data()
        context['user'] = self.user
        return context


class ResendActivationEmailView(generics.GenericAPIView):
    serializer_class = ResendActivationEmailSerializer
    permission_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email_address = serializer.validated_data['email']

        try:
            user = CustomUser.objects.get(email=email_address)
        except CustomUser.DoesNotExist:
            return Response(
                {'email': 'User with this email does not exist.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.is_permanently_banned:
            return Response(
                {'detail': 'Your account has been permanently banned due to repeated abuse.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if user.is_active and user.is_verified:
            return Response(
                {'detail': 'User is already activated and verified.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        now = timezone.now()

        if user.blocked_until and now < user.blocked_until:
            remaining = int((user.blocked_until - now).total_seconds())
            return Response(
                {'detail': f'Too many resend attempts. Please try again after {remaining} seconds.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        one_hour_ago = now - timedelta(hours=1)
        recent_logs = ActivationEmailLog.objects.filter(user=user, sent_at__gte=one_hour_ago)

        if recent_logs.count() >= 5:
            user.block_count += 1

            # Progressive block durations: 15 min, 1 hour, 24 hours
            block_durations = [
                timedelta(minutes=15),
                timedelta(hours=1),
                timedelta(days=1),
            ]

            if user.block_count <= len(block_durations):
                user.blocked_until = now + block_durations[user.block_count - 1]
            else:
                # Permanent ban after exceeding blocks
                user.is_permanently_banned = True
                user.blocked_until = None
                user.save(update_fields=['block_count', 'blocked_until', 'is_permanently_banned'])
                return Response(
                    {'detail': 'Your account has been permanently banned due to repeated abuse.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            user.save(update_fields=['block_count', 'blocked_until'])
            block_time = user.blocked_until - now
            minutes = int(block_time.total_seconds() / 60)
            return Response(
                {'detail': f'Too many resend attempts. Your account has been temporarily disabled for {minutes} minutes.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Exponential cooldown logic
        base_cooldown = 10  # seconds
        exponential_factor = min(recent_logs.count(), 4)
        cooldown_duration = timedelta(seconds=base_cooldown * (2 ** exponential_factor))

        if user.last_activation_email_sent and now - user.last_activation_email_sent < cooldown_duration:
            remaining = cooldown_duration - (now - user.last_activation_email_sent)
            return Response(
                {'detail': f'Activation email was sent recently. Please try again after {int(remaining.total_seconds())} seconds.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Send activation email
        token = default_token_generator.make_token(user)
        context = {
            'user': user,
            'uid': encode_uid(user.pk),
            'token': token,
            'site': get_current_site(request),
            'activation_url': settings.ACTIVATION_URL,
        }

        activation_email = CustomActivationEmail(context=context)
        activation_email.send(to=[user.email])

        user.last_activation_email_sent = now
        user.save(update_fields=['last_activation_email_sent'])

        ActivationEmailLog.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )

        return Response({'detail': 'Activation email resent.'}, status=status.HTTP_200_OK)

    
class CustomPasswordResetView(generics.GenericAPIView):
    serializer_class = CustomPasswordResetSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'email': 'User with this email does not exist'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()

        if user.blocked_until_password_reset and now < user.blocked_until_password_reset:
            seconds_left = int((user.blocked_until_password_reset - now).total_seconds())
            minutes_left = math.ceil(seconds_left / 60)
            return Response(
                {'detail': f'Too many password reset attempts. Try again after {minutes_left} minutes.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        base_cooldown = 60
        max_attempts = 5
        cooldown_time = timedelta(seconds=base_cooldown * (2 ** user.block_count_password_reset))

        if user.last_password_reset_sent and (now - user.last_password_reset_sent) < cooldown_time:
            seconds_left = int((cooldown_time - (now - user.last_password_reset_sent)).total_seconds())
            minutes_left = math.ceil(seconds_left / 60)
            return Response(
                {'detail': f'Please wait {minutes_left} minutes before requesting another password reset.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        if user.block_count_password_reset >= max_attempts:
            user.blocked_until_password_reset = now + timedelta(minutes=15)
            user.block_count_password_reset = 0
            user.save(update_fields=['blocked_until_password_reset', 'block_count_password_reset'])
            return Response(
                {'detail': 'Too many attempts. Please try again after 15 minutes.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        serializer.save()

        # Update user tracking fields
        user.last_password_reset_sent = now
        user.block_count_password_reset += 1
        user.save(update_fields=['last_password_reset_sent', 'block_count_password_reset'])

        # Log the password reset attempt
        PasswordResetEmailLog.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )

        return Response({"detail": "Password reset email sent successfully."}, status=status.HTTP_200_OK)


class CustomPasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = CustomPasswordResetConfirmSerializer
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)


class GoogleAuthView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        # Get the ID token sent from frontend
        id_token_str = request.data.get('id_token')
        
        if not id_token_str:
            return JsonResponse({'error': 'ID Token is required'}, status=400)

        try:
            # Verify the ID token with Google
            idinfo = id_token.verify_oauth2_token(id_token_str, Request(), settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY)
            
            # ID token verification passed, check the user's email or other data
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', 'Google')
            last_name = idinfo.get('family_name', '')
            full_name = idinfo.get('name', f"{first_name} {last_name}")
            picture_url = idinfo.get('picture')

            if email is None:
                return JsonResponse({'error': 'Invalid ID Token'}, status=400)
            
            # Find or create the user in your database (you can use email to find the user)
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_verified': True,
                    'is_active': True,
                    'auth_provider': 'google',
                    'social_auth_pro_pic':picture_url
                }
            )
            

            if picture_url and user.social_auth_pro_pic != picture_url:
                user.social_auth_pro_pic = picture_url
                user.save()
            # Create JWT token (access + refresh)
            refresh = RefreshToken.for_user(user)
            
            # Return tokens and user data to frontend
            return JsonResponse({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'email': user.email,
                'full_name': user.get_full_name(),
                'first_name': user.first_name,
                'last_name': user.last_name,
                'social_auth_pro_pic': user.social_auth_pro_pic,
                'auth_provider': user.auth_provider,
                'is_new_user': created,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'message': 'Google authentication successful'
            }, status=200)

        except ValueError:
            # Raised if the token is invalid
            return JsonResponse({'error': 'Invalid ID token'}, status=400)



User=get_user_model()
class facebookLoginView(GenericAPIView):
    serializer_class = FacebookLoginSerializer

    permission_classes = [AllowAny]
    def post(self,request,*args,**kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        access_token = serializer.validated_data.get('access_token')


        fb_response = requests.get(
            'https://graph.facebook.com/me',
            params={
                'fields':'id,name,email',
                'access_token':access_token
            }
        )
        if fb_response.status_code != 200:
            return Response({'error':'invalid facebook token'},status=status.HTTP_400_BAD_REQUEST)
        

        fb_data = fb_response.json()

        email = fb_data.get('email')

        name = fb_data.get('name','')

        user_id = fb_data.get('id')

        if not email:
            return Response({'error':'facebook account must provide an email'},status=status.HTTP_400_BAD_REQUEST)
        
        first_name = name.split(' ')[0]

        last_name = ' '.join(name.split(' ')[1:]) if len (name.split(' ')) > 1 else ''

        pic_response = requests.get(
            f"https://graph.facebook.com/v19.0/{user_id}/picture",
            params={
                "access_token":access_token,
                "redirect":False,
                "type":"large",

            }
        )
        profile_picture=None
        if pic_response.status_code == 200:
            social_auth_pro_pic = pic_response.json().get("data", {}).get("url")

        user, created =User.objects.get_or_create(email=email,defaults={
            'first_name':first_name,
            'last_name':last_name,
            'is_verified':True,
            'is_active':True,
            'auth_provider':'facebook',
            'social_auth_pro_pic':social_auth_pro_pic
        })

        if not created:
            user.first_name = first_name
            user.last_name = last_name
            user.auth_provider = 'facebook'
            if profile_picture:
                user.s = profile_picture
            user.save()
        refresh = RefreshToken.for_user(user)

        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'email': user.email,
            'full_name': user.get_full_name(),
            'first_name': user.first_name,
            'last_name': user.last_name,
            'auth_provider': 'facebook',
            'is_new_user': created,  # If `created` is from get_or_create()
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'profile_picture': user.social_auth_pro_pic,
            'message': 'Facebook authentication successful'
        }, status=status.HTTP_200_OK)
