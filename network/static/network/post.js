//
// setup defaults on page loading
//
document.addEventListener('DOMContentLoaded', function() {
  
  // when logged out the post form is not loaded in template
  if(document.querySelector('#post-button') != null) {
        document.querySelector('#post-button').disabled = true;
        document.querySelector('#post-button').onclick = () => {
        add_post();    
            
       }
    document.querySelector('#id_text').addEventListener("keyup", function() {
        check_blank();
    });
  };
});
//
// disable button until input to both fields
//
function check_blank() {
  if(document.querySelector('#id_text').value == ""){
    document.querySelector('#post-button').disabled = true;
  }
  else {
    document.querySelector('#post-button').disabled = false;
  }
}
//
// load profile
//
async function profile(username) {
  
  document.querySelector('.post-container').style.display = "none";
  try {
    document.querySelector("#posts").innerHTML = ""; 

    await fetch('/profile/'+username) 
    .then(response => response.json())
    .then( posts => {
             posts.forEach(append_post);
       }) 
}
catch(err) {
    console.log("profile not logged in null error");
}
}
//
// like
//
function like(post_id) {
  console.log("post");
  fetch('/like/'+post_id+'/', {
    method: 'PUT',
    body: JSON.stringify({
      post_id: post_id
    })
  })
  .then(response => response.json())
  .then(result => {
  //print result
  console.log("follow result", result);
  //
  check_like(post_id);
})
.catch(error => {
  console.log(error);
})

}
//
// check and set status of like button on first load
//
function check_like(post_id){
  fetch('/like/'+post_id+'/') 
  .then(response => response.json())
  .then(result => {
  //
  if (result['liked'] == 'true'){
    console.log("check like liked", result)

    document.getElementById(post_id).innerHTML = '&#x2665';
  }
  else {
    document.getElementById(post_id).innerHTML = '&#x2661';
    console.log("check like unliked")
  }
})
}
//
// follow user function
//
function follow(user_to_follow) {
  fetch('/follow/'+user_to_follow+'/', {
    method: 'POST',
    body: JSON.stringify({
       username: user_to_follow
      })
    })
    .then(response => response.json())
    .then(result => {
    //print result
    console.log("follow result", result);
    //
    if (result['following'] == true){
        console.log("unfollow");
        document.querySelector(".follow-button").innerHTML = "Unfollow";
    }
    else {
        console.log("follow");
        document.querySelector(".follow-button").innerHTML = "Follow";
    }

  })
  .catch(error => {
    console.log(error);
  })

}
//
// add post
//
async function add_post() {
  
   await fetch('/add_post', {
   method: 'POST',
   body: JSON.stringify({
     text: document.querySelector('#id_text').value
     })
   })
  .then(response => response.json())
  .then(result => {
    //print result
    //console.log("success",result);
    document.querySelector('#id_text').value = null; 
    load_posts("no_user");
    document.querySelector('#post-button').disabled = true;
  })
  .catch(error => {
    console.log(error);
  })
}
//
// load posts
//
async function load_posts(username, page_number) {
   
    console.log("page_number", page_number);
    // clear post list so to avoid appending 
        document.querySelector("#posts").innerHTML = ""; 
        await fetch('/posts/'+username+'/', {
          method: 'POST',
          body: JSON.stringify({
            username: username,
            page_number: page_number
            })
          })
        .then(response => response.json())
        .then( data => {
                 console.log("data", data['pages']);
                
                 page_numbers(data['pages']);
                 data['posts'].forEach(append_post);
                 // this adds onclick event to each edit link as per notes
                 document.querySelectorAll('.editlink').forEach(div => {
                 div.onclick = function() {
                      edit(this.dataset.post);
                 }; 
                });
                
           }) 
          
}
//
// display page navigation
//
function page_numbers(page_count) {
  console.log("page count", page_count)
  page_list = document.getElementById("pagination");
  page_list.innerHTML = "";
  // previous button
  const previous_button = document.createElement('li');
  previous_button.className = "page-link";
  previous_button.innerHTML = "Previous";
  page_list.appendChild(previous_button);
  //
  
  for(var i=1; i < page_count; i++) {

    const page_button = document.createElement('li');
    page_button.className = "page-link";
    page_button.id = "p_b_"+i;
    page_button.addEventListener("click", function() {
        load_posts("no_user", this.innerHTML);     
    })
    page_button.innerHTML = i;
    page_list.appendChild(page_button);


  };
  // next button
  const next_button = document.createElement('li');
  next_button.className = "page-link";
  next_button.innerHTML = "Next";
  page_list.appendChild(next_button);
  //
}

//
// save post
//
function save_post(post_id) {
  
  fetch('/save_post/'+post_id+'/', {
  method: 'POST',
  body: JSON.stringify({
    new_text: document.getElementById("txt_area_"+post_id).value
    })
  })
 .then(response => response.json())
 .then(result => {
   //print result
   console.log("post saved", result);
   document.getElementById("text_"+post_id).innerHTML = result[0]['text'];
   document.getElementById("edit_"+post_id).hidden = false;
 })
 .catch(error => {
   console.log(error);
 })
}
//
// create a textarea that the post can be edited and saved
//
function edit(post_id) {
   console.log("edit function",post_id);
   txt_area = document.createElement("textarea");
   txt_area.className = "txt_area";
   txt_area.id = "txt_area_"+post_id;
   txt_area.innerHTML = document.getElementById("text_"+post_id).innerHTML;

   document.getElementById("text_"+post_id).innerHTML = "";
   document.getElementById("text_"+post_id).append(txt_area);
   document.getElementById("edit_"+post_id).hidden = true;
   
   save_button = document.createElement("button");
   save_button.className = "btn btn-primary";
   save_button.innerHTML = "Save";
   save_button.addEventListener("click", function() {
       console.log(document.getElementById("txt_area_"+post_id).value)
       save_post(post_id);
   })
   document.getElementById("text_"+post_id).append(save_button);
   // onclick save

}

//
// create comment editor 
//
function create_comment_editor(post_id) {

   input_container = document.createElement("div");

   comment_txt_area = document.createElement("textarea");
   comment_txt_area.className = "comment_txt_area";
   comment_txt_area.id = "comment_txt_area_"+post_id;

   comment_save_button = document.createElement("button");
   comment_save_button.className = "btn btn-primary";
   comment_save_button.innerHTML = "Comment";
   
   comment_save_button.addEventListener("click", function() {
       save_comment(post_id);    
   });
   input_container.append(comment_txt_area);
   input_container.append(comment_save_button);
   
   return input_container;

}
//
// assemble post elements and append to div
//
function append_post(post) {

    //console.log("append post",post.id);
    logged_in_user = "";
    // test to display further functions if logged in
    try {
       logged_in_user = document.querySelector("#username").innerHTML;
    }
    catch {
       logged_in_user = "no_user";
    }
    // get the username
    const username = post.poster__username;

    // create user, post text, date
    const user_div = document.createElement("a");
    user_div.href = "/profile/"+username;
    user_div.className = "user";
    user_div.innerHTML = username;
    //
    // 
    // using methods from notes
    //
    const edit_link = document.createElement("div");
    edit_link.className = "alink underline blue editlink";
    if (logged_in_user == username) {
      edit_link.dataset.post = post.id;
      edit_link.id = "edit_"+post.id;
      edit_link.innerHTML = "Edit";
      //
      // edit_link.addEventListener("click", function() {
      //   edit(post.id);
      // });
    }
    //
    //
    //
    const text_div = document.createElement("div");
    text_div.className = "text";
    text_div.id = "text_"+post.id;
    text_div.innerHTML = post.text;
   
    const date_div = document.createElement("div");
    date_div.className = "date";
    date = new Date(post.timestamp);
    date_div.innerHTML = date.toLocaleString();
    //
    // todo: like button
    //
    const like_link = document.createElement("p");
    like_link.className = "alink red";
    like_link.id = post.id
    // solid heart &#x2665;
    // need to check and set on post load
    like_link.addEventListener("click", function() {
        like(post['id']);
    });
    if(logged_in_user != "no_user") {
      check_like(post['id']);
    }
    
    //
    // append body_div to placeholder on webpage
    //
    const line_div = document.createElement("div");
    line_div.className = "line-div clearboth";

    if(logged_in_user != 'no_user'){
      line_div.append(user_div, edit_link, text_div, date_div, like_link);
    }
    else {
      line_div.append(user_div, text_div, date_div);
    }
    
    posts = document.getElementById("posts");
    posts.append(line_div);

    
}
//
// added from notes
//

