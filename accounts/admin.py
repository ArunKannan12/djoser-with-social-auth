from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomUser

class CustomUserAdmin(BaseUserAdmin):
    model = CustomUser
    list_display = (
        'email', 'first_name', 'last_name', 'is_staff', 'is_active', 
        'is_verified', 'blocked_until', 'block_count', 'is_permanently_banned'
    )
    list_filter = (
        'is_staff', 'is_active', 'is_verified', 'is_permanently_banned'
    )
    readonly_fields = ('last_login', 'created_at', 'updated_at', 'blocked_until', 'block_count', 'is_permanently_banned')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': (
            'is_active', 'is_verified', 'is_staff', 'is_superuser', 
            'groups', 'user_permissions', 'is_permanently_banned'
        )}),
        ('Blocking Info', {'fields': ('blocked_until', 'block_count')}),
        ('Important Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'first_name', 'last_name', 'password1', 'password2',
                'is_active', 'is_verified', 'is_staff', 'is_superuser'
            )
        }),
    )

    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

admin.site.register(CustomUser, CustomUserAdmin)
