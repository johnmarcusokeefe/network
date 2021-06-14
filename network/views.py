from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models.fields import related
from django.db.utils import Error
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator

from .models import User, Post
from .forms import PostForm

import json


@csrf_exempt
def index(request):
    post_form = ""
    
    # post form only displays when logged in
    if request.user.is_authenticated:
        post_form = PostForm()

    # posts will have to retrieve comments if exist
    return render(request, "network/index.html", {
        "post_form": post_form,
        "page_label": "All Posts"
    })


@login_required
@csrf_exempt
def add_post(request):
    # post to the timeline using fetch call from post.js
    data = json.loads(request.body)
    user = request.user
    text = data.get("text")
    post = Post(poster=user,text=text)
    post.save()
    return JsonResponse({"message": "Posted successfully."}, status=200)




@login_required
@csrf_exempt
def save_post(request, post_id):

    # get the fetch post data
    new_text = json.load(request)['new_text']
    Post.objects.filter(id=post_id).update(text=new_text)
    saved_post = Post.objects.filter(id=post_id).values()

    return JsonResponse( list(saved_post), safe=False )


# retrieve posts, the username link on the post opens their profile page
@csrf_exempt
def posts(request, username="no_user"):
    
    data = json.loads(request.body)
    
    print("posts page number", data.get('page_number'), data.get('username'))

    page_number = data.get('page_number');
    
    # posts are required to get comments also and display
    # get all posts ordered most recent first
    # https://developpaper.com/question/how-does-django-implement-inner-join-without-using-foreign-keys
    if username == "no_user":
        posts_reverse = Post.objects.order_by('timestamp').reverse().values('id','poster__username','text','timestamp')
    else:
        posts_reverse = Post.objects.filter(poster__username=username).order_by('timestamp').reverse().values('id','poster__username','text','timestamp')
    
    # pagination
    posts_per_page = 3
    paginator = Paginator(posts_reverse, posts_per_page)
    # javascript needs to send the 'page'
    post_group = paginator.get_page(page_number)
    # pass the page range for navigation
    page_range = paginator.page_range.stop
    print("paginator page range",paginator.page_range.stop)
    data = {"posts":list(post_group), "pages":page_range}
    # create list from posts
    return JsonResponse( data, safe=False )


@login_required
def following(request):
    # to be done
    followers = User.objects.filter(username=request.user).values("profiles").values("profiles__username")

    return render(request, "network/following.html", {
        "followers": followers
    })


@login_required
@csrf_exempt
def follow(request, username="none"):

    # test to see not following self/with the button not displaying too
    if request.method == "POST":
        # profile
        profile_id = User.objects.get(username=username).id
        p = User.objects.get(pk=profile_id)
        # user
        user_id = User.objects.get(username=request.user).id
        u = User.objects.get(pk=user_id)
        # this code allows for empty queryset wo exception
        if User.objects.filter(username=request.user).filter(profiles=profile_id):
            u.profiles.remove(p)
            u.save()
            following=False
        else:
            u.profiles.add(p)
            u.save()
            following=True
        
    return JsonResponse({
        "following": following
        })

#
# saves like
#
@login_required
@csrf_exempt
def like(request, post_id="none"):
    # Blog.objects.filter(entry__authors__name__isnull=True)
    # related name on likes is liked_posts
    liked = ""  
    u = User.objects.get(pk=request.user.id)
    post = Post.objects.get(pk=post_id)
    like_post = User.objects.filter(username=request.user).filter(likes=post_id)
    # set the flags 
    if like_post:
        liked = "true"
    else:
        liked = "false"

    if request.method == "PUT":
    #
        if like_post:
            print("remove",like_post)
            u.likes.remove(post)
            u.save()
            liked="false"
            print("user object",u)
        else:
            print("add",like_post)
            u.likes.add(post)
            u.save()
            liked = "true"
            print("user object",u)

    # flag set by checking every time
    return JsonResponse({
        "liked": liked
        })

#
# anyone can view the profile but have to be logged in to see the follow unfollow button
#
@csrf_exempt
def profile(request, username="none"):
    #request.user is receiving a User object and not just a string
    if request.user.is_authenticated:
        # logged in user used to test display follow button
        logged_in_user = User.objects.get(username=request.user).username
        # logged in request.user is a User object so get works
        user_id = User.objects.get(username=request.user).id

        # this sets the button flag only
        try:
            User.objects.filter(profiles__username=username).get(pk=user_id)
            follow_flag = "Unfollow"
        except ObjectDoesNotExist as e: 
            follow_flag = "Follow"

        print("username, loggedinuser", username, logged_in_user)
    else:
        logged_in_user = username
        follow_flag = ""

    # create list from posts
    return render(request, "network/profile.html", {
        "profile_user": username,
        "logged_in_user": logged_in_user,
        "following": follow_flag
    })


def login_view(request):

    if request.method == "POST":
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


@login_required
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
