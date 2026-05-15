from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'user_type', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Info', {
            'fields': (
                'user_type',
                'phone_number',
                'date_of_birth',
                'bio',
                'total_tests_taken',
                'total_score',
            )
        }),
    )

admin.site.register(CustomUser, CustomUserAdmin)