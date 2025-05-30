# Generated by Django 5.2 on 2025-05-21 17:00

import accounts.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_customuser_block_count_password_reset_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='auth_provider',
            field=models.CharField(default='Email', max_length=50),
        ),
        migrations.AddField(
            model_name='customuser',
            name='custom_user_profile',
            field=models.ImageField(blank=True, null=True, upload_to=accounts.models.user_profile_upload_path),
        ),
        migrations.AddField(
            model_name='customuser',
            name='social_auth_pro_pic',
            field=models.URLField(blank=True, null=True),
        ),
    ]
