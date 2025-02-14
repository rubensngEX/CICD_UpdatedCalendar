const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3001/login.html");
  await page.getByPlaceholder("Username or Email").click();
  await page.getByPlaceholder("Username or Email").fill("carol@example.com");
  await page.locator("#password").click();
  await page.locator("#password").fill("carolpass123");
  await page.getByRole("button", { name: "LOGIN" }).click();
});

test.describe("Manage Project Page", () => {
  test("Should be able to create a new project", async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Create New Project' }).first()).toBeVisible();
    page.getByRole("button", { name: "Create New Project" }).first().click();
    await expect(page
      .locator("div")
      .filter({
        hasText:
          "Project Name Project Description Project Deadline Add Developers? No Yes Select",
      })
      .nth(3)).toBeVisible();
    await page
      .locator("div")
      .filter({
        hasText:
          "Project Name Project Description Project Deadline Add Developers? No Yes Select",
      })
      .nth(3)
      .click();
    
      await page.getByRole('textbox', { name: 'Project Name' }).click();
      await page.getByRole('textbox', { name: 'Project Name' }).fill('TestProject');
      await page.getByRole('textbox', { name: 'Project Description' }).click();
      await page.getByRole('textbox', { name: 'Project Description' }).fill('Testing 1, 2, 3, 4 , 5, 6, 7, 8, 9, 10');
      await page.getByLabel('Project Deadline').fill('2026-01-01');  

      await page.getByLabel('Add Developers?').selectOption('yes');
      await page.getByLabel('Frank Wilson').check();
      await page.getByRole('button', { name: 'Create Project' }).click();

      await expect(page.getByText("TestProject")).toBeVisible();
      await page.getByText('TestProject').click();
      await expect(page.locator("#projectDetails")).toBeVisible();

      await page.getByRole('button', { name: 'Add Developer' }).click();

      await page.getByLabel('Add New Developer').getByText('Ivan Martinez').click();
      await page.getByRole('button', { name: 'Add Developers' }).click();
      await expect(page.getByRole('cell', { name: 'Ivan Martinez' })).toBeVisible;
      await page.getByRole('button', { name: 'Manage Project' }).click();
      await page.getByRole('button', { name: 'Add new task' }).click();
      await page.getByLabel("Ivan Martinez 0 (Very free)").check();
      await page.getByPlaceholder('Enter task name').click();
      await page.getByPlaceholder('Enter task name').fill('TestTask123');
      await page.getByRole('button', { name: 'Add Task' }).click();
      await page.getByRole('link', { name: 'My Projects' }).click();
      await page.getByText('TestProject').click();
      await expect(page.getByRole("cell", { name: "1" }).nth(1)).toBeVisible();
      await page.getByRole('button', { name: 'Transfer Developer' }).click();
      await page.getByRole('button', { name: 'Transfer', exact: true }).click();
      await expect(page.getByRole("cell", { name: "1" }).nth(1)).toBeVisible();
      await page.getByRole('button', { name: 'Remove Developer' }).nth(1).click();
      await page.getByRole('button', { name: 'Confirm' }).click();
      await page.getByRole('button', { name: 'Edit Project' }).nth(1).click();
      await page.getByRole('textbox', { name: 'Project Name' }).click();
      await page.getByRole('textbox', { name: 'Project Name' }).fill('TestProject Updated');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await expect(page.getByText('TestProject Updated', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Delete Project' }).nth(1).click();
  });
});

