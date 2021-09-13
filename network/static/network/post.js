var page_number = 1;
//
// setup defaults on page loading
//
document.addEventListener('DOMContentLoaded', function () {

  // when logged out the post form is not loaded in template
  if (document.querySelector('#post-button') != null) {
    document.querySelector('#post-button').disabled = true;
    document.querySelector('#post-button').onclick = () => {
      add_post();

    }
    document.querySelector('#id_text').addEventListener("keyup", function () {
      check_blank();
    });
  };
});
//
// disable button until input to both fields
//
function check_blank() {
  if (document.querySelector('#id_text').value == "") {
    document.querySelector('#post-button').disabled = true;
  }
  else {
    document.querySelector('#post-button').disabled = false;
  }
}
//
// like
//
function like(post_id) {
  console.log("post");
  fetch('/like/' + post_id + '/', {
    method: 'PUT',
    body: JSON.stringify({
      post_id: post_id
    })
  })
    .then(response => response.json())
    .then(result => {
      //print result
      console.log("like result post",result, post_id);
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
function check_like(post_id) {
  fetch('/like/' + post_id + '/')
    .then(response => response.json())
    .then(result => {
      //
      if (result['like_count'] > 0) {
        console.log("check like liked", result)
        document.getElementById(post_id).innerHTML = '&#x2665';
      }
      else {
        document.getElementById(post_id).innerHTML = '&#x2661';
        console.log("check like unliked", result)
      }
      console.log("like_count", result['like_count']);
      document.getElementById("like-count-"+post_id).innerHTML = result['like_count'];
    })
}
//
// add post
//
function add_post() {

  fetch('/add_post', {
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
      posts("no_user");
      document.querySelector('#post-button').disabled = true;
    })
    .catch(error => {
      console.log(error);
    })
}
//
// load posts, no_user will load all posts
//
function posts(username, page_number) {
  console.log("page number", page_number);
  // post form only displayed on page 1 causes error when logged out
  if(username == "no_user") {
    if(page_number > 1){
      if(document.querySelector('#post-container')  != null) {
          document.querySelector('#post-container').style.display = "none";
      };
    }
    else {
      if(document.querySelector('#post-container') != null){
        document.querySelector('#post-container').style.display = "block";
      };
    }
  }
  
  // clear post list so to avoid appending

  //document.querySelector("#posts").innerHTML = message;
  //
  if(username == "multi") {
    document.querySelector('#page-title').innerHTML = "Following";
    if(document.querySelector('#post-container') != null) {
      document.querySelector('#post-container').style.display = "none";
    }
   // document.querySelector('#follow-button-container').style.display = "none";
  }
//
  fetch('/posts/' + username + '/', {
    method: 'POST',
    mode: 'same-origin',
    body: JSON.stringify({
      username: username,
      page_number: page_number
    })
  })
    .then(response => response.json())
    .then(data => {
      // passes the number of pages to allow navigation to reflect the content
      
      console.log("posts", data['posts'].length );
      // create empty
      //
      if (data['posts'].length > 0) {
        document.querySelector("#posts").innerHTML = "";
        data['posts'].forEach(append_post);
      }
      //
      // update page numbers on navigation
      //
      console.log("pages length", data['pages']);
      if(data['pages'] > 1) {
          page_numbers(username, data['pages']);
      }
      
      // this adds onclick event to each edit link as per notes
      document.querySelectorAll('.editlink').forEach(div => {
        div.onclick = function () {
          edit(this.dataset.post);
        };
      });
    })
}

//
// load profile
//
function profile(username, page_number) {
  console.log("profile", username, page_number);
  document.querySelector('#post-container').style.display = "none";

  document.querySelector("#posts").innerHTML = "";
  document.querySelector("#page-title").innerHTML = username;
  // need to add follow button

  if(username != document.getElementById("username").innerHTML ){

    follow_button = document.createElement('button');
    follow_button.className = "btn btn-primary follow-button";
    follow_button.innerHTML = "Follow";
    follow_button.addEventListener("click", function() {
          follow(username);
    })
    
    const follow_button_container = document.querySelector("#follow-button");
    follow_button_container.append(follow_button);
  }
  else {
    posts(username, page_number);
    document.querySelector("#follow-button").style.display = "none";
  }
}
//
// display page navigation
//
function page_numbers(username, page_count) {

  // need to have a seperate container for pagination
  
  navigation = document.getElementById("nav_footer");
  
  
  const nav_list = document.createElement('ul');
  nav_list.className = "pagination";
  nav_list.id = "pagination";

  // previous button
  const previous_button_li = document.createElement('li');
  previous_button_li.className = "page-item";
  const previous_button_a = document.createElement('a');
  previous_button_a.className = "page-link";
  previous_button_a.href="#";
  previous_button_a.innerHTML = "Previous";
  previous_button_a.addEventListener("click", function () {
    if(page_number > 1){
        page_number = page_number - 1;
    } else {
        page_number = page_count;
    }
    posts(username, page_number);
  });
  previous_button_li.append(previous_button_a);
  nav_list.append(previous_button_li);
  //
  // number buttons
  //
  for (var i = 1; i <= page_count; i++) {
    const page_button_li = document.createElement('li');
    if(page_number == i) {
      page_button_li.className = "page-item active";
    }
    else {
      page_button_li.className = "page-item";
    }
    const page_button_a = document.createElement('a');
    page_button_a.className = "page-link";
    page_button_a.href="#";
    page_button_a.id = "p_b_" + i;
    page_button_a.addEventListener("click", function () {
      page_number = this.innerHTML;
      posts(username, page_number);
    })
    page_button_a.innerHTML = i;
    //
    page_button_li.appendChild(page_button_a);
    nav_list.appendChild(page_button_li);
  }
  // next button
  const next_button_li = document.createElement('li');
  next_button_li.className = "page-item";
  const next_button_a = document.createElement('a');
  next_button_a.className = "page-link";
  next_button_a.href="#";
  next_button_a.innerHTML = "Next";
  next_button_a.addEventListener("click", function () {
    if(page_number < page_count){
        page_number = parseInt(page_number) + 1;
    } else {
      page_number = 1;
    }
  posts(username, page_number);
  });
  next_button_li.append(next_button_a);
  nav_list.append(next_button_li);
  //
  navigation.innerHTML = "";
  navigation.append(nav_list);
}
//
// save post
//
function save_post(post_id) {

  fetch('/save_post/' + post_id + '/', {
    method: 'POST',
    body: JSON.stringify({
      new_text: document.getElementById("txt_area_" + post_id).value
    })
  })
    .then(response => response.json())
    .then(result => {
      //print result
      console.log("post saved", result);
      document.getElementById("text_" + post_id).innerHTML = result[0]['text'];
      document.getElementById("edit_" + post_id).hidden = false;
    })
    .catch(error => {
      console.log(error);
    })
}
//
// create a textarea that the post can be edited and saved
//
function edit(post_id) {
  console.log("edit function", post_id);
  txt_area = document.createElement("textarea");
  txt_area.className = "txt_area";
  txt_area.id = "txt_area_" + post_id;
  txt_area.innerHTML = document.getElementById("text_" + post_id).innerHTML;

  document.getElementById("text_" + post_id).innerHTML = "";
  document.getElementById("text_" + post_id).append(txt_area);
  document.getElementById("edit_" + post_id).hidden = true;

  save_button = document.createElement("button");
  save_button.className = "btn btn-primary";
  save_button.innerHTML = "Save";
  save_button.addEventListener("click", function () {
    console.log(document.getElementById("txt_area_" + post_id).value)
    save_post(post_id);
  })
  document.getElementById("text_" + post_id).append(save_button);

}
//
// assemble post elements and append to div
//
async function append_post(post) {
  
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
  const user_link = document.createElement("a");
  user_link.className = "user onclick-link";
  user_link.innerHTML = username;
  user_link.href = "/profile/"+username
  // 
  // using methods from notes
  //
  console.log("edit post id", post.id)
  const edit_link = document.createElement("div");
  edit_link.className = "underline blue editlink mt-2";
  if (logged_in_user == username) {
    edit_link.dataset.post = post.id;
    edit_link.id = "edit_" + post.id;
    edit_link.innerHTML = "Edit";
  }
  //
  //
  //
  const text_div = document.createElement("div");
  text_div.className = "text border-bottom pb-5 mt-3 mb-1";
  text_div.id = "text_" + post.id;
  // innetext displays text formatting
  //console.log("search line breaks", post.text.search("\r"));
  text_div.innerHTML = post.text;

  const date_div = document.createElement("div");
  date_div.className = "date float-right pb-2";
  date = new Date(post.timestamp);
  
  date_div.innerHTML = date.toDateString() + " " +date.toLocaleTimeString();

  //
  // todo: like button
  //
  const likes = document.createElement("div");
  likes.className = "likes float-left";

  const like_link = document.createElement("div");
  like_link.className = "alink red";
  like_link.id = post.id
  // solid heart &#x2665;
  // need to check and set on post load
  console.log(post['id'])
  like_link.addEventListener("click", function () {
    like(post['id']);
  });
  // add number of likes
  const like_total = document.createElement("div");
  like_total.className = "like-count";
  like_total.id = "like-count-"+post.id;
  like_total.innerHTML = 0;
  
  likes.append(like_link, like_total);

  if (logged_in_user != "no_user") {
    check_like(post['id']);
  }
  //
  // append body_div to placeholder on webpage
  //
  const line_div = document.createElement("div");
  line_div.className = "line-div pb-1";

  const line_div_clear = document.createElement("div");
  line_div_clear.className = "clearfix";


  if (logged_in_user != 'no_user') {
    line_div.append(user_link, edit_link, text_div, likes, date_div, line_div_clear);
  }
  else {
    line_div.append(user_link, text_div, date_div,  line_div_clear);
  }
  
  let line = document.querySelector('#posts');
  console.log("line",line);
  line.append(line_div);
  
}
