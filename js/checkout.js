const token =
localStorage.getItem("token");

const params =
new URLSearchParams(window.location.search);

const productId =
params.get("id");

let currentProduct = null;

loadCheckout();

async function loadCheckout(){

  try{

    const res =
    await fetch(
      `${API_BASE_URL}/videos/${productId}`
    );

    const product =
    await res.json();

    currentProduct = product;

    renderCheckout(product);

  }catch(err){

    console.error(err);

  }

}

function renderCheckout(product){

  const container =
  document.getElementById("checkoutContainer");

  const media =
    product.coverUrl ||
    product.file ||
    product.videoUrl ||
    '';

  container.innerHTML = `

    <div class="checkout-card">

      <img
        src="${media}"
        class="checkout-image"
      >

      <h2>
        ${product.title}
      </h2>

      <p class="checkout-price">
        ₦${Number(product.price || 0)
          .toLocaleString()}
      </p>

      <button
        class="checkout-btn"
        onclick="startPayment()"
      >
        Pay Now
      </button>

    </div>

  `;

}

async function startPayment(){

  try{

    const res =
    await fetch(
      `${API_BASE_URL}/payments/market/initialize`,
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },

        body:JSON.stringify({
          productId:Number(productId)
        })
      }
    );

    const data =
    await res.json();

    if(data.checkoutUrl){

      localStorage.setItem(
        "pendingOrderId",
        data.orderId
      );

      window.location.href =
      data.checkoutUrl;

    }else{

      alert("Payment failed");

    }

  }catch(err){

    console.error(err);

    alert("Payment failed");

  }

}