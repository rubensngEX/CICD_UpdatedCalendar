import { customFetch } from "../components/customFetch.js";
const notyf = new Notyf();

document.addEventListener("DOMContentLoaded", async () => {
  await getNotifications();
  // createFilterButtons();
});

function filterNotifications(type) {
  const notifications = document.querySelectorAll(".notification-item");
  notifications.forEach(noti => {
    noti.style.display = (type === "ALL" || noti.getAttribute("data-type") === type) ? "flex" : "none";
  });
}

async function getNotifications() {
  const notifications = await customFetch("/noti/developer");
  const notificationList = document.getElementById("notification-list");
  while (notificationList.firstChild) {
    notificationList.removeChild(notificationList.firstChild);
  }

  if (notifications.length === 0) {
    const noNotifications = document.createElement("li");
    noNotifications.textContent = "No new notifications.";
    notificationList.appendChild(noNotifications);
  } else {
    // Count the number of notifications for each type
    const typeCounts = {
      ALL: notifications.length,
      ANNOUNCEMENT: 0,
      REQUEST: 0,
      UPDATE: 0
    };

    notifications.forEach(recipients => {
      const type = recipients.notification.type;
      if (typeCounts.hasOwnProperty(type)) {
        typeCounts[type]++;
      }
    });

    // Create filter buttons only if there are notifications for that type
    const filterContainer = document.createElement("div");
    filterContainer.style.cssText = "display: flex; justify-content: right;";

    ["ANNOUNCEMENT", "REQUEST", "UPDATE","ALL"].forEach(type => {
      if (typeCounts[type] > 0) {
        const button = document.createElement("button");
        button.textContent = `${type}`;
        if(type === "ALL") {
          button.textContent += `(${typeCounts[type]})`;
        } 
        button.classList.add("filter-btn");
        button.addEventListener("click", () => filterNotifications(type));
        filterContainer.appendChild(button);
      }
    });

    // Sort notifications by date
    notifications.sort((a, b) => new Date(b.notification.createdAt) - new Date(a.notification.createdAt));
    
    // Append filter buttons to the notification list
    notificationList.appendChild(filterContainer);

    // Add each notification to the list
    notifications.forEach((recipients) => {
      const noti = recipients.notification;
      addNotification(noti.message, noti.projectId, noti.taskId, recipients.isRead, recipients.id, noti.type, noti.requesterId, noti.createdAt);
    });
  }
}

function addNotification(notiMsg, projectId, taskId, isRead, id, type, reqId, createdAt) {
  const newNotification = document.createElement("li");
  newNotification.classList.add("notification-item");
  newNotification.setAttribute("data-type", type);
  
  if (!isRead) {
    document.getElementById("bell-red-dot").classList.remove("hidden");
    newNotification.classList.add("bold");
  }

  const container = document.createElement("div");
  container.classList.add("noti-content");
  container.style.cssText = "display: flex; align-items: center;";

  const img = document.createElement("img");
  img.src = type === "ANNOUNCEMENT" ? "../images/announcement.png" :
            type === "REQUEST" ? "../images/request.png" :
            type === "TASK" ? "../images/newTask.png" :
            "../images/dev.png";
  img.classList.add("noti-icon");
  img.style.cssText = "width: 30px; height: 30px; border-radius: 50%; margin: 0 10px; background-color: black;";

  const textContainer = document.createElement("div");
  textContainer.classList.add("noti-text");

  if (type) {
    const titleElement = document.createElement("strong");
    titleElement.textContent = type + ": " + "\n";
    titleElement.classList.add("noti-title");
    textContainer.appendChild(titleElement);
  }

  const text = document.createElement("span");
  text.textContent = notiMsg;
  
  const timeElement = document.createElement("small");
  timeElement.textContent = " " + timeAgo(createdAt);
  timeElement.style.cssText = "margin-left: 10px; color: gray;";
  
  textContainer.append(text, timeElement);
  container.append(img, textContainer);

  if (type === "REQUEST" && !isRead) {
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");
    buttonContainer.style.cssText = "display: flex; align-items: center; padding-right: 10px;";

    const acceptButton = document.createElement("button");
    acceptButton.textContent = "✔";
    acceptButton.classList.add("accept-btn");
    acceptButton.addEventListener("click", async () => {
      await acceptOrReject(projectId, reqId, "accept");
      isReadTrue(id);
      await getNotifications();
    });

    const rejectButton = document.createElement("button");
    rejectButton.textContent = "✖";
    rejectButton.classList.add("reject-btn");
    rejectButton.addEventListener("click", async () => {
      await acceptOrReject(projectId, reqId, "reject");
      isReadTrue(id);
      await getNotifications();
    });

    buttonContainer.append(acceptButton, rejectButton);
    container.appendChild(buttonContainer);
  }

  document.getElementById("notification-list").appendChild(newNotification);
  newNotification.appendChild(container);
  newNotification.classList.add("clickable-notification");
  newNotification.setAttribute("RecipientId", id);
  if (type === "UPDATE") {
    newNotification.addEventListener("click", () => {
      window.location.href = taskId ? `/mytasks?taskId=${taskId}` : `/assignedProjects?projectId=${projectId}`;
      isReadTrue(id);
    });
  } else if(!isRead){
    newNotification.addEventListener("click", async () => {
      isReadTrue(id);
      await getNotifications();
    });
  }
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  return `${years}y`;
}

async function isReadTrue(id) {
  try {
    await customFetch(`/noti/isRead/${id}`, {
      method: "PUT",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

async function acceptOrReject(projectId, reqId, action) { 
  const data = { 
    "pmId": localStorage.getItem("personId"),
    "projectId": projectId,
    "requesterId": reqId,
    "approve": action === "accept" ? true : false
  }
  try {
    await customFetch(`/teams/joinRequests`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
    if(action === "accept") {
      notyf.success("Request approved successfully");
    } else 
    notyf.success("Request rejected successfully");
  } catch (error) {
    console.error("Error handling request action:", error);
  }
}


function togglePopup() {
  const popup = document.getElementById("notification-popup");
  popup.classList.toggle("hidden");
}

document.addEventListener("DOMContentLoaded", async () => {
  getNotifications();
});

async function getNotifications() {
  // Fetch notifications from the database
  const notifications = await customFetch("/noti/developer");
  console.log(`🚀 ~ document.addEventListener ~ notifications:`, notifications);
  // const bellRedDot = document.getElementById("bell-red-dot");
  // notifications.push({notification: {message: "test test test", projectId: "3", taskId: null, type: "REQUEST", title: "Request"}, isRead: false, id: "145"});

  // Populate the notification list
  const notificationList = document.getElementById("notification-list");
  // Remove all existing child elements
    while (notificationList.firstChild && notificationList != null) {
      notificationList.removeChild(notificationList.firstChild);
    }


  if (notifications.length === 0 || notifications == null) {
    // Show placeholder if no notifications are present
    const noNotifications = document.createElement("li");
    noNotifications.textContent = "No new notifications.";
    // bellRedDot.classList.remove("hidden");

    notificationList.appendChild(noNotifications);
  } else {
    // Populate the list with fetched notifications
    notifications.sort((a, b) => new Date(b.notification.createdAt) - new Date(a.notification.createdAt));

    notifications.forEach((recipients) => {
      const noti = recipients.notification;
      addNotification(noti.message, noti.projectId, noti.taskId, recipients.isRead, recipients.id, noti.type, noti.requesterId);
    });
  }
}