const { test, expect } = require('@playwright/test');

async function loginAs(page, name) {
  await page.goto('http://localhost:3001/login.html'); // Replace with your login page URL

  // Fill out the login form
  await page.fill('#usernameOrEmail', name); 
  if (typeof name === "string" && name.trim().length > 0) {
    await page.fill('#password', name.split(" ")[0].toLowerCase() + 'pass123');
} else {
    console.error("Invalid name value");
}

  // Submit the login form
  await page.getByRole('button', { name: 'LOGIN' }).click(); // Matches a button with the text 'Submit'

  // Wait for navigation to the project management page
  await expect(page).toHaveURL(/myProjects/); // Adjust the URL pattern based on your application
}

async function createProject(page, name, desc) {
  // await page.goto('http://localhost:3001/myProjects/index.html'); // Adjust to your app's starting point
  await page.getByRole('button', { name: 'Create New Project' }).last().click();
  await page.fill('#projectName', name); 
  await page.fill('#projectDescription', desc); 
  await page.selectOption('#addDevelopers', 'yes'); 
  await page.click('#selectAllDeveloperButton'); 
  await page.getByRole('button', { name: 'Create Project' }).click(); 

  // Wait for the project page or a success message to appear
  await page.waitForSelector('#projectList');  // Adjust based on your actual project list selector
}

test.describe('Notification', () => {
  test('should show red dot on notification bell for newly added developer', async ({ page }) => {
    // Step 1: Login as Bob
    await loginAs(page, 'Bob Johnson');  // Await for login completion

    // Step 2: Create a new project
    await createProject(page, 'test1', 'lee');  // Await for project creation

    // Step 3: Logout (uncomment and adjust as needed)
    // await page.click('#profileIcon'); // Replace with actual profile circle locator
    // await page.click('#logout'); // Replace with actual logout button locator

    // Step 4: Login as Bob
    await loginAs(page, 'Heidi Anderson');  // Await for login as Bob

    // Step 5: Check for red dot on notification bell
    const bellRedDot = page.locator('#bell-red-dot');
    await expect(bellRedDot).toBeVisible(); // Verify red dot appears
  });

  test('should highlight new notification and navigate to project page when clicked', async ({ page }) => {
    await loginAs(page, 'Bob Johnson');  // Await for login completion

    await createProject(page, 'test2', 'mmsp');  // Await for project creation

    // Login as Bob
    await loginAs(page, 'Heidi Anderson'); // Await for login completion

    // Check that the red dot appears on the notification bell
    const bellRedDot = page.locator('#bell-red-dot');
    await expect(bellRedDot).toBeVisible(); // Ensure red dot is visible

    // Click on the notification bell icon
    await page.click('#notiBell'); // Replace with actual notification bell locator

    // Locate all notifications with the bold and clickable-notification classes
    const notifications = page.locator('.clickable-notification.bold');

    // Check if there are any notifications by ensuring the count is greater than 0
    const notificationCount = await notifications.count();
    expect(notificationCount).toBeGreaterThan(0); // Ensure at least one notification exists

    // Handle the first visible notification
    const firstVisibleNotification = notifications.first();
    await expect(firstVisibleNotification).toBeVisible(); // Ensure it is visible

    // Click on the highlighted notification
    await firstVisibleNotification.click();

    // Step 7: Verify navigation to the project page
    await expect(page).toHaveURL(/\/assignedProjects\/\?projectId=/); // Adjusted regex to allow the trailing slash
  });

});
