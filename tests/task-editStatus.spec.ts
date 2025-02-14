import { test, expect } from '@playwright/test';

test('Can edit task status', async ({page}) => {
    // Go to login
    await page.goto('http://localhost:3000/login.html');

    // Fill in the login form
    await page.getByPlaceholder('Username or Email').fill('frank@example.com');

    // Select the password input field
    await page.locator('#password').fill('frankpass123');

    // Submit the login form
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Go to All Tasks page
    await page.getByRole('link', { name: 'All Tasks' }).click();

    // Select a task
    const taskId = '231';
    await page.locator(`div.task-card[data-task-id="${taskId}"]`).click();

    // Edit the status for the selected task
    const srNo = 3;
    const taskRow = await page.locator("#tasksTableBody tr").nth(srNo - 1);
    const taskStatusDropdown = await taskRow.locator(".task-status-select");

        // Get the current status
        const currentStatus = await taskStatusDropdown.inputValue();

        // Check the current status and update it accordingly
        if (currentStatus === 'PENDING') {
        await taskStatusDropdown.selectOption('IN_PROGRESS');
        } else if (currentStatus === 'IN_PROGRESS') {
        await taskStatusDropdown.selectOption('COMPLETED');
        } else if (currentStatus === 'COMPLETED') {
        await taskStatusDropdown.selectOption('ON_HOLD');
        } else if (currentStatus === 'ON_HOLD') {
        await taskStatusDropdown.selectOption('PENDING');
        }

        // Check the updated status
        const selectedStatus = await taskStatusDropdown.inputValue();
        expect(selectedStatus).not.toBe(currentStatus);

    // Submit
    await page.locator('button.update-btn').click();
});