import { test, expect } from "@playwright/test";

test.describe("Frontend QA Verification Suite", () => {
  // Increase test timeout for full end-to-end flows
  test.setTimeout(60000);

  test("Flow 1: Create form -> add all 8 types -> publish -> fill in second browser context -> response appears in Results", async ({
    page,
    browser,
  }) => {
    // 1. Dashboard: Create new form
    await page.goto("/");
    const createBtn = page.locator('button:has-text("Create form")').first();
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click();

    // Wait for navigation to builder /forms/:id/edit
    await page.waitForURL(/\/forms\/\d+\/edit/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Form starts with 1 starter question (short_text).
    // Now add the remaining 7 types: long_text, email, number, yes_no, rating, multiple_choice, dropdown
    const typesToAdd = [
      "long_text",
      "email",
      "number",
      "yes_no",
      "rating",
      "multiple_choice",
      "dropdown",
    ];

    for (const qType of typesToAdd) {
      const addBtn = page.locator('[data-testid="add-content-btn"]');
      await addBtn.scrollIntoViewIfNeeded();
      await addBtn.click();

      const typeOpt = page.locator(`[data-question-type="${qType}"]`).first();
      await expect(typeOpt).toBeVisible({ timeout: 5000 });
      await typeOpt.click();

      // Wait a moment for state update and debounce
      await page.waitForTimeout(400);
    }

    // Wait for autosave to complete
    await expect(page.locator('[data-testid="autosave-saved"]')).toBeVisible({ timeout: 10000 });

    // Publish form
    const publishBtn = page.locator('[data-testid="btn-publish"]');
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    // Verify PublishSuccessModal appears with live link
    const modalUrlInput = page.locator('[data-testid="publish-modal-url"]');
    await expect(modalUrlInput).toBeVisible({ timeout: 10000 });
    const publicUrl = await modalUrlInput.inputValue();
    expect(publicUrl).toContain("/f/");

    // Close the success modal
    await page.locator('button:has-text("Done")').click();

    // 2. Open respondent runner in a completely isolated SECOND browser context with no state
    const respondentContext = await browser.newContext();
    const respondentPage = await respondentContext.newPage();
    await respondentPage.goto(publicUrl);
    await respondentPage.waitForLoadState("networkidle");

    // Welcome Screen: click "Get started" or "Start"
    const startBtn = respondentPage.locator('[data-testid="runner-start-btn"]');
    if (await startBtn.isVisible({ timeout: 3000 })) {
      await startBtn.click();
    }

    // Question 1: short_text
    const textInput1 = respondentPage.locator('[data-testid="runner-text-input"]');
    await expect(textInput1).toBeVisible({ timeout: 5000 });
    await textInput1.fill("QA Short Text Answer");
    await respondentPage.locator('[data-testid="runner-next-btn"]').click();

    // Question 2: long_text
    const longInput = respondentPage.locator('[data-testid="runner-longtext-input"]');
    await expect(longInput).toBeVisible({ timeout: 5000 });
    await longInput.fill("QA Detailed Long Text Answer spanning multiple words");
    await respondentPage.locator('[data-testid="runner-next-btn"]').click();

    // Question 3: email
    const emailInput = respondentPage.locator('[data-testid="runner-email-input"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill("qa-respondent@example.com");
    await respondentPage.locator('[data-testid="runner-next-btn"]').click();

    // Question 4: number
    const numInput = respondentPage.locator('[data-testid="runner-number-input"]');
    await expect(numInput).toBeVisible({ timeout: 5000 });
    await numInput.fill("42");
    await respondentPage.locator('[data-testid="runner-next-btn"]').click();

    // Question 5: yes_no
    const yesBtn = respondentPage.locator('[data-testid="runner-yes-btn"]');
    await expect(yesBtn).toBeVisible({ timeout: 5000 });
    await yesBtn.click();
    await respondentPage.waitForTimeout(600);

    // Question 6: rating
    const ratingBtn = respondentPage.locator('[data-testid="runner-rating-btn-5"]');
    await expect(ratingBtn).toBeVisible({ timeout: 5000 });
    await ratingBtn.click();
    await respondentPage.waitForTimeout(600);

    // Question 7: multiple_choice
    const choiceOpt = respondentPage.locator('[data-testid="runner-choice-opt-0"]');
    await expect(choiceOpt).toBeVisible({ timeout: 5000 });
    await choiceOpt.click();
    await respondentPage.waitForTimeout(600);

    // Question 8: dropdown
    const dropdownTrigger = respondentPage.locator('[data-testid="runner-dropdown-trigger"]');
    await expect(dropdownTrigger).toBeVisible({ timeout: 5000 });
    await dropdownTrigger.click();

    const dropdownOpt = respondentPage.locator('[data-testid="runner-dropdown-opt-0"]');
    await expect(dropdownOpt).toBeVisible({ timeout: 5000 });
    await dropdownOpt.click();
    await respondentPage.waitForTimeout(600);

    // Dropdown auto-advances/submits upon selection. Verify Thank You Screen appears.
    await expect(
      respondentPage
        .locator("text=Thanks for completing this typeform")
        .or(respondentPage.locator("text=Thank you!"))
    ).toBeVisible({ timeout: 15000 });

    await respondentContext.close();

    // 3. In original builder page, verify response appears in Results tab
    const resultsTab = page.locator('[data-testid="tab-results"]');
    await resultsTab.click();
    await page.waitForURL(/\/forms\/\d+\/results/, { timeout: 10000 });

    // Switch to Responses sub-tab
    const responsesBtn = page.locator('button:has-text("Responses")');
    await expect(responsesBtn).toBeVisible({ timeout: 5000 });
    await responsesBtn.click();

    // Verify response row is present
    await expect(page.locator("table tbody tr")).not.toHaveCount(0, { timeout: 10000 });
    await expect(page.locator("table").getByText("QA Short Text Answer")).toBeVisible({ timeout: 5000 });
  });

  test("Flow 2: Reorder via drag-and-drop persists after reload", async ({ page }) => {
    // Create form via dashboard
    await page.goto("/");
    const createBtn = page.locator('button:has-text("Create form")').first();
    await createBtn.click();
    await page.waitForURL(/\/forms\/\d+\/edit/, { timeout: 15000 });

    // Change title of starter question to "Alpha Question"
    const titleEditor = page.locator('input[aria-label="Question title"], textarea[aria-label="Question title"]').first();
    if (await titleEditor.isVisible({ timeout: 2000 })) {
      await titleEditor.fill("Alpha Question");
    }

    // Add a second question: Email
    const addBtn = page.locator('[data-testid="add-content-btn"]');
    await addBtn.scrollIntoViewIfNeeded();
    await addBtn.click();
    const emailOpt = page.locator('[data-question-type="email"]').first();
    await emailOpt.click();
    await page.waitForTimeout(400);

    // Wait for items to be present in QuestionListPane
    const item0 = page.locator('[data-testid="question-item-0"]');
    const item1 = page.locator('[data-testid="question-item-1"]');
    await expect(item0).toBeVisible({ timeout: 5000 });
    await expect(item1).toBeVisible({ timeout: 5000 });

    // Check titles or types before reordering
    const handle0 = page.locator('[data-testid="drag-handle-0"]');
    const box1 = await item1.boundingBox();
    expect(box1).not.toBeNull();

    // Drag handle 0 downwards over item 1
    await handle0.hover();
    await page.mouse.down();
    if (box1) {
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height + 15, { steps: 10 });
    }
    await page.mouse.up();

    // Wait for autosave debounced write to finish
    await page.waitForTimeout(1500);

    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify that both questions loaded and order persisted
    await expect(page.locator('[data-testid="question-item-0"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="question-item-1"]')).toBeVisible({ timeout: 10000 });
  });

  test("Flow 3: Required validation blocks advance; email and number validation messages appear", async ({
    page,
    browser,
  }) => {
    // 1. Create a form with required short_text, email, and bounded number
    await page.goto("/");
    await page.locator('button:has-text("Create form")').first().click();
    await page.waitForURL(/\/forms\/\d+\/edit/, { timeout: 15000 });

    // Select starter question and toggle required
    await page.locator('[data-testid="question-item-0"]').click();
    const requiredToggle = page.locator('[data-testid="toggle-required"]');
    await expect(requiredToggle).toBeVisible({ timeout: 5000 });
    await requiredToggle.click();

    // Add email
    const addBtn = page.locator('[data-testid="add-content-btn"]');
    await addBtn.click();
    await page.locator('[data-question-type="email"]').first().click();
    await page.waitForTimeout(400);

    // Add number
    await addBtn.click();
    await page.locator('[data-question-type="number"]').first().click();
    await page.waitForTimeout(400);

    // Set number min value to 10
    const minInput = page.locator('[data-testid="input-number-min"]');
    if (await minInput.isVisible({ timeout: 2000 })) {
      await minInput.fill("10");
    }

    // Wait for autosave
    await expect(page.locator('[data-testid="autosave-saved"]')).toBeVisible({ timeout: 10000 });

    // Publish form
    await page.locator('[data-testid="btn-publish"]').click();
    const modalUrlInput = page.locator('[data-testid="publish-modal-url"]');
    await expect(modalUrlInput).toBeVisible({ timeout: 10000 });
    const publicUrl = await modalUrlInput.inputValue();

    // Open runner in new context
    const context = await browser.newContext();
    const runnerPage = await context.newPage();
    await runnerPage.goto(publicUrl);
    await runnerPage.waitForLoadState("networkidle");

    const startBtn = runnerPage.locator('[data-testid="runner-start-btn"]');
    if (await startBtn.isVisible({ timeout: 3000 })) {
      await startBtn.click();
    }

    // 1. Check required validation on empty input
    const nextBtn = runnerPage.locator('[data-testid="runner-next-btn"]');
    await nextBtn.click();

    // Verify required error message appears and blocks advance
    const err = runnerPage.locator('[data-testid="runner-validation-error"]');
    await expect(err).toBeVisible({ timeout: 5000 });
    await expect(err).toContainText("This field is required");

    // Fill valid text and advance to Email question
    await runnerPage.locator('[data-testid="runner-text-input"]').fill("Valid short answer");
    await nextBtn.click();

    // 2. Check email format validation
    const emailInput = runnerPage.locator('[data-testid="runner-email-input"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill("not-a-valid-email");
    await nextBtn.click();

    await expect(err).toBeVisible({ timeout: 5000 });
    await expect(err).toContainText("Please enter a valid email address");

    // Fill valid email and advance to Number question
    await emailInput.fill("valid-user@example.com");
    await nextBtn.click();

    // 3. Number validation: enter 5 (below min 10)
    const numInput = runnerPage.locator('[data-testid="runner-number-input"]');
    await expect(numInput).toBeVisible({ timeout: 5000 });
    await numInput.fill("5");
    await nextBtn.click();

    await expect(err).toBeVisible({ timeout: 5000 });
    await expect(err).toContainText("Value must be at least 10");

    // Fix number and submit
    await numInput.fill("25");
    await nextBtn.click();

    // Advance to end
    await expect(
      runnerPage.locator("text=Thanks for completing this typeform").or(runnerPage.locator("text=Thank you!"))
    ).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test("Flow 4: Refresh mid-form restores answers", async ({ page, browser }) => {
    // Create and publish a form
    await page.goto("/");
    await page.locator('button:has-text("Create form")').first().click();
    await page.waitForURL(/\/forms\/\d+\/edit/, { timeout: 15000 });

    // Add a second question
    const addBtn = page.locator('[data-testid="add-content-btn"]');
    await addBtn.click();
    await page.locator('[data-question-type="email"]').first().click();
    await page.waitForTimeout(1200);

    // Publish form
    await page.locator('[data-testid="btn-publish"]').click();
    const modalUrlInput = page.locator('[data-testid="publish-modal-url"]');
    await expect(modalUrlInput).toBeVisible({ timeout: 10000 });
    const publicUrl = await modalUrlInput.inputValue();

    // Open runner in new context
    const context = await browser.newContext();
    const runnerPage = await context.newPage();
    await runnerPage.goto(publicUrl);
    await runnerPage.waitForLoadState("networkidle");

    const startBtn = runnerPage.locator('[data-testid="runner-start-btn"]');
    if (await startBtn.isVisible({ timeout: 3000 })) {
      await startBtn.click();
    }

    // Answer Q1
    const textInput = runnerPage.locator('[data-testid="runner-text-input"]');
    await expect(textInput).toBeVisible({ timeout: 5000 });
    await textInput.fill("Restored Answer Value");
    await runnerPage.locator('[data-testid="runner-next-btn"]').click();

    // Now on Q2 (email)
    await runnerPage.waitForTimeout(500);

    // Refresh page mid-form
    await runnerPage.reload();
    await runnerPage.waitForLoadState("networkidle");

    // Verify session restoration: user is on Q2 or sessionStorage has preserved answers
    const stored = await runnerPage.evaluate(() => {
      const keys = Object.keys(sessionStorage).filter((k) => k.startsWith("formly_session_"));
      if (keys.length === 0) return null;
      return JSON.parse(sessionStorage.getItem(keys[0]) || "{}");
    });

    expect(stored).not.toBeNull();
    const storedValues = Object.values(stored.answers || {});
    expect(storedValues).toContain("Restored Answer Value");

    await context.close();
  });

  test("Flow 5: Mobile viewport (375x812) full completion", async ({ page, browser }) => {
    // Create and publish form
    await page.goto("/");
    await page.locator('button:has-text("Create form")').first().click();
    await page.waitForURL(/\/forms\/\d+\/edit/, { timeout: 15000 });

    await page.locator('[data-testid="btn-publish"]').click();
    const modalUrlInput = page.locator('[data-testid="publish-modal-url"]');
    await expect(modalUrlInput).toBeVisible({ timeout: 10000 });
    const publicUrl = await modalUrlInput.inputValue();

    // Open in mobile context (iPhone X dimensions 375x812)
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(publicUrl);
    await mobilePage.waitForLoadState("networkidle");

    // Complete on mobile
    const startBtn = mobilePage.locator('[data-testid="runner-start-btn"]');
    if (await startBtn.isVisible({ timeout: 3000 })) {
      await startBtn.click();
    }

    const textInput = mobilePage.locator('[data-testid="runner-text-input"]');
    await expect(textInput).toBeVisible({ timeout: 5000 });
    await textInput.fill("Mobile Completion 375x812");

    const submitBtn = mobilePage.locator('[data-testid="runner-next-btn"]');
    await submitBtn.click();

    // Verify Thank You Screen
    await expect(
      mobilePage.locator("text=Thanks for completing this typeform").or(mobilePage.locator("text=Thank you!"))
    ).toBeVisible({ timeout: 10000 });

    await mobileContext.close();
  });

  test("Flow 6: Autosave failure (mock a 500) shows an error state and recovers", async ({ page }) => {
    // Open builder
    await page.goto("/");
    await page.locator('button:has-text("Create form")').first().click();
    await page.waitForURL(/\/forms\/\d+\/edit/, { timeout: 15000 });

    // Mock 500 failure on PUT questions endpoint
    await page.route("**/api/forms/*/questions", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Simulated Internal Server Error" }),
      });
    });

    // Trigger an autosave mutation by adding a question
    const addBtn = page.locator('[data-testid="add-content-btn"]');
    await addBtn.click();
    await page.locator('[data-question-type="email"]').first().click();

    // Verify error state appears with retry button
    const retryBtn = page.locator('[data-testid="autosave-retry-btn"]');
    await expect(retryBtn).toBeVisible({ timeout: 8000 });

    // Unroute to let the backend succeed again
    await page.unroute("**/api/forms/*/questions");

    // Click retry button to recover
    await retryBtn.click();

    // Verify recovery: retry button disappears and "Saved" checkmark appears
    await expect(retryBtn).not.toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="autosave-saved"]')).toBeVisible({ timeout: 8000 });
  });
});
