from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("questions", "0004_alter_question_subject"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="use_image_display",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="question",
            name="question_image",
            field=models.ImageField(blank=True, null=True, upload_to="questions/%Y/%m/"),
        ),
        migrations.AddField(
            model_name="question",
            name="option_a_image",
            field=models.ImageField(blank=True, null=True, upload_to="questions/%Y/%m/"),
        ),
        migrations.AddField(
            model_name="question",
            name="option_b_image",
            field=models.ImageField(blank=True, null=True, upload_to="questions/%Y/%m/"),
        ),
        migrations.AddField(
            model_name="question",
            name="option_c_image",
            field=models.ImageField(blank=True, null=True, upload_to="questions/%Y/%m/"),
        ),
        migrations.AddField(
            model_name="question",
            name="option_d_image",
            field=models.ImageField(blank=True, null=True, upload_to="questions/%Y/%m/"),
        ),
    ]
