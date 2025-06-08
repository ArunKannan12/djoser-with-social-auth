from djoser.serializers import PasswordResetConfirmSerializer
from .models import CustomUser
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes,force_str
from django.utils.http import urlsafe_base64_encode,urlsafe_base64_decode
from django.template.loader import render_to_string
from django.core.mail import send_mail
from djoser.email import ActivationEmail
from django.contrib.auth.password_validation import validate_password
import json

User=get_user_model()

class UserSerializer(serializers.ModelSerializer):
    custom_user_profile = serializers.ImageField(required=False, allow_null=True)
    password = serializers.CharField(write_only=True, required=False)
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'password',
            'custom_user_profile', 'social_auth_pro_pic',
            'phone_number', 'address', 'pincode',
            'district', 'city', 'state'
        ]
        read_only_fields = ['id', 'email', 'social_auth_pro_pic'] 
    
    def validate(self, attrs):
        password = attrs.get('password')
        if password:
            user = self.instance or CustomUser(email=attrs.get('email', 'example@example.com'))
            validate_password(password, user)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        profile_pic = validated_data.pop('custom_user_profile', None)

        user = CustomUser(**validated_data)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        if profile_pic:
            user.custom_user_profile = profile_pic

        user.save()

        # Optional: Send custom activation email
        request = self.context.get("request")
        from djoser.email import ActivationEmail
        ActivationEmail(request, context={"user": user}).send(to=[user.email])

        return user

    def update(self, instance, validated_data):
        user = self.context['request'].user
        provider = getattr(user, 'auth_provider', 'email')

        password = validated_data.pop('password', None)
        profile_pic = validated_data.pop('custom_user_profile', None)

        # Update normal fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Handle profile picture update only if provided in payload
        if profile_pic is not None:
            # Delete old pic if exists and new pic is None (means delete)
            if profile_pic == '' or profile_pic is None:
                if instance.custom_user_profile:
                    instance.custom_user_profile.delete(save=False)
                instance.custom_user_profile = None
            else:
                # Update profile pic if user signed up with email only
                if provider != 'email':
                    raise serializers.ValidationError(
                        "Profile picture can only be updated by users who signed up with email."
                    )
                instance.custom_user_profile = profile_pic

        # Update password if provided
        if password:
            instance.set_password(password)

        instance.save()
        return instance

    
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
    


class FacebookLoginSerializer(serializers.Serializer):
    access_token = serializers.CharField(write_only=True)


    def validate_access_token(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Access token is required')

        return value