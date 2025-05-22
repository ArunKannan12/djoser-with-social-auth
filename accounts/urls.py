from django.urls import path,include
from .views import (ResendActivationEmailView,
                    CustomPasswordResetConfirmView,
                    CustomPasswordResetView,
                    GoogleAuthView,
                    facebookLoginView
                    
                    )

urlpatterns = [
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),

    path('auth/password_reset/', CustomPasswordResetView.as_view(), name='password_reset'),
    path('auth/password_reset_confirm/', CustomPasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    path('auth/resend-activation/', ResendActivationEmailView.as_view(), name='resend-activation'),
    path('auth/social/google/',GoogleAuthView.as_view(),name='google-login'),
    path('auth/social/facebook/',facebookLoginView.as_view(),name='facebook-login'),
    
]

