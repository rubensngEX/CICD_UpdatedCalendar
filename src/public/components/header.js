import { customFetch } from "../components/customFetch.js";
import Calendar from '../components/calendar.js';
import { customSubmit } from "../components/customSubmit.js";
const notyf = new Notyf();

document.addEventListener("DOMContentLoaded", async () => {
  // Dynamically create the header and append it to the DOM

  const team = await haveTeam();
  const navHTML = team
  ? `
    <nav>
        <a href="../" id="myProjects">My Projects</a>
        <a href="../assignedProjects/" id="assignedProjects">Assigned Projects</a>
        <a href="../mytasks/" id="allTasks">All Tasks</a>
        <a href="../team/" id="teamTab">Team</a>
        <div class="noti-container">
          <button class="bell" id="notiBell">
            <i class="fa fa-bell"></i>
            <span id="bell-red-dot" class="bell-red-dot hidden"></span>
          </button>
          <div id="notification-popup" class="popup hidden">
            <h4>Notifications</h4>
            <ul id="notification-list">
              <li>No new notifications.</li>
            </ul>
          </div>
        </div>     
    </nav>
    `
  : `
    <nav>
        <a href="../team/" id="teamTab">Team</a>
         <div class="noti-container">
          <button class="bell" id="notiBell">
            <i class="fa fa-bell"></i>
            <span id="bell-red-dot" class="bell-red-dot hidden"></span>
          </button>
          <div id="notification-popup" class="popup hidden">
            <h4>Notifications</h4>
            <ul id="notification-list">
              <li>No new notifications.</li>
            </ul>
          </div>
        </div>     
    </nav>
    `;
  const headerHTML = `
    <header class="header">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        <div class="header-content">
            <h1><strong>BugBusters</strong> project management</h1>
            <div class="profile-icon" id="profileIcon">
                <img src="" alt="Profile" id="currentProfilePic">
                <div class="profile-dropdown hidden" id="profileDropdown">
                    <div class="profile-header">
                        <img src="" alt="Profile Picture" id="editProfilePic">
                        <i class="fas fa-pencil-alt edit-icon" id="changeAvatar"></i>
                    </div>
                    <div class="profile-body">
                        <div class="profile-item">
                            <i class="fas fa-user"></i>
                            <span id="nameDisplay">Loading...</span>
                            <input type="text" id="nameInput" style="display:none;">
                        </div>
                        <div class="profile-item">
                            <i class="fas fa-envelope"></i>
                            <span id="emailDisplay">Loading...</span>
                            <input type="text" id="emailInput" style="display:none;">
                        </div>
                    </div>
                    <div class="profile-footer">
                        <a href="#" id="editDetails"><i class="fas fa-user-edit"></i> Edit Details</a>
                        <a href="#" id="saveDetails" style="display:none;"><i class="fas fa-save"></i> Save Details</a>
                        <a href="#" id="resetPassword"><i class="fas fa-key"></i> Update Password</a>
                        <a id="logout"><i class="fas fa-sign-out-alt"></i> Log Out</a>
                    </div>
                                   <div id="calendarContainer"></div>
                </div>



            </div>
        </div>
        ${navHTML}

        <!-- Modal for Password Update -->
        <div class="modal-overlay" id="passwordModalOverlay"></div>
        <div class="password-modal" id="passwordModal">
            <h3>Update Password</h3>
            <form id="passwordResetForm">
                <label for="currentPassword">Current Password:</label>
                <div class="password-container">
                    <input type="password" id="currentPassword" required>
                    <i class="fas fa-eye toggle-password" data-target="currentPassword"></i>
                </div>
                <label for="newPassword">New Password:</label>
                <div class="password-container">
                    <input type="password" id="newPassword" required>
                    <i class="fas fa-eye toggle-password" data-target="newPassword"></i>
                </div>
                <label for="confirmPassword">Confirm New Password:</label>
                <div class="password-container">
                    <input type="password" id="confirmPassword" required>
                    <i class="fas fa-eye toggle-password" data-target="confirmPassword"></i>
                </div>
                <div class="modal-buttons">
                    <button id="resetButton" type="submit">Update Password</button>
                    <button type="button" id="cancelReset">Cancel</button>
                </div>
            </form>
        </div>
    </header>

    <!-- Avatar Upload Modal -->
<div class="modal-overlay hidden" id="modalOverlay"></div>
<div class="avatar-modal hidden" id="avatarModal">
  <button class="close-button" id="closeModal">&times;</button>
  <h3>Upload and Crop Avatar</h3>
  
  <!-- Avatar Upload Form -->
  <form id="avatarForm">
    <input type="file" id="avatarInput" accept="image/png, image/jpeg, image/webp">
    <div class="crop-container">
      <img id="avatarPreview" style="max-width: 100%; display: none;">
    </div>
    <div class="avatar-modal-footer">
      <button type="submit" id="uploadAvatar">Upload</button>
    </div>
  </form>
  </div>

  `;

  // Append the header to the body
  document.body.insertAdjacentHTML("afterbegin", headerHTML);

  await loadProfile();

  // Add event listeners and functionality
  setupHeaderInteractions();

  getProjectDeadlines(personId)
  .then(data => {
    const { deadlines, projectNames } = data;
    const calendar = new Calendar(document.getElementById('calendarContainer'), deadlines, projectNames);
  })
  .catch(error => {
    console.error('Error creating calendar:', error);
  });
});

document.addEventListener("click", (e) => {
  const isProfileIcon = e.target.closest("#profileIcon");
  const isAvatarModal = e.target.closest("#avatarModal");

  if (!isProfileIcon && !isAvatarModal) {
    profileDropdown.classList.add("hidden");
  }
});


function setupHeaderInteractions() {
  const profileIcon = document.getElementById("profileIcon");
  const profileDropdown = document.getElementById("profileDropdown");
  const changeAvatarBtn = document.getElementById("changeAvatar");
  const avatarModal = document.getElementById("avatarModal");
  const modalOverlay = document.getElementById("modalOverlay");
  const closeModalBtn = document.getElementById("closeModal");
  const avatarInput = document.getElementById("avatarInput");
  const avatarPreview = document.getElementById("avatarPreview");
  const uploadAvatarBtn = document.getElementById("uploadAvatar");
  const nameDisplay = document.getElementById("nameDisplay");
  const emailDisplay = document.getElementById("emailDisplay");
  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");
  const editDetailsBtn = document.getElementById("editDetails");
  const saveDetailsBtn = document.getElementById("saveDetails");
  const resetPasswordBtn = document.getElementById("resetButton");
  const logoutButton = document.getElementById("logout");
  const notiButton = document.getElementById("notiBell");
  const calendarContainer = document.getElementById('calendarContainer');
  let cropper;

  notiButton.addEventListener("click", (e) => {
    e.preventDefault();
    togglePopup();
  });
  // Logout button event listener
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "../index.html";
  });

   // Toggle profile dropdown only when not clicking on the avatar modal
   profileIcon.addEventListener("click", (e) => {
    e.preventDefault();
    profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block"
  });

  // Open avatar modal (keep dropdown open)
  changeAvatarBtn.addEventListener("click", (e) => {
    e.preventDefault();
    avatarModal.style.display = avatarModal.style.display === "block" ? "none" : "block";
    modalOverlay.style.display = modalOverlay.style.display === "block" ? "none" : "block";
  });


  // Close avatar modal (but keep dropdown open)
  closeModalBtn.addEventListener("click", closeAvatarModal);
  modalOverlay.addEventListener("click", closeAvatarModal);

  function closeAvatarModal() {
    avatarModal.style.display = "none";
    modalOverlay.style.display = "none";
    
    // Ensure that only the avatar modal is closed and the profile dropdown remains open
    if (cropper) cropper.destroy();
  }

  // Handle file input change
  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview.src = e.target.result;
        avatarPreview.style.display = "block";

        if (cropper) cropper.destroy();
        cropper = new Cropper(avatarPreview, {
          aspectRatio: 1, // Keep square crop
          viewMode: 1,
          autoCropArea: 1,
          background: false,
          zoomable: true,
        });
      };
      reader.readAsDataURL(file);
    }
  });

  customSubmit("uploadAvatar", "avatarForm", async () => {
    if (!cropper) {
      notyf.error("Please select and crop an image first.");
      throw new Error("No image selected.");
    }
  
    // Get cropped image as a Blob
    const blob = await new Promise((resolve) => {
      cropper.getCroppedCanvas({ width: 200, height: 200 }).toBlob(resolve, "image/jpeg");
    });
  
    if (!blob) {
      notyf.error("Failed to process image.");
      throw new Error("Blob processing failed.");
    }
  
    const formData = new FormData();
    const personId = localStorage.getItem("personId");
    formData.append("avatar", blob, `avatar-${personId}.jpg`);
  
    try {
      const response = await customFetch("/persons/avatar", {
        method: "PUT",
        body: formData,
      });
  
      console.log("Response received:", response);
      
      if (response && response.avatar) {
        document.getElementById("currentProfilePic").src = response.avatar;
        document.getElementById("editProfilePic").src = response.avatar;
        notyf.success("Avatar updated successfully!");
        closeAvatarModal();
      } else {
        throw new Error(response.error || "Failed to upload avatar.");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      notyf.error(error.message || "Upload failed.");
      throw error; // Ensures the button text updates correctly in case of an error
    } finally {
      // Hide the loading spinner
      document.getElementById("uploadSpinner").style.display = "none";
    }
  });
  
  

  // Edit Profile Details
  editDetailsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    nameDisplay.style.display = "none";
    emailDisplay.style.display = "none";
    nameInput.style.display = "block";
    emailInput.style.display = "block";
    editDetailsBtn.style.display = "none";
    saveDetailsBtn.style.display = "block";
  });

  document.getElementById("resetPassword").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("passwordModal").style.display = "block";
    document.getElementById("passwordModalOverlay").style.display = "block";
  });

  document.getElementById("cancelReset").addEventListener("click", () => {
    document.getElementById("passwordModal").style.display = "none";
    document.getElementById("passwordModalOverlay").style.display = "none";
  });

  document
    .getElementById("passwordModalOverlay")
    .addEventListener("click", () => {
      document.getElementById("passwordModal").style.display = "none";
      document.getElementById("passwordModalOverlay").style.display = "none";
    });

  // Update Password
  resetPasswordBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      notyf.error("Passwords do not match!");
      return;
    }

    try {
      // API call to update the password
      await customFetch("/persons/updatePassword", {
        method: "PUT",
        body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
      });

      // Success notification and UI updates
      notyf.success("Password update successfully!");
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
      document.getElementById("passwordModal").style.display = "none";
      document.getElementById("passwordModalOverlay").style.display = "none";
    } catch (error) {
      console.error("Error resetting password:", error);
      notyf.error("Failed to update password. Please try again.");
    }
  });

  // Save Profile Details
  saveDetailsBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const originalName = nameDisplay.textContent;
    const originalEmail = emailDisplay.textContent;
    const updatedName = nameInput.value;
    const updatedEmail = emailInput.value;

    if (originalName === updatedName && originalEmail === updatedEmail) {
      nameDisplay.style.display = "block";
      emailDisplay.style.display = "block";
      nameInput.style.display = "none";
      emailInput.style.display = "none";
      editDetailsBtn.style.display = "block";
      saveDetailsBtn.style.display = "none";
      return;
    }

    try {
      // Make API call to update details
      await customFetch("/persons/updateDetails", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: updatedName, email: updatedEmail }),
      });

      notyf.success("Details updated successfully:");

      // Update UI with new details
      await loadProfile();
      nameDisplay.style.display = "block";
      emailDisplay.style.display = "block";
      nameInput.style.display = "none";
      emailInput.style.display = "none";
      editDetailsBtn.style.display = "block";
      saveDetailsBtn.style.display = "none";
    } catch (error) {
      console.error("Error updating details:", error);
      notyf.error("Failed to update details. Please try again.");
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#profileIcon")) {
      profileDropdown.style.display = "none";
    }
  });

  // Stop clicks inside the dropdown from closing it
  profileDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

function togglePopup() {
  const popup = document.getElementById("notification-popup");
  popup.classList.toggle("hidden");
}

async function haveTeam() {
  try {
    const data = await customFetch("/persons/id");

    if (data.teamId==null) {
      return false;
    } else return true;
  }  catch (error) {
    console.error("Error fetching team:", error);
  }
}

async function loadProfile() {
  try {
    const data = await customFetch("/persons/id");
    document.getElementById("currentProfilePic").src =
      data.avatar || "../images/default-avatar.png";
    document.getElementById("editProfilePic").src =
      data.avatar || "../images/default-avatar.png";
    document.getElementById("nameDisplay").textContent =
      data.name || "Unknown User";
    document.getElementById("emailDisplay").textContent =
      data.email || "unknown@example.com";
    document.getElementById("nameInput").value = data.name || "";
    document.getElementById("emailInput").value = data.email || "";
  
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
}

// Calendar
const personId = localStorage.getItem('personId');
async function getProjectDeadlines(personId) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/projects/deadlines/${personId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    });
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data = await response.json(); // This should be an array of objects containing both 'deadline' and 'name'

    // Separate the deadlines and project names
    const deadlines = data.map(project => project.deadline);
    const projectNames = data.map(project => project.name);

    return { deadlines, projectNames };
  } catch (error) {
    console.error('Error fetching project deadlines:', error);
    throw error;
  }
}



