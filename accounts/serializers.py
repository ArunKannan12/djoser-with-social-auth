from djoser.serializers import UserCreateSerializer,PasswordResetConfirmSerializer
from .models import CustomUser
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes,force_str
from django.utils.http import urlsafe_base64_encode,urlsafe_base64_decode
from django.template.loader import render_to_string
from django.core.mail import send_mail


User=get_user_model()
print(User)

class UserSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'password']
        extra_kwargs = {'password': {'write_only': True}}


class ResendActivationEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class CustomPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self,value):
        try:
            self.user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user is associated with this email address")

        if not (self.user.is_active and self.user.is_verified):
            raise serializers.ValidationError("User account is inactive or not verified")

        return value

    def get_user(self):
        return self.user

    def save(self):
        request = self.context.get('request')
        
        user = self.get_user()

        # Generate password reset token and uid
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Prepare email content
        context = {
            'user': user,
            'uid': uid,
            'token': token,
            'protocol': 'https' if request.is_secure() else 'http',
            'domain': request.get_host(),
        }

        subject = 'Password Reset Requested'
        message = render_to_string('accounts/password_reset_email.html', context)
        send_mail(subject, message, None, [user.email])


class CustomPasswordResetConfirmSerializer(PasswordResetConfirmSerializer):
    def validate(self, attrs):
        uid = attrs.get('uid')
        token = attrs.get('token')
        new_password = attrs.get('new_password')
        try:

            uid = force_str(urlsafe_base64_decode(uid))
            self.user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError('Invalid UID')

        if not default_token_generator.check_token(self.user, token):
            raise serializers.ValidationError('Invalid or expired token')

        if self.user.check_password(new_password):
            raise serializers.ValidationError("New password cannot be the same as the old password")
        return attrs

    
    def save(self):
        password = self.validated_data['new_password']
        self.user.set_password(password)
        self.user.save()
        return self.user