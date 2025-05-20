from djoser.serializers import UserCreateSerializer
from .models import CustomUser
from rest_framework import serializers
class UserSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'password']
        extra_kwargs = {'password': {'write_only': True}}


class ResendActivationEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()