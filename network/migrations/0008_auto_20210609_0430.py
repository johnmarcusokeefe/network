# Generated by Django 3.1.1 on 2021-06-09 04:30

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0007_auto_20210606_0233'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='comments',
        ),
        migrations.DeleteModel(
            name='Comment',
        ),
    ]