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

# javascipt calls load posts function from index
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
#
@csrf_exempt
def profile(request, username):
    
    following = ""
    print("request", request, username)
    # requires login
    logged_in_user = request.user
    logged_in_username = request.user.username
    user_to_follow = username
    
 
    # retrieve profile
    profile_id = User.objects.get(username=username).id
    p = User.objects.get(pk=profile_id)

   
    # this code allows for empty queryset wo exception, tests if following
    # requires login
    if request.method == "POST":
        user_id = User.objects.get(username=logged_in_user).id
        u = User.objects.get(pk=user_id)
    
        if User.objects.filter(username=logged_in_user).filter(follower=profile_id):
            u.follower.remove(p)
            u.save()
        else:
            u.follower.add(p)
            u.save()
            
    # requires login handled in template
    if User.objects.filter(username=logged_in_username).filter(follower=profile_id):
        following="Unfollow"
    else:
        following="Follow"

    # stats display for the user whos profile is open not just logged in
    
    # hide follow button for user self
    # requires login
    same_user = "false"
    if user_to_follow == logged_in_username:
        same_user = "true"

    #
    # stats retrieval for number of users and following
    #
    user = username
    # returns none
    number_following = User.objects.filter(username=user).values('follower__username')[0]['follower__username']
    # returns empty
    number_of_followers = User.objects.filter(follower__username=user).values('follower__username')
    #
    if number_following != None: 
        number_following = User.objects.filter(username=user).values("follower__username").count()
    else:
        number_following = 0

   
    # follower stats
    if number_of_followers:
        number_of_followers = User.objects.filter(follower__username=user).count()
    else:
        number_of_followers = 0
    
    return render(request, "network/profile.html", {
        "user_to_follow": user_to_follow,
        "same_user": same_user,
        "number_of_followers": number_of_followers,
        "number_following": number_following,
        "following_label": following
    })
#
# opens the following page
#
def following(request):
    
    
    
    return render(request, "network/following.html", {
        "page_label": "Following"
    })


# retrieve posts, the username link on the post opens their profile page
@csrf_exempt
def posts(request, username="no_user"):
    #the page number requested from the client ie 1 for group 1
    data = json.loads(request.body)
    page_number = data.get('page_number');

    #print("posts page number", data.get('page_number'), data.get('username'))
    if username != "multi":
        
        # get all posts ordered most recent first
        # https://developpaper.com/question/how-does-django-implement-inner-join-without-using-foreign-keys
        if username == "no_user":
            posts_reverse = Post.objects.order_by('timestamp').reverse().values('id','poster__username','text','timestamp')
        else:
            posts_reverse = Post.objects.filter(poster__username=username).order_by('timestamp').reverse().values('id','poster__username','text','timestamp')
    else:
    
        # get a list of followers
        followers = User.objects.filter(username=request.user).values("follower__username")
        #print("followers for reqest user",followers)
    
        following_posts_date_descending = []
        # get all the posts, sorted ascending, compare 
        posts_reverse = Post.objects.order_by('timestamp').reverse().values('id','poster__username','text','timestamp')
        #print("posts reverse", posts_reverse)
        for pr in posts_reverse:
            for f in followers:
                #print(f,pr)
                if pr['poster__username'] == f['follower__username']:
                    following_posts_date_descending.append(pr)
        posts_reverse = following_posts_date_descending

    
    
    # pagination setting
    posts_per_page = 10
    paginator = Paginator(posts_reverse, posts_per_page)
    # javascript needs to send the 'page'
    post_group = paginator.get_page(page_number)
    # pass the page range for navigation
    page_range = paginator.num_pages

    
    data = {"posts":list(post_group), "pages": page_range}

    # create list from posts
    return JsonResponse( data, safe=False )
#
# add post
#
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
#
# save post
#
@login_required
@csrf_exempt
def save_post(request, post_id):

    # get the fetch post data
    new_text = json.load(request)['new_text']
    Post.objects.filter(id=post_id).update(text=new_text)
    saved_post = Post.objects.filter(id=post_id).values()

    return JsonResponse( list(saved_post), safe=False )


# 
# follow currently adds to all users
#
@login_required
@csrf_exempt
def follow(request, username="none"):

    following = ""
    logged_in_user = request.user
    # profile
    profile_id = User.objects.get(username=username).id
    p = User.objects.get(pk=profile_id)
    # user
    user_id = User.objects.get(username=logged_in_user).id
    u = User.objects.get(pk=user_id)
    # test to see not following self/with the button not displaying too
    if request.method == "POST":
        # profile
        profile_id = User.objects.get(username=username).id
        p = User.objects.get(pk=profile_id)
        # user
        user_id = User.objects.get(username=logged_in_user).id
        u = User.objects.get(pk=user_id)
        # this code allows for empty queryset wo exception, tests if following
        if User.objects.filter(username=logged_in_user).filter(follower=profile_id):
            u.follower.remove(p)
            u.save()
            following=False
        else:
            u.follower.add(p)
            u.save()
            following=True
    else:
        # returns the current value of the follow
        if User.objects.filter(username=logged_in_user).filter(follower=profile_id):
            following=True
        else:
            following=False


    return JsonResponse({ "following": following })
#
# saves like
#
@login_required
@csrf_exempt
def like(request, post_id="none"):
    # related name on likes is liked_posts
    liked = ""
    # retrieve the post object to add like to  
    post = Post.objects.get(pk=post_id)
    # retrieve the current user to add to post
    u = User.objects.get(pk=request.user.id)
    # query if user has liked the post
    
    like_count = post.likes.all().count()
    like = post.likes.filter(username=request.user)
    # toggles the like to the opposite of what is retrieved
    if like:
        liked = "false"
    else:
        liked = "true"

    if request.method == 'PUT':
        if like:
            print("remove",like)
            post.likes.remove(u)
            post.save()
            
        else:
            print("add",like)
            post.likes.add(u)
            post.save()
            
    # toggle the flag
    # the heart will be filled if likes are greater than 0

    return JsonResponse({
        "liked": liked,
        "like_count": like_count
        })
#
# 
#
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
