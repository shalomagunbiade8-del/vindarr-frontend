const token = localStorage.getItem("token");

if(!token){
  window.location.href = "login.html";
}

let creatorPosts = [];

loadDashboard();

async function loadDashboard(){

  try{

    // LOAD USER POSTS
    const res = await fetch(`${API_BASE_URL}/videos/me`,{
      headers:{
        Authorization:`Bearer ${token}`
      }
    });

    const posts = await res.json();

    creatorPosts = posts || [];

    renderDashboardStats();
    renderDashboardPosts();

  }catch(err){

    console.error(err);

  }

}

function renderDashboardStats(){

  // TOTAL SALES
  let totalSales = 0;

  creatorPosts.forEach(post => {

    const price = Number(post.price || 0);

    const sales = Number(post.salesCount || 0);

    totalSales += (price * sales);

  });

  document.getElementById("totalSales").innerText =
    `₦${totalSales.toLocaleString()}`;

  // TOTAL EBOOKS
  const ebooks =
    creatorPosts.filter(p => p.type === "ebook");

  document.getElementById("totalBooks").innerText =
    ebooks.length;

  // TOTAL PRODUCTS
  const products =
    creatorPosts.filter(p => p.type === "fashion");

  document.getElementById("totalProducts").innerText =
    products.length;

}

function renderDashboardPosts(){

  const container =
    document.getElementById("dashboardPosts");

  if(!creatorPosts.length){

    container.innerHTML = `
      <div class="empty-state">
        <h3>No content yet</h3>
        <p>Start uploading videos, ebooks or products.</p>

        <a href="publish.html" class="publish-link">
          Upload Content
        </a>
      </div>
    `;

    return;
  }

  container.innerHTML = creatorPosts.map(post => `

    <div class="dashboard-post-card">

      <div class="dashboard-media">

        ${
          post.type === "video"
          ?
          `
          <video
  src="${post.videoUrl || post.file || ''}"
          ></video>
          `
          :
          `
          <img
  src="${post.coverUrl || post.thumbnail || ''}"
>
          `
        }

      </div>

      <div class="dashboard-info">

        <h3>${post.title || "Untitled"}</h3>

        <p class="dash-type">
          ${post.type || "content"}
        </p>

        <div class="dash-stats">

          <span>
            ❤️ ${post.understandCount || 0}
          </span>

          <span>
            💬 ${post.comments?.length || 0}
          </span>

          <span>
            👁️ ${post.views || 0}
          </span>

        </div>

        ${
          post.price
          ?
          `
          <div class="dash-price">
            ₦${Number(post.price).toLocaleString()}
          </div>
          `
          :
          ``
        }

        <div class="dashboard-actions">

          <button
            class="edit-btn"
            onclick="editPost('${post.id}')"
          >
            Edit
          </button>

          <button
            class="delete-btn"
            onclick="deletePost('${post.id}')"
          >
            Delete
          </button>

          <button
  class="share-btn"
  onclick="sharePost('${post.id}')"
>
  Share
</button>

        </div>

      </div>

    </div>

  `).join("");

}

function editPost(id){

  window.location.href =
    `publish.html?edit=${id}`;

}

async function deletePost(id){

  const confirmDelete =
    confirm("Delete this content?");

  if(!confirmDelete) return;

  try{

    const res = await fetch(`${API_BASE_URL}/videos/${id}`,{
      method:"DELETE",
      headers:{
        Authorization:`Bearer ${token}`
      }
    });

    if(res.ok){

      creatorPosts =
        creatorPosts.filter(p => p.id != id);

      renderDashboardStats();
      renderDashboardPosts();

      alert("Deleted");

    }else{

      alert("Delete failed");

    }

  }catch(err){

    console.error(err);

  }

}

function sharePost(id){

  const url =
    `${window.location.origin}/product.html?id=${id}`;

  if(navigator.share){
 
    navigator.share({
      title:"Vindarr",
      text:"Check this out on Vindarr",
      url
    });

  }else{

    navigator.clipboard.writeText(url);

    alert("Link copied");

  }

}