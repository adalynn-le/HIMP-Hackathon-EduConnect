const SUPABASE_URL = "https://yzbqqduvdvhsownpubyt.supabase.co"
const SUPABASE_ANON_KEY = 'sb_publishable_-JiqDfRgnVn_YgEjUjprqQ_s4XG375D';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const currentPath = window.location.pathname;

  if (currentPath.includes("index.html")) {
    if (!session) {
      window.location.href = "auth.html";
    } else {
      document.getElementById("user-email").innerText = `Logged in as: ${session.user.email}`;
    }
  }
});
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const messageEl = document.getElementById("auth-message");
    const username = document.getElementById("signup-username").value

    const { data, error } = await supabase.auth.signUp({ email, password });


    if (error) {
      messageEl.innerText = error.message;
      console.log(error)
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      messageEl.style.color = "green";
      messageEl.innerText = "Check your inbox for a verification email link!";
      const { error } = await supabase
    .from('profiles')
    .upsert({
      id: session.user.id,
      username: username,
      updated_at: new Date()
    });

  if (error) {
    console.error("Error updating profile:", error.message);
  }
    }
  });
}
const signinForm = document.getElementById("signin-form");
if (signinForm) {
  signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signin-email").value;
    const password = document.getElementById("signin-password").value;
    const messageEl = document.getElementById("auth-message");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      messageEl.style.color = "red";
      messageEl.innerText = error.message;
    } else {
      window.location.href = "templates/index.html";
    }
  });
}

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "auth.html";
  });
}
async function searchEC() {

    const ec = document.getElementById("ec").value;
    console.log(ec)
    try {
        console.log("About to fetch...");
        const response = await fetch("/search", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        ec: ec
    })
});

console.log("Status:", response.status);
console.log("OK:", response.ok);

const text = await response.text();

console.log("Response body:");
console.log(text);

        console.log(text);

        document.getElementById("output").textContent = text;

    } catch(error) {

        document.getElementById("output").textContent =
            "Error: " + error;

    }
}

anychart.onDocumentReady(function () {
        anychart.data.loadJsonFile(
          function (data) {
            let dataSet = anychart.data.set(data);
            let map = anychart.map();
            map.geoData("anychart.maps.world");
            let series = map.choropleth(dataSet);
            series
              .colorScale(
                anychart.scales.linearColor("#f2f2f2", "#42a5f5", "#1976d2", "#233580")
              );
            map.title("State Visits Made by Queen Elizabeth II");
            map.container("OpIndexNormEd");
            map.draw();
          }
        );
      });
const loginBtn = document.getElementById("loginButton");
if (loginBtn) {
  loginBtn.addEventListener("click", function(){
    const modal = document.getElementById("loginModal");
    if (modal) modal.style.display = "block";
     document.getElementById("overlay").style.display = "block"
  });
 
}
document.getElementById("overlay").addEventListener("click", function() {
  document.getElementById("overlay").style.display = "none"
  document.getElementById("loginModal").style.display = "none"
})

const searchBtn = document.getElementById("searchEC");
if (searchBtn) {
  searchBtn.addEventListener("click", function() {
    searchEC();
  });
}

async function checkUserSession() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    console.log("Logged in user email:", session.user.email);
    
    const userEmailEl = document.getElementById("user-email");
    if (userEmailEl) {
      userEmailEl.innerText = `Logged in as: ${session.user.email}`;
    }
    getUserProfile()
  } else {
    console.log("No active session found.");
    
    window.location.href = "auth.html";
  }
}

checkUserSession();
async function getUserProfile() {
  console.log("get")
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error("Error loading profile:", error.message);
  } else {
    console.log("Username is:", data.username);
    document.getElementById("loginDisplay").innerHTML = data.username
  }
}
const postForm = document.getElementById("create-post-form")
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("You must be logged in to create a post!");
    return;
  }

  const title = document.getElementById("post-title").value;
  const description = document.getElementById("post-desc").value;
  const country = document.getElementById("post-country").value || "Global";
  const post_type = document.getElementById("post-type").value;
  const contact_info = document.getElementById("post-contact").value;
  const { error } = await supabase.from("posts").insert([
    {
      user_id: session.user.id,
      title,
      description,
      country,
      post_type,
      contact_info: contact_info || null
    }
  ]);

  if (error) {
    console.error("Error creating post:", error.message);
  } else {
    postForm.reset();
    fetchPosts();
  }
});
let bulletinPosts = [];
let currentIndex = 0;
async function fetchPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles ( username )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error.message);
    return;
  }

  bulletinPosts = data;
  if (bulletinPosts.length > 0) {
    currentIndex = 0;
    renderCurrentCard();
  } else {
    document.getElementById("carousel-card").innerHTML = "<p>No posts yet!</p>";
  }
}
function renderCurrentCard() {
  const card = document.getElementById("carousel-card");
  const post = bulletinPosts[currentIndex];
  let tagClass = "tag-shared";
  if (post.post_type === "Request") tagClass = "tag-request";
  if (post.post_type === "Offer") tagClass = "tag-offer";
  const authorName = post.profiles?.username || "Anonymous";
  const contactHTML = post.contact_info 
    ? `<div style="margin-top: 10px; font-size: 13px; color: #2c3e50;">
         <strong>💬 Contact:</strong> ${escapeHtml(post.contact_info)}
       </div>`
    : '';

  card.innerHTML = `
    <div>
      <span class="tag ${tagClass}">${post.post_type}</span>
      <span style="font-size: 12px; color: #666;">📍 ${post.country}</span>
    </div>
    <h4 style="margin: 10px 0 2px 0;">${escapeHtml(post.title)}</h4>
    <div style="font-size: 11px; color: #777; margin-bottom: 8px;">Posted by: <strong>@${escapeHtml(authorName)}</strong></div>
    <p style="font-size: 14px; color: #333; margin: 0;">${escapeHtml(post.description)}</p>
    ${contactHTML}
  `;
}
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}
fetchPosts()
escape
document.getElementById("nextBtn")?.addEventListener("click", () => {
  if (bulletinPosts.length === 0) return;
  currentIndex = (currentIndex + 1) % bulletinPosts.length;
  renderCurrentCard();
});

document.getElementById("prevBtn")?.addEventListener("click", () => {
  if (bulletinPosts.length === 0) return;
  currentIndex = (currentIndex - 1 + bulletinPosts.length) % bulletinPosts.length;
  renderCurrentCard();
});

// Auto-rotate every 5 seconds
setInterval(() => {
  if (bulletinPosts.length > 1) {
    currentIndex = (currentIndex + 1) % bulletinPosts.length;
    renderCurrentCard();
  }
}, 5000);