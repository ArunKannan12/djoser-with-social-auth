from django.urls import path,include
from .views import ResendActivationEmailView

urlpatterns = [
    path('auth/',include('djoser.urls')),
    path('auth/',include('djoser.urls.jwt')),
    path('auth/resend-activation/', ResendActivationEmailView.as_view(), name='resend-activation'),
   

]
