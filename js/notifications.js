async function loadNotifications(){

  const token =
  localStorage.getItem("token");

  const res =
  await fetch(

    `${API_BASE_URL}/notifications/me`,

    {
      headers:{
        Authorization:
        `Bearer ${token}`
      }
    }

  );

  const notifications =
  await res.json();

  renderNotifications(
    notifications
  );

}

function renderNotifications(
notifications
){

const list =
document.getElementById(
"notificationsList"
);

list.innerHTML =
notifications.map(n => `

<div
class="notification-item
${n.isRead ? '' : 'unread'}"

onclick="
markNotificationRead(
${n.id}
)
"
>

<div class="notification-title">

${getNotificationIcon(n.type)}
${n.title}

</div>

<div class="notification-message">

${n.message}

</div>

<div class="notification-date">

${new Date(
n.createdAt
).toLocaleString()}

</div>

</div>

`).join('');

}

function getNotificationIcon(type){

switch(type){

case 'sale':
return '💰';

case 'milestone':
return '🎉';

case 'withdrawal':
return '🏦';

default:
return '🔔';

}

}

async function markNotificationRead(id){

const token =
localStorage.getItem("token");

await fetch(

`${API_BASE_URL}/notifications/${id}/read`,

{
method:"PATCH",

headers:{
Authorization:`Bearer ${token}`
}
}

);

}