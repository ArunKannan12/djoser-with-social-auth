from django.urls import path,include
from .views import (ResendActivationEmailView,
                    CustomPasswordResetConfirmView,
                    CustomPasswordResetView,
                    GoogleAuthView,
                    facebookLoginView,
                    CustomTokenRefreshView                    
                    )
from rest_framework_simplejwt.views import TokenBlacklistView


urlpatterns = [
    path('auth/jwt/refresh/',CustomTokenRefreshView.as_view(),name='custom_token_refresh'),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),

    path('auth/password_reset/', CustomPasswordResetView.as_view(), name='password_reset'),
    path('auth/password_reset_confirm/', CustomPasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/jwt/logout/', TokenBlacklistView.as_view(), name='jwt_logout'),

    path('auth/resend-activation/', ResendActivationEmailView.as_view(), name='resend_activation'),
    path('auth/social/google/',GoogleAuthView.as_view(),name='google-login'),
    path('auth/social/facebook/',facebookLoginView.as_view(),name='facebook-login'),

    
]

