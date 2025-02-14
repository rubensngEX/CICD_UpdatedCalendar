import { customFetch } from "../components/customFetch.js";
document.addEventListener("DOMContentLoaded", async () => {
    if (!localStorage.getItem('token')) {
        window.location.href = "/login.html";
    } else {
        const team = await haveTeam();
        // alert (team + " at public index line 6" + typeof(team))
        // Redirect based on the "team" value stored in localStorage
        if (!team) {
            window.location.href = "./team/index.html";
        } else {
            window.location.href = "./myProjects/index.html";
        }
    }
});

async function haveTeam() {
  try {
    const data = await customFetch("/persons/id");
    // alert(data.teamId + "in haveTeam function public index")
    console.log(data);
    if (data.teamId==null) {
      return false;
    } else {
      localStorage.setItem("teamId", data.teamId)
      return true
    };
  }  catch (error) {
    console.error("Error fetching team:", error);
  }
}
