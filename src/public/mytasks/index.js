import { customFetch } from "../components/customFetch.js";
// Utility function to set a loading indicator

function showLoadingIndicator(element) {
    element.innerHTML = "<p>Loading...</p>";
}

const notyf = new Notyf();
let allTasks = []; // Global variable to store tasks

async function populateMyTasks() {
    const personId = localStorage.getItem("personId");
    const myTasksContainer = document.getElementById("taskContainer");
    const noTask = document.getElementById("noTask");
    showLoadingIndicator(myTasksContainer);

    try {
        allTasks = await customFetch(`/tasks/member/${personId}`);

        if (allTasks.length > 0) {
            noTask.style.display = "none";
            populateAssignedTasks(allTasks);
        } else {
            myTasksContainer.innerHTML = "<p>No tasks found</p>";
            noTask.style.display = "block";
        }
    } catch (error) {
        console.error("Error fetching tasks:", error);
    }
}

function populateAssignedTasks(tasks) {
    const taskContainer = document.getElementById("taskContainer");
    taskContainer.innerHTML = ""; // Clear existing items

    tasks.forEach((task) => {
        const taskCard = document.createElement("div");
        taskCard
        taskCard.addEventListener('click', function () {
            // Assuming `task.task.id` is the task ID you want to transfer
            const taskId = task.task.id;
          
            // Redirect to another page with the task ID as a query parameter
            window.location.href = `../../singleProject/index.html?projId=${task.task.Project.id}&projName=${task.task.Project.name}&taskId=${task.task.name}`;
          });
          
        taskCard.classList.add("task-card");
        taskCard.setAttribute("data-task-id", task.task.id); // Add taskId as a data attribute

        // Construct task card content
        taskCard.innerHTML = `
            <h3>${task.task.name}</h3>
            <p><span class="priority">Priority:</span> ${task.task.priority}</p>
            <p><span class="priority">Status:</span> ${task.task.status}</p>
 
        `;

        // Status handling
        // const statusContainer = document.createElement("span");
        // statusContainer.textContent = `${task.task.status}`
        // statusContainer.classList.add("status-container");

        // const statusText = document.createElement("span");
        // statusText.classList.add("status-text");
        // const statusDropdown = document.createElement("select");
        // statusDropdown.classList.add("status-dropdown");

        // Add status options
        // ["In Progress", "Pending", "Completed", "On Hold"].forEach((status) => {
        //     const option = document.createElement("option");
        //     option.value = status;
        //     option.textContent = status;
        //     if (status.toLowerCase() === task.task.status.toLowerCase()) {
        //         option.selected = true;
        //     }
        //     statusDropdown.appendChild(option);
        // });

        // statusDropdown.addEventListener("change", () => {
        //     const newStatus = statusDropdown.value;
        //     statusText.textContent = `Status: ${newStatus}`;
        //     alert(`Task "${task.task.name}" updated to "${newStatus}"`);
        // });

        // statusContainer.appendChild(statusText);
        // statusContainer.appendChild(statusDropdown);
        // taskCard.appendChild(statusContainer);

        taskContainer.appendChild(taskCard);
    });
}

function filterTasks() {
    const selectedStatus = document.getElementById("statusFilter").value.toLowerCase();
    const searchQuery = document.getElementById("taskSearch").value.toLowerCase();

    const filteredTasks = allTasks.filter((task) => {
        const matchesStatus =
            selectedStatus === "all" || task.task.status.toLowerCase() === selectedStatus;
        const matchesSearch = task.task.name.toLowerCase().includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    populateAssignedTasks(filteredTasks);
}

function scrollToTask(taskId) {
    const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskCard) {
        taskCard.scrollIntoView({ behavior: "smooth" });
        taskCard.classList.add("highlight");
        setTimeout(() => taskCard.classList.remove("highlight"), 2000);
    } else {
        console.warn(`Task with ID ${taskId} not found`);
    }
}

function goToNotiTask() {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get("taskId");
    if (taskId) {
        scrollToTask(taskId);
    }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
    await populateMyTasks();
    goToNotiTask();
});

document.getElementById("statusFilter").addEventListener("change", filterTasks);
document.getElementById("taskSearch").addEventListener("input", filterTasks);
