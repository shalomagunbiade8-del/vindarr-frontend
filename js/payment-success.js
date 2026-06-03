const token =
localStorage.getItem("token");

const params =
new URLSearchParams(
  window.location.search
);

const reference =
params.get("reference");

const orderId =
localStorage.getItem(
  "pendingOrderId"
);

verifyPayment();

async function verifyPayment(){

  try{

    const res =
    await fetch(

      `${API_BASE_URL}/payments/market/verify?reference=${reference}&orderId=${orderId}`,

      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }

    );

    const data =
await res.json();

console.log(data);

    if(data.success){

      localStorage.removeItem(
        "pendingOrderId"
      );

      alert("Payment verified");

      window.location.href =
        "library.html";

    }else{

      alert(
  data.message ||
  "Verification failed"
);

    }

  }catch(err){

    console.error(err);

    alert(
  data.message ||
  "Verification failed"
);

  }

}