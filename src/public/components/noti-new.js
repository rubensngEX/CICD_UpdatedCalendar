import { customFetch } from "../components/customFetch.js";
document.addEventListener("DOMContentLoaded", async () => {
  // Fetch notifications from the database
  const notifications = await customFetch("/noti/developer");
  console.log(`🚀 ~ document.addEventListener ~ notifications:`, notifications);
  const bellRedDot = document.getElementById("bell-red-dot");
  const notificationList = document.getElementById("notification-list");
  const toggleViewBtn = document.getElementById("toggle-view-btn");
  const notiTabs = document.getElementById("noti-tabs");
  let showTabs = false;

  notificationList.innerHTML = ""; // Clear existing

  if (notifications.length === 0) {
    // Show placeholder if no notifications are present
    const noNotifications = document.createElement("li");
    noNotifications.textContent = "No new notifications.";
    // bellRedDot.classList.remove("hidden");

    notificationList.appendChild(noNotifications);
  } else {
    notifications.sort((a, b) => new Date(b.notification.createdAt) - new Date(a.notification.createdAt));

    notifications.forEach((recipients) => {
      const noti = recipients.notification;
      addNotification(noti.message, noti.projectId, noti.taskId, recipients.isRead, recipients.id, noti.type);
    });
  }

  // Toggle between "All-in-One" and "Separated View"
  toggleViewBtn.addEventListener("click", () => {
    showTabs = !showTabs;
    notiTabs.classList.toggle("hidden", !showTabs);
  });

  // Handle tab click for filtering notifications
  document.querySelectorAll(".noti-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const type = e.target.getAttribute("data-type");

      // Highlight the active tab
      document.querySelectorAll(".noti-tab").forEach((t) => t.classList.remove("active"));
      e.target.classList.add("active");

      // Filter notifications
      filterNotifications(type);
    });
  });
});

// Function to filter notifications by type
function filterNotifications(type) {
  const allNotis = document.querySelectorAll(".notification-item");

  allNotis.forEach((noti) => {
    if (type === "ALL" || noti.getAttribute("data-type") === type) {
      noti.style.display = "flex";
    } else {
      noti.style.display = "none";
    }
  });
}

// Updated addNotification function to store type
function addNotification(notiMsg, projectId, taskId, isRead, id, type) {
  const newNotification = document.createElement("li");
  newNotification.classList.add("notification-item");
  newNotification.setAttribute("data-type", type);

  if (!isRead) {
    document.getElementById("bell-red-dot").classList.remove("hidden");
    newNotification.classList.add("bold");
  }

  const img = document.createElement("img");
  img.src = type === "ANNOUNCEMENT" ? "../images/announcement.png" :
            type === "REQUEST" ? "../images/request.png" :
            type === "TASK" ? "../images/task.png" :
            "../images/general.png";
  img.style.cssText = "width: 30px; height: 30px; border-radius: 50%; margin: 0 10px;";

  const text = document.createElement("span");
  text.textContent = notiMsg;

  const container = document.createElement("div");
  container.style.cssText = "display: flex; align-items: center;";
  container.append(img, text);

  // If it's a REQUEST, add action buttons
  if (type === "REQUEST") {
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");

    const acceptButton = document.createElement("button");
    acceptButton.textContent = "✔️ Accept";
    acceptButton.classList.add("accept-btn");
    acceptButton.addEventListener("click", async () => {
      await handleRequestAction(id, "accept");
    });

    const rejectButton = document.createElement("button");
    rejectButton.textContent = "❌ Reject";
    rejectButton.classList.add("reject-btn");
    rejectButton.addEventListener("click", async () => {
      await handleRequestAction(id, "reject");
    });

    buttonContainer.appendChild(acceptButton);
    buttonContainer.appendChild(rejectButton);
    container.appendChild(buttonContainer);
  }

  newNotification.classList.add("clickable-notification");
  newNotification.appendChild(container);
  newNotification.addEventListener("click", () => {
    window.location.href = taskId ? `/mytasks?taskId=${taskId}` : `/assignedProjects?projectId=${projectId}`;
    isReadTrue(id);
  });

  document.getElementById("notification-list").appendChild(newNotification);
}

// Handle Accept/Reject for Requests
async function handleRequestAction(notificationId, action) {
  try {
    const endpoint = action === "accept" ? "/noti/accept" : "/noti/reject";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });

    if (!response.ok) throw new Error(`Failed to ${action} request`);
    console.log(`Request ${action}ed successfully.`);
    location.reload();
  } catch (error) {
    console.error("Error:", error);
  }
}
