from django.db.models.deletion import CASCADE
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.db import models

# user needs to get followers and following queries
class User(AbstractUser):

    follower = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='user_profiles')
    
    def __str__(self):
        return f'{self.username}'


class Post(models.Model):

    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name='poster')
    text = models.CharField(max_length=255)
    likes = models.ManyToManyField(User, blank=True, symmetrical=False, related_name='user_likes')
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'{self.id} {self.poster} {self.text} {self.timestamp}'

