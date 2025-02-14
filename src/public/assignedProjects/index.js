import { customFetch } from "../components/customFetch.js";
import { showProjectTasksChart } from "../components/myChart.js";

// eslint-disable-next-line no-unused-vars
const notyf = new Notyf();
const projectCache = new Map();
let currentIndexProj;
// Utility function to display a loading indicator
function showLoadingIndicator(element) {
  element.innerHTML = "<p>Loading...</p>";
}

let loading = true;
const loadingSpinner = document.querySelector('.loading-spinner');
const contentContainer = document.querySelector('.content-container');
const noProjDiv = document.getElementById('noProj');

function showLoading() {
    loading = true;
    loadingSpinner.classList.add('show');
    contentContainer.classList.remove('loaded');
    noProjDiv.classList.remove('show');
}

function hideLoading(projects) {
    loadingSpinner.style.display = 'none';
    contentContainer.style.display = 'block';
    loading = false;
    if (projects.length === 0) {
        noProjDiv.style.display = 'block';
    }
}

// Populate the list of assigned projects
async function populateAssignedProjects() {

  const projectListContainer = document.getElementById("projectList");
  const noProj = document.getElementById("noProj");
  showLoadingIndicator(projectListContainer);

  try {
    const projects = await customFetch(`/projects/asDeveloper/`);
    const left = document.querySelector(".left-column");
    const right =  document.querySelector(".right-column");
    const noProj =  document.getElementById("noProj");
    if (projects.length > 0) {
      left.classList.remove("empty");
      right.classList.remove("empty");
      noProj.classList.add("empty");

      if(currentIndexProj === null || currentIndexProj === undefined) {
        linkManageProjButton(projects[0].id, projects[0].name);
        renderProjectList(projects);
      } else {
        linkManageProjButton(projects[currentIndexProj].id, projects[currentIndexProj].name);
        renderProjectList(projects);
      }
    } else {
      console.log("in else ")
      left.classList.add("empty");
      right.classList.add("empty");
      noProj.classList.remove("empty");
      
    }
    hideLoading(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    hideLoading([]);
  }
}

// Render the project list
function renderProjectList(projects) {
  const projectList = document.getElementById("projectList");
  const fragment = document.createDocumentFragment();

  projects.forEach((project, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = project.name;
    listItem.style.cursor = "pointer";

    listItem.addEventListener("click", () => {
      document.querySelectorAll("li").forEach(item => item.classList.remove("selected"));
      listItem.classList.add("selected");

      populateProjectDetail(project.id);
      linkManageProjButton(project.id, project.name);
    });
    
    fragment.appendChild(listItem);

    if(currentIndexProj === null || currentIndexProj === undefined) {
      if (index === 0) {
        listItem.classList.add("selected");
        populateProjectDetail(project.id);
        linkManageProjButton(project.id, project.name);
      }
    } else {
      if (index === currentIndexProj) {
        listItem.classList.add("selected");
        populateProjectDetail(project.id);
        linkManageProjButton(project.id, project.name);
      }
    }
  });

  projectList.innerHTML = "";
  projectList.appendChild(fragment);
}

// Populate project details
async function populateProjectDetail(projectId) {
  const projectDetailsContainer = document.getElementById("projectDetails");

  if (projectCache.has(projectId)) {
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
    <h2>Project Summary</h2>
    <p>
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
      <button id="viewFilesButton" class="view-files-btn">View Files</button><br>
    </p>`;

  // Event listener for navigating to the files page
  document.getElementById("viewFilesButton").addEventListener("click", () => {
    window.location.href = `../files/index.html?project=${project.id}`;
  });
  // Developer Task Distribution Table
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
    </tr>`;

  project.developersDetail.developers.forEach((developer) => {
    const row = document.createElement("tr");
    const totalTasks = Object.values(developer.taskCountsByStatus).reduce(
      (sum, count) => sum + count,
      0
    );

    row.innerHTML = `
      <td>${developer.name}</td>
      <td>${developer.taskCountsByStatus.COMPLETED || 0}</td>
      <td>${developer.taskCountsByStatus.IN_PROGRESS || 0}</td>
      <td>${developer.taskCountsByStatus.PENDING || 0}</td>
      <td>${developer.taskCountsByStatus.ON_HOLD || 0}</td>
      <td>${totalTasks}</td>`;
    developerTable.appendChild(row);
  });

  projectDetails.appendChild(developerTable);

  // Show Pie Chart for Task Summary
  if (project.tasksDetails.totalTasks > 0) {
    showProjectTasksChart(project.tasksDetails, (clickedStatus) =>
      onLegendClick(clickedStatus, project)
    );

  } else {
    const chartContainer = document.querySelector(".chart-container");
    if (chartContainer) chartContainer.style.display = "none";
  }
}
function onLegendClick(clickedStatus, project) {
  const developerTable = document.querySelector(".developer-table");
  const headerRow = developerTable.querySelector("tr:first-child"); // The header row
  const rows = developerTable.querySelectorAll("tr:not(:first-child)"); // Exclude header row
  const totalTasksElement = document.querySelector(
    "#projectDetails p b:nth-of-type(3)"
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
    const totalCell = columns[columns.length - 1]; // Last column for total tasks
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
  });

  // Update the total tasks in the project summary
  totalTasksElement.textContent = currentTotalTasks;
}

// Link Manage Project Button
function linkManageProjButton(projectId, projectName) {
  const manageProjButton = document.getElementById("manageProjButton");
  if (manageProjButton) {
    manageProjButton.addEventListener("click", () => {
      const url = `../../singleProject/index.html?projId=${projectId}&projName=${projectName}`;
      window.location.href = url;
    });
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
    showLoading();
    try {
        await populateAssignedProjects();
    } catch (error) {
        console.error("Error loading projects:", error);
    } finally {
        // hideLoading();
    }
});
