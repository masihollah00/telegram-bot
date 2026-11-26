
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="storeconfiguration",
            name="seller_phone",
            field=models.CharField(
                default="09194516434",
                max_length=20,
                verbose_name="شماره تماس فروشنده",
            ),
        ),
        migrations.AddField(
            model_name="storeconfiguration",
            name="seller_telegram",
            field=models.CharField(
                default="@Amir_jalali110",
                max_length=100,
                verbose_name="آیدی تلگرام فروشنده",
            ),
        ),
    ]
