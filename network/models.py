from datetime import datetime
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    
    profiles = models.ManyToManyField('self', blank=True, symmetrical=False)
    likes = models.ManyToManyField('Post', blank=True, symmetrical=False, related_name="liked_posts")

    def __str__(self):
        return f'{self.username}'


class Post(models.Model):

    poster = models.ForeignKey('User', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    timestamp = models.DateTimeField(default=datetime.now)

    def __str__(self):
        return f'{self.id} {self.poster} {self.text} {self.timestamp}'

