import { customFetch } from "../components/customFetch.js";
import { customSubmit } from "../components/customSubmit.js";

const notyf = new Notyf();

let project; // Global variable to store project details

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("project");
  const personId = localStorage.getItem("personId"); // Replace with actual authentication method

  if (!projectId || !personId) {
    notyf.error("Missing project or user data");
    return;
  }

  document.getElementById("manage-project-btn").addEventListener("click", () => {
    window.location.href = `/singleProject/index.html?projId=${projectId}&projName=${project.name}`;
  });
  const uploadSection = document.getElementById("upload-section");
  const fileInput = document.getElementById("file-input");
  const fileList = document.getElementById("file-list");
  const filePreview = document.getElementById("file-preview");
  const noAccessMessage = document.createElement("p");
  noAccessMessage.innerText = "You do not have access to this project.";
  noAccessMessage.style.color = "red";
  noAccessMessage.style.fontWeight = "bold";

  // File input change handler
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      showFilePreview(file, filePreview);
    }
  });

  function showFilePreview(file, previewElement) {
    if (!file || !previewElement) return;
    
    previewElement.innerHTML = '';
    const preview = document.createElement('div');
    preview.className = 'mt-3 p-2 border rounded';
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `
          <div class="d-flex align-items-center">
            <img src="${e.target.result}" style="max-height: 50px; max-width: 50px;" class="me-2">
            <div>
              <div class="fw-bold">${file.name}</div>
              <small class="text-muted">${formatFileSize(file.size)}</small>
            </div>
          </div>
        `;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = `
        <div class="d-flex align-items-center">
          <i class="fas ${getFileIcon(file.type)} fa-2x me-2"></i>
          <div>
            <div class="fw-bold">${file.name}</div>
            <small class="text-muted">${formatFileSize(file.size)}</small>
          </div>
        </div>
      `;
    }
    previewElement.appendChild(preview);
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function checkUserPermission() {
    try {
      // Fetch project details to check if the user is the Project Manager
      project = await customFetch(`/projects/${projectId}`); // Make project global

      const developers = await customFetch(
        `/projects/developersInSingleProject/${projectId}`
      );
      const developerIds = developers.map((dev) => dev.id);
      console.log(developers,"at files index")
      if (parseInt(personId) === project.projectManagerId) {
        uploadSection.style.display = "block"; // Allow project manager to upload files
        document.getElementById("myProjects").style.color = "white";
        document.getElementById("myProjects").style.backgroundColor = "#182a4e";
        document.getElementById("myProjects").style.borderRadius = "5px 5px 0 0";
      } else if (developerIds.includes(parseInt(personId))) {
        uploadSection.style.display = "none"; // Developers can view but not upload
        document.getElementById("assignedProjects").style.color = "white";
        document.getElementById("assignedProjects").style.backgroundColor =
          "#182a4e";
        document.getElementById("assignedProjects").style.borderRadius =
          "5px 5px 0 0";
      } else {
        document.body.innerHTML = ""; // Remove all content
        document.body.appendChild(noAccessMessage);
        return;
      }

      fetchFiles();
    } catch (error) {
      console.error("Error checking permissions:", error);
      notyf.error("Error loading project details.");
    }
  }

  async function fetchFiles() {
    try {
      const response = await customFetch(`/files/getByProject/${projectId}`);
      
      if (!response.data || response.data.length === 0) {
        fileList.innerHTML = "<p class='text-center mt-4'>No files found</p>";
        return;
      }

      displayFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
      notyf.error("Error loading files");
      fileList.innerHTML = "<p class='text-center mt-4 text-danger'>Error loading files</p>";
    }
  }

  function displayFiles(files) {
    fileList.innerHTML = files.map(file => `
      <div class="file-card p-3 mb-3 border rounded">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <i class="fas ${getFileIcon(file.type)} fa-2x me-3"></i>
            <div>
              <h5 class="mb-1">${file.name}</h5>
              <small class="text-muted">${formatFileSize(file.size)}</small>
            </div>
          </div>
          <div class="file-actions">
            <button class="btn btn-sm btn-primary me-2" onclick="viewFile('${file.url}', '${file.type}')">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-sm btn-success me-2" onclick="downloadFile('${file.url}', '${file.name}')">
              <i class="fas fa-download"></i> Download
            </button>
            ${parseInt(personId) === project.projectManagerId ? `
              <button class="btn btn-sm btn-danger" onclick="deleteFile(${file.id}, '${file.name}')">
                <i class="fas fa-trash"></i> Delete
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return 'fa-image';
    if (fileType.includes('pdf')) return 'fa-file-pdf';
    if (fileType.includes('word')) return 'fa-file-word';
    if (fileType.includes('excel')) return 'fa-file-excel';
    return 'fa-file';
  }

   // Update the upload form event listener
    customSubmit("upload-button", "upload-form", async () => {

      if (!fileInput.files.length) {
        notyf.error("Please select a file first");
        return;
      }


      const formData = new FormData();
      formData.append("file", fileInput.files[0]);
      formData.append("projectId", projectId); // Use the projectId from URL params


      try {
        const response = await customFetch("/files/upload", {
          method: "POST",
          body: formData,
        });

        if (response.status === "success") {
          notyf.success("File uploaded successfully!");
          // Close the modal
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("uploadModal")
          );
          modal.hide();
          // Clear the form
          fileInput.value = "";
          filePreview.innerHTML = "";
          // Refresh the file list
          await fetchFiles();
        } else {
          notyf.error(response.message || "Upload failed");
        }
      } catch (error) {
        console.error("Upload error:", error);
        notyf.error("Error uploading file");
      }
    });

  // Function to track PDF viewing percentage
  window.trackFileView = (fileUrl) => {
    const iframe = document.querySelector(`iframe[src="${fileUrl}"]`);
    const progressText = document.getElementById(`progress-${fileUrl}`);

    if (iframe) {
      iframe.addEventListener("scroll", () => {
        const scrollHeight = iframe.scrollHeight - iframe.clientHeight;
        const scrollTop = iframe.contentWindow.scrollY || iframe.scrollTop;
        const percentage = Math.min(
          100,
          Math.round((scrollTop / scrollHeight) * 100)
        );
        progressText.innerText = `Viewing: ${percentage}%`;
      });
    }
  };

  // Function to open image viewer
  window.openViewer = (imageUrl) => {
    const viewer = window.open(imageUrl, "_blank", "width=600,height=600");
    viewer.focus();
  };

  // Add view function
  window.viewFile = (fileUrl, fileType) => {
    if (fileType.startsWith('image/')) {
      window.open(fileUrl, '_blank');
    } else {
      // For PDFs and other documents
      window.open(fileUrl, '_blank');
    }
  };

  // Update download function to actually download the file
  window.downloadFile = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      notyf.error('Error downloading file');
    }
  };

  // Add delete function
  window.deleteFile = (fileId, fileName) => {
    // Set the file name in the modal
    document.getElementById('fileNameToDelete').innerText = fileName;

    // Show the confirmation modal
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
    deleteModal.show();

    // Handle the confirmation button click
    document.getElementById('confirmDeleteButton').onclick = async () => {
        try {
            const response = await customFetch(`/files/${fileId}`, {
                method: 'DELETE'
            });

        if (response.status === "success") {
          notyf.success("File deleted successfully");
          await fetchFiles();
        } else {
          notyf.error(response.message || "Delete failed");
        }
      } catch (error) {
        console.error("Delete error:", error);
        notyf.error("Error deleting file");
      }
    }
  };

  await checkUserPermission();
});
