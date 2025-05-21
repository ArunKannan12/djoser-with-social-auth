from django.contrib.sites.shortcuts import get_current_site
from rest_framework import status, generics
from rest_framework.response import Response
from djoser.conf import settings
from .models import CustomUser,ActivationEmailLog,PasswordResetEmailLog

from .serializers import (ResendActivationEmailSerializer,
                            CustomPasswordResetSerializer,
                            CustomPasswordResetConfirmSerializer)
import math
from djoser.email import ActivationEmail
from djoser.utils import encode_uid
from django.contrib.auth.tokens import default_token_generator
from datetime import timedelta
from django.utils import timezone
from rest_framework.permissions import AllowAny

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
