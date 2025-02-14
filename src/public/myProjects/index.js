import { customFetch } from "../components/customFetch.js";
import { customSubmit } from "../components/customSubmit.js";
import { showProjectTasksChart } from "../components/myChart.js";

const projectCache = new Map();
const notyf = new Notyf();
let currentProjIndex;
let currentProjId;
let isUpdated = false;

let loading = true;
const loadingSpinner = document.querySelector('.loading-spinner');
const contentContainer = document.querySelector('.content-container');
const noProjectsDiv = document.getElementById('noProj');

function showLoading() {
    loading = true;
    loadingSpinner.classList.add('show');
    contentContainer.classList.remove('loaded');
    noProjectsDiv.classList.remove('show');
}

function hideLoading() {
    loading = false;
    loadingSpinner.classList.remove('show');
    setTimeout(() => {
        contentContainer.classList.add('loaded');
    }, 100);
}

function showNoProjects() {
    contentContainer.style.display = 'none';
    noProjectsDiv.classList.add('show');
}

function showProjects() {
    noProjectsDiv.classList.remove('show');
    contentContainer.style.display = 'block';
}

function togglePopup() {
  const popup = document.getElementById("notification-popup");
  popup.classList.toggle("hidden");
}
// Utility function to set loading indicator
function showLoadingIndicator(element) {
  element.innerHTML = "<p>Loading...</p>";
}

function toggleChartDisplay(hasTasks) {
  const chartContainer = document.querySelector(".chart-container");
  chartContainer.style.display = hasTasks ? "block" : "none";
}

// Reset the Create Project modal
function resetCreateProjectModal() {
  const projectNameInput = document.getElementById("projectName");
  const projectDescriptionInput = document.getElementById("projectDescription");
  const addDevelopersSelect = document.getElementById("addDevelopers");
  const developerSelectionDiv = document.getElementById("developerSelection");

  projectNameInput.value = "";
  projectDescriptionInput.value = "";
  addDevelopersSelect.value = "no";
  developerSelectionDiv.style.display = "none";
}

// Populate the project list
async function populateMyProjects() {
const left = document.querySelector(".left-column")
const right =  document.querySelector(".right-column")

  const projectListContainer = document.getElementById("projectList");
  const noProj = document.getElementById("noProj");
  showLoading();

  try {
    const projects = await customFetch(`/projects/asManager/`);
    if (projects.length > 0) {
      showProjects();
      left.classList.remove("empty");
      right.classList.remove("empty");
      noProj.classList.add("empty");
      renderProjectList(projects);
      if(currentProjIndex == null) {
        populateProjectDetail(projects[0].id);
        linkManageProjButton(projects[0].id, projects[0].name);
      } else {
        populateProjectDetail(projects[currentProjIndex].id);
        linkManageProjButton(projects[currentProjIndex].id, projects[currentProjIndex].name);
      }
    
    } else {
      left.classList.add("empty");
      right.classList.add("empty");
      noProj.classList.remove("empty");
      showNoProjects();
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    notyf.error("Failed to load projects. Please try again.");
  } finally {
    hideLoading();
  }
}

// Render the project list
function renderProjectList(projects) {
  const projectList = document.getElementById("projectList");
  const fragment = document.createDocumentFragment();

  projects.forEach((project, index) => {
    const listItem = document.createElement("li");
    listItem.style.display = "flex";
    listItem.style.justifyContent = "space-between";
    listItem.style.alignItems = "center";
    listItem.style.padding = "10px 0";
    listItem.style.borderBottom = "1px solid #ddd";
  
    const projectName = document.createElement("span");
    projectName.textContent = project.name;
    projectName.style.flex = "1";
    projectName.style.padding = "5px";
    
    listItem.addEventListener("click", () => {
      document.querySelectorAll("li").forEach(item => item.classList.remove("selected"));
      document.querySelectorAll(".fas.fa-edit").forEach(item => item.style.color ="#182a4e");

      listItem.classList.add("selected");
  
      const icon = listItem.querySelector(".fas.fa-edit");
      if (icon) {
        icon.style.color = "white";
      }

      currentProjIndex = index;
      populateProjectDetail(project.id);
      linkManageProjButton(project.id, project.name);
    });
    const editButton = document.createElement("button");
    editButton.innerHTML = '<i class="fas fa-edit" style="color: #182a4e;"></i>';
    editButton.title = "Edit Project";
    editButton.className = "btn btn-link edit-button";
    editButton.addEventListener("click", () =>
      openEditModal(project.id, project.name, project.description)
    );

    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = '<i class="fas fa-trash-alt text-danger"></i>';
    deleteButton.title = "Delete Project";
    deleteButton.className = "btn btn-link delete-button";
    deleteButton.addEventListener("click", () => openDeleteModal(project.id));
  
    const actionContainer = document.createElement("div");
    actionContainer.style.display = "flex";
    actionContainer.style.gap = "10px";
    actionContainer.appendChild(editButton);
    actionContainer.appendChild(deleteButton);
  
    listItem.appendChild(projectName);
    listItem.appendChild(actionContainer);
    fragment.appendChild(listItem);
    if ( currentProjIndex == null && index == 0){
      listItem.classList.add("selected");
    } else if (currentProjIndex == index){
      listItem.classList.add("selected");
    }
  });
  

  projectList.innerHTML = "";
  projectList.appendChild(fragment);
}

// Populate project details
async function populateProjectDetail(projectId) {
  const projectDetailsContainer = document.getElementById("projectDetails");

  if (projectCache.has(projectId) && !isUpdated) {
    isUpdated = false;
    displayProjectDetail(projectCache.get(projectId));
    return;
  }

  showLoadingIndicator(projectDetailsContainer);

  try {
    const project = await customFetch(`/projects/details/${projectId}`);
    projectCache.set(projectId, project);
    displayProjectDetail(project);
  } catch (error) {
    console.error("Error fetching project details:", error);
  }
}

// Display project details
function displayProjectDetail(project) {
  const projectDetails = document.getElementById("projectDetails");
  projectDetails.innerHTML = `
  <div class="project-summary">
    <h2 class="summary-header">Project Summary</h2>
    <div class="summary-content">
      <p><strong>Name:</strong> ${project.name}</p>
      <p><strong>Description:</strong> ${project.description}</p>
      <p><strong>Project Manager:</strong> ${project.projectManager}</p>
      <p><strong>Total Tasks:</strong> ${project.tasksDetails.totalTasks}</p>
      <p><strong>Number of Developers:</strong> ${
        project.developersDetail.numDevelopers
      }</p>
      <p><strong>Created At:</strong> ${new Date(
        project.createdAt
      ).toLocaleString()}</p>
      <p><strong>Project's Deadline:</strong> ${
        project.deadline === null
          ? "<i style='color: red;'>No Deadline Specified</i>"
          : new Date(project.deadline).toLocaleString()
      }</p>
      <button id="addNewDeveloperButton" class="add-developer-btn">Add Developer</button><br>
      <button id="viewFilesButton" class="view-files-btn">View Files</button><br>

    </div>
  </div>
  `;

  const addNewDeveloperButton = document.getElementById(
    "addNewDeveloperButton"
  );

  addNewDeveloperButton.addEventListener("click", (e) => {
    e.preventDefault();
    // openAddNewDeveloperModal(project.id);
    populateNewDeveloperForSingleProject(project.id);
  });

  // Event listener for navigating to the files page
  document.getElementById("viewFilesButton").addEventListener("click", () => {
    window.location.href = `../files/index.html?project=${project.id}`;
  });
  const developerTable = document.createElement("table");
  developerTable.classList.add("developer-table");
  developerTable.innerHTML = `
    <tr>
      <th>Developer Name</th>
      <th>Completed</th>
      <th>In Progress</th>
      <th>Pending</th>
      <th>On Hold</th>
      <th>Total Tasks</th>
      <th>Actions</th>
    </tr>`;

  const statusOrder = ["COMPLETED", "IN_PROGRESS", "PENDING", "ON_HOLD"];

  project.developersDetail.developers.forEach((developer) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = developer.name;
    row.appendChild(nameCell);

    let totalTasks = 0;

    statusOrder.forEach((status) => {
      const countCell = document.createElement("td");
      const count = developer.taskCountsByStatus[status] || 0;
      countCell.textContent = count;
      totalTasks += count;
      row.appendChild(countCell);
    });

    const totalTasksCell = document.createElement("td");
    totalTasksCell.textContent = totalTasks;
    row.appendChild(totalTasksCell);

    // Actions column
    const actionsCell = document.createElement("td");

    // Transfer button
    const transferButton = document.createElement("button");
    transferButton.innerHTML = `<i class="fas fa-exchange-alt"></i>`;
    transferButton.classList.add(
      "btn",
      "btn-sm",
      "btn-primary",
      "me-2",
      "transfer-button"
    );
    transferButton.title = "Transfer Developer";
    transferButton.dataset.personId = developer.id; // Set the person ID in the dataset

    // Disable transfer button if total tasks are 0
    if (totalTasks === 0) {
      transferButton.disabled = true;
      transferButton.title = "Developer has no tasks to transfer";
      transferButton.style.backgroundColor = "#d3d3d3"; // Light gray color for disabled state
      transferButton.style.color = "#ffffff"; // White text for better contrast
      transferButton.style.cursor = "not-allowed"; // Change cursor to indicate non-interactive state
    }

    // Remove button
    const removeButton = document.createElement("button");
    removeButton.innerHTML = `<i class="fas fa-trash"></i>`;
    removeButton.classList.add("btn", "btn-sm", "btn-danger", "remove-button");
    removeButton.title = "Remove Developer";
    removeButton.dataset.personId = developer.id; // Set the person ID in the dataset

    actionsCell.appendChild(transferButton);
    actionsCell.appendChild(removeButton);
    row.appendChild(actionsCell);

    developerTable.appendChild(row);
  });

  if (parseInt(project.developersDetail.numDevelopers, 10) != 0) {
    projectDetails.appendChild(developerTable);
    addEventListenersForProjectDetailsActions(project.id);
  }

  toggleChartDisplay(project.tasksDetails.totalTasks > 0);

  if (project.tasksDetails.totalTasks > 0) {
    showProjectTasksChart(project.tasksDetails, (clickedStatus) =>
      onLegendClick(clickedStatus, project)
    );
  } else {
    const noTasksMessage = document.createElement("p");
    noTasksMessage.classList.add("no-tasks-message");
    noTasksMessage.textContent = "This project has no tasks.";
    projectDetails.appendChild(noTasksMessage);
  }
}

function  addEventListenersForProjectDetailsActions(projectId) {
  const transferButtons = document.querySelectorAll(".transfer-button");
  const removeButtons = document.querySelectorAll(".remove-button");
  
  transferButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      const personId = button.dataset.personId; // Get the ID of the person to remove
      showTransferModal(projectId, personId, index);
    });
  });

  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const developerId = button.dataset.personId;
      showRemoveDeveloperModal(projectId, developerId);
    });
  });
}

function showTransferModal(projectId, transferringId, index) {
  const modal = document.getElementById("transferModal");
  const transferList = document.getElementById("transferList");

  // Clear previous options
  transferList.innerHTML = "";

  // Fetch project members (excluding the transferring person)
  customFetch(`/projects/developersInSingleProject/${projectId}`)
    .then((developers) => {
      const otherDevelopers = developers.filter(
        (developer) => developer.id !== parseInt(transferringId, 10)
      );

      if (otherDevelopers.length > 0) {
        otherDevelopers.forEach((developer) => {
          const option = document.createElement("option");
          option.value = developer.id;
          option.textContent = developer.name;
          transferList.appendChild(option);
        });
      } else {
        // Display a message when no other developers are available
        transferList.innerHTML = ""; // Clear the list to ensure only the message shows
        const noDevelopersMessage = document.createElement("option");
        noDevelopersMessage.textContent =
          "No other developers available to transfer tasks.";
        noDevelopersMessage.disabled = true; // Disable the message option
        transferList.appendChild(noDevelopersMessage);
      }

      // Show modal
      const transferModalInstance = new bootstrap.Modal(modal);
      transferModalInstance.show();
    })
    .catch((error) => {
      console.error("Error fetching developers:", error);
      notyf.error("Failed to load developers. Please try again.");
    });

  customSubmit("transferSubmit", "transferModalForm", async () => {
    const transferredId = document.getElementById("transferList").value;
    if (!transferredId) {
      notyf.error("Please select a person to transfer tasks to.");
      return;
    }

    try {
      await customFetch(`/projects/transfer/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({ transferringId, transferredId }),
      });
      notyf.success("Tasks transferred successfully.");
      bootstrap.Modal.getInstance(
        document.getElementById("transferModal")
      ).hide();
      isUpdated = true;
      refreshProjects();
    } catch (error) {
      notyf.error("Failed to transfer tasks. Please try again.");
    }
  });

}


function showRemoveDeveloperModal(projectId, developerId) {
  const modal = document.getElementById("removeDeveloperModal");
  const confirmButton = document.getElementById("confirmRemoveDeveloper");
  const confirmationText = document.getElementById(
    "removeDeveloperConfirmationText"
  );

  // Update the confirmation text dynamically
  confirmationText.textContent =
    "Are you sure you want to remove this developer? If they are the only assignee for some tasks, those tasks will be deleted.";

  // Show the modal using Bootstrap's modal instance
  const removeModalInstance = new bootstrap.Modal(modal);
  removeModalInstance.show();

  // Use `customSubmit` for handling the confirmation
  customSubmit(
    "confirmRemoveDeveloper",
    "removeDeveloperModalForm",
    async () => {
      try {
        // Make an API call to remove the developer
        await customFetch(`/projects/remove/${projectId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ removedPersonId: developerId }),
        });

        // Success notification
        notyf.success("Developer removed successfully.");
        bootstrap.Modal.getInstance(modal).hide(); // Hide modal after success
        isUpdated = true;
        // Refresh the project data
        refreshProjects();
      } catch (error) {
        console.error("Error removing developer:", error);
        notyf.error("Failed to remove developer. Please try again.");
      }
    }
  );
}

function onLegendClick(clickedStatus, project) {
  const developerTable = document.querySelector(".developer-table");
  const headerRow = developerTable.querySelector("tr:first-child"); // The header row
  const rows = developerTable.querySelectorAll("tr:not(:first-child)"); // Exclude header row
  const totalTasksElement = document.querySelector(
    "#projectDetails p b:nth-of-type(4)"
  );
  let currentTotalTasks = parseInt(totalTasksElement.textContent, 10); // Current total tasks

  // Get the count for the clicked status from project.tasksDetails.statusCounts
  const clickedStatusCount =
    project.tasksDetails.statusCounts[clickedStatus] || 0;

  const statusOrder = ["COMPLETED", "IN_PROGRESS", "PENDING", "ON_HOLD"];
  const statusIndex = statusOrder.indexOf(clickedStatus) + 1; // +1 to skip the Developer Name column

  // Determine if the column is currently hidden
  const headerCell = headerRow.querySelectorAll("th")[statusIndex];
  const hidden = headerCell.classList.contains("hidden");

  // Toggle the header visibility
  if (hidden) {
    headerCell.classList.remove("hidden");
    currentTotalTasks += clickedStatusCount; // Add clicked status count back to total
  } else {
    headerCell.classList.add("hidden");
    currentTotalTasks -= clickedStatusCount; // Subtract clicked status count from total
  }

  // Adjust the total tasks for each developer and toggle row visibility
  rows.forEach((row) => {
    const columns = row.querySelectorAll("td");
    const statusCell = columns[statusIndex]; // Status cell for the clicked status
    const totalCell = columns[columns.length - 2]; // Second last column for total tasks (before actions)
    const actionCell = columns[columns.length - 1]; // Last column for action buttons

    const developerName = columns[0].textContent; // Developer name
    const developerData = project.developersDetail.developers.find(
      (dev) => dev.name === developerName
    ); // Get the developer's data
    const statusCount = developerData.taskCountsByStatus[clickedStatus] || 0; // Get the count for the clicked status

    const currentTotal = parseInt(totalCell.textContent, 10) || 0;

    if (hidden) {
      // If the column is hidden, show it and add the count back
      statusCell.classList.remove("hidden");
      totalCell.textContent = currentTotal + statusCount;
    } else {
      // If the column is visible, hide it and subtract the count
      statusCell.classList.add("hidden");
      totalCell.textContent = currentTotal - statusCount;
    }

    // Ensure the action cell is always visible
    actionCell.classList.remove("hidden");
  });

  // Update the total tasks in the project summary
  totalTasksElement.textContent = currentTotalTasks;
}


async function populateDeveloperList() {
  const developerCheckboxList = document.getElementById(
    "developerCheckboxList"
  );

  try {
    const developers = await customFetch(`/projects/developers`);
    developerCheckboxList.innerHTML = ""; // Clear existing list

    developers.forEach((developer) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = developer.id;
      checkbox.id = `dev-${developer.id}`;
      checkbox.classList.add("developer-checkbox");

      const label = document.createElement("label");
      label.htmlFor = `dev-${developer.id}`;
      label.textContent = developer.name;
      label.style.marginLeft = "5px";

      const div = document.createElement("div");
      div.classList.add("form-check");
      div.appendChild(checkbox);
      div.appendChild(label);

      developerCheckboxList.appendChild(div);
    });
  } catch (error) {
    console.error("Error fetching developers:", error);
  }
}


// Toggle developer selection visibility
function setupDeveloperSelection() {
  const addDevelopersSelect = document.getElementById("addDevelopers");
  const developerSelectionDiv = document.getElementById("developerSelection");

  addDevelopersSelect.addEventListener("change", (event) => {
    if (event.target.value === "yes") {
      developerSelectionDiv.style.display = "block";
      populateDeveloperList();
    } else {
      developerSelectionDiv.style.display = "none";
    }
  });
}

async function populateNewDeveloperForSingleProject(projectId) {
  const newDeveloperCheckboxList = document.getElementById(
    "newDeveloperCheckboxList"
  );

  try {
    const newDevelopers = await customFetch(
      `/projects/newDevelopers/${projectId}`
    );
    newDeveloperCheckboxList.innerHTML = ""; // Clear existing list

    if(newDevelopers.length === 0) {
      notyf.success("All developers are already in the project.")
      return
    }
    openAddNewDeveloperModal(projectId);


    newDevelopers.forEach((developer) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = developer.id;
      checkbox.id = `new-dev-${developer.id}`;
      checkbox.classList.add("new-developer-checkbox");

      const label = document.createElement("label");
      label.htmlFor = `new-dev-${developer.id}`;
      label.textContent = developer.name;
      label.style.marginLeft = "5px";

      const div = document.createElement("div");
      div.classList.add("form-check");
      div.appendChild(checkbox);
      div.appendChild(label);

      newDeveloperCheckboxList.appendChild(div);
    });
  } catch (error) {
    console.error("Error fetching developers:", error);
  }
}
function setupSelectAllButtons() {
  // Toggle Select All for Developer List
  document
    .getElementById("selectAllDeveloperButton")
    .addEventListener("click", function () {
      const checkboxes = document.querySelectorAll(".developer-checkbox");
      const allSelected = Array.from(checkboxes).every(
        (checkbox) => checkbox.checked
      );

      checkboxes.forEach((checkbox) => {
        checkbox.checked = !allSelected; // Toggle state
      });

      this.textContent = allSelected ? "Select All" : "Deselect All";
    });

  // Toggle Select All for New Developer List
  document
    .getElementById("selectAllNewDeveloperButton")
    .addEventListener("click", function () {
      const checkboxes = document.querySelectorAll(".new-developer-checkbox");
      const allSelected = Array.from(checkboxes).every(
        (checkbox) => checkbox.checked
      );

      checkboxes.forEach((checkbox) => {
        checkbox.checked = !allSelected; // Toggle state
      });

      this.textContent = allSelected ? "Select All" : "Deselect All";
    });
}
// Open Edit Modal
function openEditModal(projectId, projectName, projectDescription) {
  const modal = new bootstrap.Modal(
    document.getElementById("editProjectModal")
  );
  document.getElementById("editProjectModal").dataset.projectId = projectId;
  document.getElementById("editProjectName").value = projectName;
  document.getElementById("editProjectDescription").value = projectDescription;
  modal.show();
}

// Open Delete Modal
function openDeleteModal(projectId) {
  const modal = new bootstrap.Modal(
    document.getElementById("deleteProjectModal")
  );
  document.getElementById("deleteProjectModal").dataset.projectId = projectId;
  modal.show();
}

function openAddNewDeveloperModal(projectId) {
  const modal = new bootstrap.Modal(
    document.getElementById("addNewDeveloperModal")
  );
  document.getElementById("addNewDeveloperProjectId").value = projectId;
  modal.show();
}

async function handleSubmission(actionType) {
  try {
    switch (actionType) {
      case "createProject": {
        const projectName = document.getElementById("projectName").value.trim();
        const projectDescription = document.getElementById("projectDescription").value.trim();
        const deadline = document.getElementById("projectDeadline").value.trim();
        const developerIds = Array.from(
          document.querySelectorAll(".developer-checkbox:checked")
        ).map((checkbox) => checkbox.value);

        if (!projectName) {
          notyf.error("Project name is required.");
          return;
        }

        // Check for duplicate project names
        const existingProjects = await customFetch("/projects"); // Fetch existing projects
        const isDuplicate = existingProjects.some(project => project.name === projectName);
        if (isDuplicate) {
          notyf.error("A project with this name already exists.");
          return;
        }

        const notiMsg = `You have been added to a project!\nProject Name:${projectName}`;

        const projectData = { projectName, projectDescription, deadline, developerIds, notiMsg };

        try {
          await customFetch("/projects", {
            method: "POST",
            body: JSON.stringify(projectData),
          });

          notyf.success({
            message: "Project created successfully!",
            duration: 5000,
          });

          // Close modal and clear form
          const modal = document.getElementById("createProjectModal");
          bootstrap.Modal.getInstance(modal).hide();
          document.getElementById("createProjectForm").reset();
          isUpdated = true;
          refreshProjects();
        } catch (error) {
          handleServerError(error, "creating the project");
          return;
        }
        break;
      }
      case "editProject": {
        const projectId =
          document.getElementById("editProjectModal").dataset.projectId;
        const updatedProjectName = document
          .getElementById("editProjectName")
          .value.trim();
        const updatedProjectDescription = document
          .getElementById("editProjectDescription")
          .value.trim();

        if (!updatedProjectName) {
          notyf.error("Project name cannot be empty.");
          return;
        }

        let existingProject = projectCache.get(parseInt(projectId, 10));

        if (!existingProject) {
          try {
            existingProject = await customFetch(
              `/projects/details/${projectId}`
            );
            if (existingProject) {
              projectCache.set(parseInt(projectId, 10), existingProject);
            } else {
              notyf.error("Failed to fetch project details. Please try again.");
              return;
            }
          } catch (error) {
            console.error("Error fetching project details:", error);
            notyf.error("An error occurred while fetching project details.");
            return;
          }
        }

        if (
          existingProject.name === updatedProjectName &&
          existingProject.description === updatedProjectDescription
        ) {
          notyf.error("No changes detected. Please update the details.");
          return;
        }

        try {
          await customFetch(`/projects/${projectId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectName: updatedProjectName,
              projectDescription: updatedProjectDescription,
            }),
          });

          projectCache.set(parseInt(projectId, 10), {
            ...existingProject,
            name: updatedProjectName,
            description: updatedProjectDescription,
          });

          notyf.success({
            message: "Project updated successfully!",
            duration: 5000,
          });

          bootstrap.Modal.getInstance(
            document.getElementById("editProjectModal")
          ).hide();
          isUpdated = true;
          refreshProjects();
        } catch (error) {
          handleServerError(error, "updating the project");
        }
        break;
      }

      case "deleteProject": {
        const deleteProjectId = document.getElementById("deleteProjectModal").dataset.projectId;

        try {
          await customFetch(`/projects/${deleteProjectId}`, {
            method: "DELETE",
          });

          notyf.success({
            message: "Project deleted successfully!",
            duration: 5000,
          });

          // Close modal
          const modal = document.getElementById("deleteProjectModal");
          bootstrap.Modal.getInstance(modal).hide();
          isUpdated = true;
          refreshProjects();
        } catch (error) {
          handleServerError(error, "deleting the project");
        }
        break;
      }
      default:
        notyf.error("Unknown action. Please try again.");
        console.error("Unknown action type:", actionType);
        break;
    }
  } catch (error) {
    console.error(`${actionType} submission failed:`, error);
    notyf.error({
      message: "An unexpected error occurred. Please try again.",
      duration: 7000,
    });
  }
}

// Handle Server Errors
let errorDisplayed = false; // Prevent duplicate error messages

function handleServerError(error, actionDescription) {
  if (errorDisplayed) return; // Skip if an error has already been displayed
  errorDisplayed = true;

  console.error(`Error ${actionDescription}:`, error);

  if (error.code === "P2002") {
    notyf.error(
      `A project with the same name already exists. Please choose a different name.`
    );
  } else {
    notyf.error({
      message: `Failed ${actionDescription}. Please try again later.`,
      duration: 7000,
    });
  }

  // Reset the flag after a delay to allow new errors to be displayed later
  setTimeout(() => {
    errorDisplayed = false;
  }, 7000); // Same duration as the notification
}


// Initialize page
function initializePage() {
  customSubmit("createProjectButton", "createProjectForm", async () => {
    await handleSubmission("createProject");
  });

  customSubmit("editProjectButton", "editProjectForm", async () => {
    await handleSubmission("editProject");
  });

  customSubmit("confirmDeleteProject", "deleteProjectForm", async () => {
    await handleSubmission("deleteProject");
  });
  // Add event listener for form submission
  document
    .getElementById("addNewDeveloperForm")
    .addEventListener("submit", handleAddNewDeveloperSubmit);

  setupSelectAllButtons();
  setupDeveloperSelection();
  initializeCreateProjectModal();
  populateMyProjects();
}

async function handleAddNewDeveloperSubmit(event) {
  event.preventDefault();

  const projectId = document.getElementById("addNewDeveloperProjectId").value;
  const projectName = document.querySelector("li.selected span").textContent;
  const notiMsg = `You have been added to a project as developer!\nProject Name: ${projectName}`

  const selectedDeveloperIds = Array.from(
    document.querySelectorAll(".new-developer-checkbox:checked") 
  ).map((checkbox) => checkbox.value);

  if (selectedDeveloperIds.length === 0) {
    notyf.error("Please select at least one developer to add.");
    return;
  }

  try {
    await customFetch(`/projects/newDevelopers/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ developerIds: selectedDeveloperIds , notiMsg: notiMsg}),
      
    });

    notyf.success({
      message: "Developers added successfully!",
      duration: 5000,
    });

    // Close the modal and refresh project details
    bootstrap.Modal.getInstance(
      document.getElementById("addNewDeveloperModal")
    ).hide();

    isUpdated = true;
    // Refresh project details or developer list after successful submission
    refreshProjects();
  } catch (error) {
    console.error("Error adding developers:", error);
    notyf.error({
      message: "Failed to add developers. Please try again.",
      duration: 7000,
    });
  }
}

// Link Manage Project Button
function linkManageProjButton(projectId, projectName) {
  const manageProjButton = document.getElementById("manageProjButton");
  if (manageProjButton) {
    manageProjButton.addEventListener("click", () => {
      const url = `../singleProject/index.html?projId=${projectId}&projName=${projectName}`;
      window.location.href = url;
    });
  }
}

// Initialize Create Project Modal
function initializeCreateProjectModal() {
  const createProjectModal = document.getElementById("createProjectModal");
  createProjectModal.addEventListener("show.bs.modal", resetCreateProjectModal);
}

function refreshProjects() {
  populateMyProjects();
}

document.addEventListener("DOMContentLoaded", initializePage);